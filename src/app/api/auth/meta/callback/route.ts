import { NextRequest, NextResponse } from 'next/server';

const APP_ID = process.env.META_APP_ID!;
const APP_SECRET = process.env.META_APP_SECRET!;
const REDIRECT_URI = 'https://holydash.vercel.app/api/auth/meta/callback';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect('https://holydash.vercel.app?meta_error=true');
  }

  if (!code) {
    return NextResponse.json({ error: 'Code não encontrado' }, { status: 400 });
  }

  try {
    // Trocar code pelo access token
    const tokenRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${APP_ID}&redirect_uri=${REDIRECT_URI}&client_secret=${APP_SECRET}&code=${code}`);
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return NextResponse.json({ error: 'Token não gerado', details: tokenData }, { status: 400 });
    }

    // Trocar por token de longa duração
    const longTokenRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${tokenData.access_token}`);
    const longTokenData = await longTokenRes.json();

    const finalToken = longTokenData.access_token || tokenData.access_token;

    // Salvar no Supabase
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    await fetch(`${SUPABASE_URL}/rest/v1/taxas_config?id=eq.config`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ meta_access_token: finalToken }),
    });

    return NextResponse.redirect('https://holydash.vercel.app?meta_connected=true');

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
