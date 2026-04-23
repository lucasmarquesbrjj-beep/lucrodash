import { NextRequest, NextResponse } from 'next/server';

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const maxDuration = 60;

function nowBrasilia() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
}

function getDateRange(filter: string) {
  const now = nowBrasilia();
  let from: string;
  let to: string = new Date().toISOString();

  if (filter === 'today') {
    const s = new Date(now); s.setHours(0, 0, 0, 0);
    from = new Date(s.getTime() + 3 * 3600000).toISOString();
  } else if (filter === 'yesterday') {
    const s = new Date(now); s.setDate(s.getDate() - 1); s.setHours(0, 0, 0, 0);
    const e = new Date(now); e.setHours(0, 0, 0, 0);
    from = new Date(s.getTime() + 3 * 3600000).toISOString();
    to   = new Date(e.getTime() + 3 * 3600000).toISOString();
  } else if (filter === 'anteontem') {
    const s = new Date(now); s.setDate(s.getDate() - 2); s.setHours(0, 0, 0, 0);
    const e = new Date(now); e.setDate(e.getDate() - 1); e.setHours(0, 0, 0, 0);
    from = new Date(s.getTime() + 3 * 3600000).toISOString();
    to   = new Date(e.getTime() + 3 * 3600000).toISOString();
  } else if (filter === '7d') {
    const s = new Date(now); s.setDate(s.getDate() - 7); s.setHours(0, 0, 0, 0);
    from = new Date(s.getTime() + 3 * 3600000).toISOString();
  } else if (filter === '30d') {
    const s = new Date(now); s.setDate(s.getDate() - 30); s.setHours(0, 0, 0, 0);
    from = new Date(s.getTime() + 3 * 3600000).toISOString();
  } else if (filter === 'year') {
    const s = new Date(now.getFullYear(), 0, 1);
    from = new Date(s.getTime() + 3 * 3600000).toISOString();
  } else if (filter === 'lastyear') {
    const s = new Date(now.getFullYear() - 1, 0, 1);
    const e = new Date(now.getFullYear(), 0, 1);
    from = new Date(s.getTime() + 3 * 3600000).toISOString();
    to   = new Date(e.getTime() + 3 * 3600000).toISOString();
  } else if (filter.startsWith('custom:')) {
    const parts = filter.split(':');
    from = new Date(parts[1] + 'T00:00:00-03:00').toISOString();
    to   = new Date(parts[2] + 'T23:59:59-03:00').toISOString();
  } else {
    const s = new Date(now.getFullYear(), now.getMonth(), 1);
    from = new Date(s.getTime() + 3 * 3600000).toISOString();
  }

  return { from, to };
}

export async function GET(request: NextRequest) {
  const filter = request.nextUrl.searchParams.get('filter') || 'today';
  const { from, to } = getDateRange(filter);

  // Fetch ML token from Supabase
  const sbRes = await fetch(
    `${SB_URL}/rest/v1/taxas_config?id=eq.config&select=ml_access_token&limit=1`,
    { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }, cache: 'no-store' }
  );
  if (!sbRes.ok) return NextResponse.json({ error: 'Supabase error' }, { status: 500 });
  const sbData = await sbRes.json();
  const token = sbData[0]?.ml_access_token;
  if (!token) return NextResponse.json({ notConnected: true }, { status: 401 });

  // Get seller ID
  const meRes = await fetch('https://api.mercadolibre.com/users/me', {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!meRes.ok) return NextResponse.json({ error: 'Token ML inválido ou expirado', notConnected: true }, { status: 401 });
  const me = await meRes.json();
  const sellerId = me.id;

  // Paginate orders
  const allOrders: any[] = [];
  let offset = 0;
  const limit = 50;
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), 50000);

  try {
    while (allOrders.length < 5000) {
      const params = new URLSearchParams({
        seller: String(sellerId),
        'order.status': 'paid',
        'date_created.from': from,
        'date_created.to': to,
        sort: 'date_desc',
        limit: String(limit),
        offset: String(offset),
      });

      const res = await fetch(`https://api.mercadolibre.com/orders/search?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
        signal: abort.signal,
      });

      if (!res.ok) break;
      const body = await res.json();
      const orders: any[] = body.results || [];
      allOrders.push(...orders);

      if (orders.length < limit || allOrders.length >= (body.paging?.total ?? 0)) break;
      offset += limit;
    }
  } catch {}
  finally { clearTimeout(timer); }

  const faturamentoPago = allOrders.reduce((s, o) => s + (o.total_amount || 0), 0);
  const pedidosPagos = allOrders.length;
  const ticketMedio = pedidosPagos > 0 ? faturamentoPago / pedidosPagos : 0;

  const hourly = Array(24).fill(0);
  allOrders.forEach(o => {
    const h = new Date(new Date(o.date_created).toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })).getHours();
    hourly[h] += o.total_amount || 0;
  });

  return NextResponse.json({ faturamentoPago, faturamentoBruto: faturamentoPago, pedidosPagos, pedidosGerados: pedidosPagos, ticketMedio, hourly });
}
