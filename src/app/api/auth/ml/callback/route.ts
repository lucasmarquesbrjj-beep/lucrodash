import { NextRequest, NextResponse } from 'next/server';

const APP_ID = process.env.ML_APP_ID!;
const APP_SECRET = process.env.ML_APP_SECRET!;
const REDIRECT_URI = 'https://holydash.vercel.app/api/auth/ml/callback';
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  console.log('[ML OAuth] Callback recebido', { code: code ? `${code.slice(0, 10)}...` : null, error });

  if (error || !code) {
    console.error('[ML OAuth] Sem code ou com erro:', { error });
    return NextResponse.redirect('https://holydash.vercel.app?ml_error=true');
  }

  // 1. Troca o code por access_token na API do Mercado Livre
  console.log('[ML OAuth] Trocando code por token...', { APP_ID, REDIRECT_URI });
  let tokenData: any;
  try {
    const tokenRes = await fetch('https://api.mercadolivre.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: APP_ID,
        client_secret: APP_SECRET,
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });
    tokenData = await tokenRes.json();
    console.log('[ML OAuth] Resposta do ML token:', {
      status: tokenRes.status,
      hasToken: !!tokenData.access_token,
      tokenType: tokenData.token_type,
      userId: tokenData.user_id,
      error: tokenData.error,
      errorDescription: tokenData.error_description,
    });
  } catch (err) {
    console.error('[ML OAuth] Falha ao chamar API do ML:', err);
    return NextResponse.redirect('https://holydash.vercel.app?ml_error=true');
  }

  if (!tokenData.access_token) {
    console.error('[ML OAuth] Token não recebido do ML:', tokenData);
    return NextResponse.redirect('https://holydash.vercel.app?ml_error=true');
  }

  // 2. Verifica se a coluna ml_access_token existe no Supabase
  console.log('[ML OAuth] Verificando coluna ml_access_token no Supabase...');
  const checkRes = await fetch(
    `${SB_URL}/rest/v1/taxas_config?id=eq.config&select=ml_access_token&limit=1`,
    { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }, cache: 'no-store' }
  );
  const checkBody = await checkRes.json().catch(() => null);
  const columnExists = checkRes.ok && !checkBody?.code && !checkBody?.message?.includes('does not exist');
  console.log('[ML OAuth] Coluna ml_access_token existe?', columnExists, { status: checkRes.status, body: checkBody });

  if (!columnExists) {
    // Tenta criar a coluna via /api/ml/setup antes de salvar o token
    console.log('[ML OAuth] Coluna não existe — tentando criar via /api/ml/setup...');
    try {
      const setupRes = await fetch(`${request.nextUrl.origin}/api/ml/setup`);
      const setupData = await setupRes.json();
      console.log('[ML OAuth] Setup resultado:', setupData);
      if (!setupData.ok) {
        console.error('[ML OAuth] Não foi possível criar a coluna. Execute manualmente:', setupData.sql);
        // Redireciona com ml_setup=true para o frontend mostrar instruções
        return NextResponse.redirect('https://holydash.vercel.app?ml_error=true&reason=column_missing');
      }
    } catch (err) {
      console.error('[ML OAuth] Erro ao chamar setup:', err);
    }
  }

  // 3. Salva o token no Supabase
  console.log('[ML OAuth] Salvando token no Supabase...');
  try {
    const patchRes = await fetch(`${SB_URL}/rest/v1/taxas_config?id=eq.config`, {
      method: 'PATCH',
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({ ml_access_token: tokenData.access_token }),
    });

    const patchStatus = patchRes.status;
    const patchBody = await patchRes.json().catch(() => patchRes.text());
    console.log('[ML OAuth] Supabase PATCH resultado:', { status: patchStatus, body: patchBody });

    if (!patchRes.ok) {
      console.error('[ML OAuth] Supabase PATCH falhou:', { status: patchStatus, body: patchBody });
      return NextResponse.redirect('https://holydash.vercel.app?ml_error=true');
    }

    // Verifica se o token foi salvo de fato
    const verifyRes = await fetch(
      `${SB_URL}/rest/v1/taxas_config?id=eq.config&select=ml_access_token&limit=1`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }, cache: 'no-store' }
    );
    const verifyData = await verifyRes.json();
    const saved = !!verifyData[0]?.ml_access_token;
    console.log('[ML OAuth] Verificação pós-save:', { saved, tokenPrefix: verifyData[0]?.ml_access_token?.slice(0, 20) });

    if (!saved) {
      console.error('[ML OAuth] Token NÃO foi salvo após PATCH.');
      return NextResponse.redirect('https://holydash.vercel.app?ml_error=true');
    }
  } catch (err) {
    console.error('[ML OAuth] Exceção ao salvar no Supabase:', err);
    return NextResponse.redirect('https://holydash.vercel.app?ml_error=true');
  }

  console.log('[ML OAuth] ✓ Token salvo com sucesso. Redirecionando para ml_connected=true');
  return NextResponse.redirect('https://holydash.vercel.app?ml_connected=true');
}
