import { NextRequest, NextResponse } from 'next/server';

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const maxDuration = 60;

// [FIX PERMANENTE - não remover]
// ML API rejeita datas em UTC (Z) — precisa de offset BRT explícito (-03:00)
// Ex: 2026-04-23T00:00:00.000-03:00 = meia-noite de Brasília
// Usar UTC Z causava retorno de TODOS os pedidos históricos (5000+)
function toMLDate(brtDate: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${brtDate.getFullYear()}-${pad(brtDate.getMonth() + 1)}-${pad(brtDate.getDate())}` +
    `T${pad(brtDate.getHours())}:${pad(brtDate.getMinutes())}:${pad(brtDate.getSeconds())}.000-03:00`
  );
}

function getBRT(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
}

function getDateRange(filter: string): { from: string; to: string } {
  const b = getBRT();
  const Y = b.getFullYear(), Mo = b.getMonth(), D = b.getDate();
  const pad = (n: number) => String(n).padStart(2, '0');

  let f: Date, t: Date;

  if (filter === 'today') {
    f = new Date(Y, Mo, D,   0, 0, 0, 0);
    t = new Date(Y, Mo, D,  23, 59, 59, 999);
  } else if (filter === 'yesterday') {
    f = new Date(Y, Mo, D-1, 0, 0, 0, 0);
    t = new Date(Y, Mo, D-1,23, 59, 59, 999);
  } else if (filter === 'anteontem') {
    f = new Date(Y, Mo, D-2, 0, 0, 0, 0);
    t = new Date(Y, Mo, D-2,23, 59, 59, 999);
  } else if (filter === '7d') {
    f = new Date(Y, Mo, D-7, 0, 0, 0, 0);
    t = new Date(Y, Mo, D,  23, 59, 59, 999);
  } else if (filter === '30d') {
    f = new Date(Y, Mo, D-30,0, 0, 0, 0);
    t = new Date(Y, Mo, D,  23, 59, 59, 999);
  } else if (filter === 'year') {
    f = new Date(Y,  0,  1,  0, 0, 0, 0);
    t = new Date(Y, 11, 31, 23, 59, 59, 999);
  } else if (filter === 'lastyear') {
    f = new Date(Y-1,0,  1,  0, 0, 0, 0);
    t = new Date(Y-1,11,31, 23, 59, 59, 999);
  } else if (filter.startsWith('custom:')) {
    const [,d1,d2] = filter.split(':');
    const [y1,m1,dd1] = d1.split('-').map(Number);
    const [y2,m2,dd2] = d2.split('-').map(Number);
    f = new Date(y1, m1-1, dd1, 0, 0, 0, 0);
    t = new Date(y2, m2-1, dd2,23,59,59,999);
  } else {
    // month (default)
    f = new Date(Y, Mo, 1,  0, 0, 0, 0);
    t = new Date(Y, Mo, D, 23, 59, 59, 999);
  }

  return { from: toMLDate(f), to: toMLDate(t) };
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
    headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
  });
  if (!meRes.ok) return NextResponse.json({ error: 'Token ML inválido ou expirado', notConnected: true }, { status: 401 });
  const me = await meRes.json();
  const sellerId = me.id;

  // Paginate orders — para quando bater o total real da API
  const allOrders: any[] = [];
  let offset = 0;
  const limit = 50;
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), 50000);

  try {
    while (true) {
      const params = new URLSearchParams({
        seller:              String(sellerId),
        'order.status':      'paid',
        'date_created.from': from,
        'date_created.to':   to,
        sort:                'date_desc',
        limit:               String(limit),
        offset:              String(offset),
      });

      const res = await fetch(`https://api.mercadolibre.com/orders/search?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
        signal: abort.signal,
      });

      if (!res.ok) break;
      const body = await res.json();
      const orders: any[] = body.results || [];
      const total: number = body.paging?.total ?? 0;

      allOrders.push(...orders);

      // Para quando não há mais páginas
      if (orders.length < limit || allOrders.length >= total) break;
      offset += limit;
    }
  } catch {}
  finally { clearTimeout(timer); }

  const faturamentoPago = allOrders.reduce((s, o) => s + (o.total_amount      || 0), 0);
  // [FIX PERMANENTE - não remover] taxaMlTotal = taxa real cobrada pelo ML (sale_fee_amount por pedido)
  const taxaMlTotal    = allOrders.reduce((s, o) => s + (o.sale_fee_amount    || 0), 0);
  const pedidosPagos   = allOrders.length;
  const ticketMedio    = pedidosPagos > 0 ? faturamentoPago / pedidosPagos : 0;

  const hourly = Array(24).fill(0);
  allOrders.forEach(o => {
    const h = new Date(new Date(o.date_created).toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })).getHours();
    hourly[h] += o.total_amount || 0;
  });

  return NextResponse.json({
    faturamentoPago, faturamentoBruto: faturamentoPago,
    pedidosPagos, pedidosGerados: pedidosPagos,
    ticketMedio,
    taxaMlTotal, // taxa real cobrada pelo ML (soma de sale_fee_amount)
    hourly,
  });
}
