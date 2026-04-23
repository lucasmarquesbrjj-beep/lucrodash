import { NextResponse } from 'next/server';

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Rota de diagnóstico — mostra estado completo da integração ML
export async function GET() {
  const result: Record<string, any> = {};

  // 1. Busca dados do Supabase
  const sbRes = await fetch(
    `${SB_URL}/rest/v1/taxas_config?id=eq.config&select=ml_access_token&limit=1`,
    { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }, cache: 'no-store' }
  );
  const sbBody = await sbRes.json().catch(() => null);
  result.supabase = {
    status: sbRes.status,
    columnExists: sbRes.ok && !sbBody?.code,
    hasToken: !!sbBody?.[0]?.ml_access_token,
    tokenPrefix: sbBody?.[0]?.ml_access_token?.slice(0, 30) + '...' || null,
    rawBody: sbBody,
  };

  const token = sbBody?.[0]?.ml_access_token;
  if (!token) {
    return NextResponse.json({
      ok: false,
      message: 'Token ML não encontrado no Supabase. Faça OAuth primeiro.',
      result,
    });
  }

  // 2. Testa token na API do ML (busca dados do usuário)
  const meRes = await fetch('https://api.mercadolivre.com/users/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const meBody = await meRes.json().catch(() => null);
  result.mlMe = { status: meRes.status, userId: meBody?.id, nickname: meBody?.nickname, error: meBody?.error };

  if (!meRes.ok) {
    return NextResponse.json({ ok: false, message: 'Token ML inválido ou expirado.', result });
  }

  // 3. Busca pedidos de hoje
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const params = new URLSearchParams({
    seller: String(meBody.id),
    'order.status': 'paid',
    'date_created.from': from,
    sort: 'date_desc',
    limit: '5',
    offset: '0',
  });
  const ordersRes = await fetch(`https://api.mercadolivre.com/orders/search?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const ordersBody = await ordersRes.json().catch(() => null);
  result.mlOrders = {
    status: ordersRes.status,
    total: ordersBody?.paging?.total,
    returned: ordersBody?.results?.length,
    firstOrder: ordersBody?.results?.[0] ? {
      id: ordersBody.results[0].id,
      status: ordersBody.results[0].status,
      total: ordersBody.results[0].total_amount,
      date: ordersBody.results[0].date_created,
    } : null,
    error: ordersBody?.error,
  };

  return NextResponse.json({ ok: true, result });
}
