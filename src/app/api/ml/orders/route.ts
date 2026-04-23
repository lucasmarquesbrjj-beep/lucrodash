import { NextRequest, NextResponse } from 'next/server';

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const maxDuration = 60;

// [FIX PERMANENTE - não remover]
// ML retorna datas com offset -04:00 — filtro DEVE usar -04:00 para ser reconhecido.
// UTC (Z) e -03:00 fazem ML ignorar o filtro e retornar TODOS os pedidos históricos.
// URL construída manualmente (sem URLSearchParams) para evitar encoding %3A nos colons.
// Parâmetros de data precisam do prefixo order. (order.date_created.from/to).
function toMLDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.000-04:00`
  );
}

function getMLLocal(): Date {
  // ML usa offset -04:00 — calcular datas no fuso America/Manaus (UTC-4)
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Manaus' }));
}

function getDateRange(filter: string): { from: string; to: string; dateFrom: string; dateTo: string } {
  const b = getMLLocal();
  const Y = b.getFullYear(), Mo = b.getMonth(), D = b.getDate();

  let f: Date, t: Date;

  if (filter === 'today') {
    f = new Date(Y, Mo, D,    0,  0,  0,   0);
    t = new Date(Y, Mo, D,   23, 59, 59, 999);
  } else if (filter === 'yesterday') {
    f = new Date(Y, Mo, D-1,  0,  0,  0,   0);
    t = new Date(Y, Mo, D-1, 23, 59, 59, 999);
  } else if (filter === 'anteontem') {
    f = new Date(Y, Mo, D-2,  0,  0,  0,   0);
    t = new Date(Y, Mo, D-2, 23, 59, 59, 999);
  } else if (filter === '7d') {
    f = new Date(Y, Mo, D-7,  0,  0,  0,   0);
    t = new Date(Y, Mo, D,   23, 59, 59, 999);
  } else if (filter === '30d') {
    f = new Date(Y, Mo, D-30, 0,  0,  0,   0);
    t = new Date(Y, Mo, D,   23, 59, 59, 999);
  } else if (filter === 'year') {
    f = new Date(Y,  0,  1,   0,  0,  0,   0);
    t = new Date(Y, 11, 31,  23, 59, 59, 999);
  } else if (filter === 'lastyear') {
    f = new Date(Y-1, 0,  1,  0,  0,  0,   0);
    t = new Date(Y-1,11, 31, 23, 59, 59, 999);
  } else if (filter.startsWith('custom:')) {
    const [, d1, d2] = filter.split(':');
    const [y1, m1, dd1] = d1.split('-').map(Number);
    const [y2, m2, dd2] = d2.split('-').map(Number);
    f = new Date(y1, m1-1, dd1,  0,  0,  0,   0);
    t = new Date(y2, m2-1, dd2, 23, 59, 59, 999);
  } else {
    // month (default)
    f = new Date(Y, Mo,  1,  0,  0,  0,   0);
    t = new Date(Y, Mo,  D, 23, 59, 59, 999);
  }

  return {
    from:     toMLDate(f),
    to:       toMLDate(t),
    dateFrom: toMLDate(f).slice(0, 10), // YYYY-MM-DD para ads API
    dateTo:   toMLDate(t).slice(0, 10),
  };
}

// Retorna { spend, available } — available=false quando falta scope de advertising
async function fetchAdsSpend(token: string, sellerId: number, dateFrom: string, dateTo: string): Promise<{ spend: number; available: boolean }> {
  try {
    const advRes = await fetch(
      `https://api.mercadolibre.com/advertising/advertisers?user_id=${sellerId}`,
      { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
    );
    if (!advRes.ok) return { spend: 0, available: false };
    const advData = await advRes.json();
    const advertiserId = Array.isArray(advData)
      ? (advData.find((a: any) => a.status === 'active')?.id ?? advData[0]?.id)
      : (advData?.id ?? null);
    if (!advertiserId) return { spend: 0, available: false };

    const statsRes = await fetch(
      `https://api.mercadolibre.com/advertising/advertisers/${advertiserId}/adproducts/PRODUCT_ADS/adgroups/adgroupsAll/campaigns/all/daily_summary` +
      `?date_from=${dateFrom}&date_to=${dateTo}`,
      { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
    );
    if (!statsRes.ok) return { spend: 0, available: false };
    const stats = await statsRes.json();

    let spend = 0;
    if (Array.isArray(stats))                        spend = stats.reduce((s: number, d: any) => s + (d.spent ?? d.total_spent ?? 0), 0);
    else if (typeof stats?.spent === 'number')        spend = stats.spent;
    else if (typeof stats?.total_spent === 'number')  spend = stats.total_spent;
    return { spend, available: true };
  } catch {
    return { spend: 0, available: false };
  }
}

export async function GET(request: NextRequest) {
  const filter = request.nextUrl.searchParams.get('filter') || 'today';
  const { from, to, dateFrom, dateTo } = getDateRange(filter);

  // Token do ML via Supabase
  const sbRes = await fetch(
    `${SB_URL}/rest/v1/taxas_config?id=eq.config&select=ml_access_token&limit=1`,
    { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }, cache: 'no-store' }
  );
  if (!sbRes.ok) return NextResponse.json({ error: 'Supabase error' }, { status: 500 });
  const sbData = await sbRes.json();
  const token = sbData[0]?.ml_access_token;
  if (!token) return NextResponse.json({ notConnected: true }, { status: 401 });

  // Seller ID
  const meRes = await fetch('https://api.mercadolibre.com/users/me', {
    headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
  });
  if (!meRes.ok) return NextResponse.json({ error: 'Token ML inválido ou expirado', notConnected: true }, { status: 401 });
  const me = await meRes.json();
  const sellerId: number = me.id;

  // Busca pedidos e ads em paralelo
  const allOrders: any[] = [];
  let offset = 0;
  const limit = 50;
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), 50000);

  // Ads spend em paralelo com a primeira página de pedidos
  const adsPromise = fetchAdsSpend(token, sellerId, dateFrom, dateTo);

  try {
    while (true) {
      const url =
        `https://api.mercadolibre.com/orders/search` +
        `?seller=${sellerId}` +
        `&order.status=paid` +
        `&order.date_created.from=${from}` +
        `&order.date_created.to=${to}` +
        `&sort=date_desc` +
        `&limit=${limit}` +
        `&offset=${offset}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
        signal: abort.signal,
      });

      if (!res.ok) break;
      const body = await res.json();
      const orders: any[] = body.results || [];
      const total: number = body.paging?.total ?? 0;

      allOrders.push(...orders);
      if (orders.length < limit || allOrders.length >= total) break;
      offset += limit;
    }
  } catch {}
  finally { clearTimeout(timer); }

  const faturamentoPago = allOrders.reduce((s, o) => s + (o.total_amount || 0), 0);

  // [FIX PERMANENTE - não remover]
  // taxa ML real = soma de order_items[i].sale_fee (sale_fee_amount no nível do pedido é null)
  const taxaMlTotal = allOrders.reduce((s, o) =>
    s + (o.order_items || []).reduce((si: number, item: any) => si + (item.sale_fee || 0), 0), 0
  );

  const pedidosPagos = allOrders.length;
  const ticketMedio  = pedidosPagos > 0 ? faturamentoPago / pedidosPagos : 0;

  const hourly = Array(24).fill(0);
  allOrders.forEach(o => {
    const h = new Date(new Date(o.date_created).toLocaleString('en-US', { timeZone: 'America/Manaus' })).getHours();
    hourly[h] += o.total_amount || 0;
  });

  const { spend: adsSpend, available: adsAvailable } = await adsPromise;
  const cpa  = adsAvailable && adsSpend > 0 && pedidosPagos > 0 ? adsSpend / pedidosPagos : null;
  const roas = adsAvailable && adsSpend > 0 ? faturamentoPago / adsSpend : null;

  return NextResponse.json({
    faturamentoPago, faturamentoBruto: faturamentoPago,
    pedidosPagos, pedidosGerados: pedidosPagos,
    ticketMedio,
    taxaMlTotal,
    adsSpend,
    adsAvailable, // false = falta scope advertising no app ML
    cpa,          // null quando adsAvailable=false
    roas,         // null quando adsAvailable=false
    hourly,
  });
}
