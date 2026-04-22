import { NextRequest, NextResponse } from 'next/server';

const SHOP = 'pelos-pets-9091.myshopify.com';
const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN!;
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const maxDuration = 60;

// Filters to pre-calculate, ordered fastest → slowest so partial runs still help
// year/lastyear excluded — cron's 25s budget can't reliably fetch a full year of orders
const FILTERS_TO_CACHE = ['today', 'yesterday', '7d', 'month', '30d'];

function nowBrasilia() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
}

function getDateRange(filter: string) {
  const now = nowBrasilia();
  let created_at_min: string;
  let created_at_max: string = new Date().toISOString();

  if (filter === 'today') {
    const s = new Date(now); s.setHours(0, 0, 0, 0);
    created_at_min = new Date(s.getTime() + 3 * 3600000).toISOString();
  } else if (filter === 'yesterday') {
    const s = new Date(now); s.setDate(s.getDate() - 1); s.setHours(0, 0, 0, 0);
    const e = new Date(now); e.setHours(0, 0, 0, 0);
    created_at_min = new Date(s.getTime() + 3 * 3600000).toISOString();
    created_at_max = new Date(e.getTime() + 3 * 3600000).toISOString();
  } else if (filter === '7d') {
    const s = new Date(now); s.setDate(s.getDate() - 7); s.setHours(0, 0, 0, 0);
    created_at_min = new Date(s.getTime() + 3 * 3600000).toISOString();
  } else if (filter === '30d') {
    const s = new Date(now); s.setDate(s.getDate() - 30); s.setHours(0, 0, 0, 0);
    created_at_min = new Date(s.getTime() + 3 * 3600000).toISOString();
  } else if (filter === 'year') {
    const s = new Date(now.getFullYear(), 0, 1);
    created_at_min = new Date(s.getTime() + 3 * 3600000).toISOString();
  } else {
    // month (default)
    const s = new Date(now.getFullYear(), now.getMonth(), 1);
    created_at_min = new Date(s.getTime() + 3 * 3600000).toISOString();
  }

  return { created_at_min, created_at_max };
}

function computeStats(allOrders: any[]) {
  const pagos = allOrders.filter((o: any) => o.financial_status === 'paid');
  const pagosValidos = pagos.filter((o: any) => parseFloat(o.total_price || '0') >= 1);
  const reenvios = pagos.filter((o: any) =>
    parseFloat(o.total_price || '0') < 1 &&
    (o.line_items || []).some((li: any) => li.title?.toLowerCase().includes('reenvio'))
  );
  const reenviosPct = pagosValidos.length > 0 ? Math.round((reenvios.length / pagosValidos.length) * 100) : 0;
  const pendentes = allOrders.filter((o: any) => ['pending', 'partially_paid'].includes(o.financial_status));

  const faturamentoPago = pagos.reduce((s: number, o: any) => s + parseFloat(o.total_price || '0'), 0);
  const faturamentoBruto = allOrders.reduce((s: number, o: any) => s + parseFloat(o.total_price || '0'), 0);

  const getPaymentType = (o: any) => {
    const attr = (o.note_attributes || []).find((a: any) => a.name === 'shipping_payment_type');
    return (attr?.value || o.payment_gateway || '').toLowerCase();
  };

  const cartaoAprovado = pagos.filter((o: any) => { const t = getPaymentType(o); return t === 'cc' || t.includes('credit') || t.includes('card'); }).length;
  const cartaoPendente = pendentes.filter((o: any) => { const t = getPaymentType(o); return t === 'cc' || t.includes('credit') || t.includes('card'); }).length;
  const boletoPago = pagos.filter((o: any) => getPaymentType(o).includes('boleto')).length;
  const boletoPendente = pendentes.filter((o: any) => getPaymentType(o).includes('boleto')).length;
  const pixPago = pagos.filter((o: any) => getPaymentType(o).includes('pix')).length;
  const pixPendente = pendentes.filter((o: any) => getPaymentType(o).includes('pix')).length;

  const ticketMedio = pagosValidos.length > 0 ? faturamentoPago / pagosValidos.length : 0;
  const descontos = allOrders.reduce((s: number, o: any) => s + parseFloat(o.total_discounts || '0'), 0);
  const frete = pagosValidos.reduce((s: number, o: any) => s + parseFloat(o.total_shipping_price_set?.shop_money?.amount || '0'), 0);

  const hourly = Array(24).fill(0);
  pagos.forEach((o: any) => {
    const h = new Date(new Date(o.created_at).toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })).getHours();
    hourly[h] += parseFloat(o.total_price || '0');
  });

  const stateMap: Record<string, { orders: number; revenue: number }> = {};
  pagos.forEach((o: any) => {
    const s = o.shipping_address?.province_code || o.billing_address?.province_code || 'N/A';
    if (!stateMap[s]) stateMap[s] = { orders: 0, revenue: 0 };
    stateMap[s].orders++;
    stateMap[s].revenue += parseFloat(o.total_price || '0');
  });
  const states = Object.entries(stateMap)
    .map(([state, d]) => ({ state, orders: d.orders, revenue: d.revenue, pct: Math.round((d.orders / (pagos.length || 1)) * 100) }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);

  return {
    faturamentoPago, faturamentoBruto,
    pedidosGerados: allOrders.length, pedidosPagos: pagosValidos.length, pedidosPendentes: pendentes.length,
    cartaoAprovado, cartaoPendente, boletoPago, boletoPendente, pixPago, pixPendente,
    ticketMedio, descontos, frete,
    reenvios: reenvios.length, reenviosPct,
    hourly, states,
  };
}

async function fetchAndCache(filter: string): Promise<{ ok: boolean; orders: number }> {
  const { created_at_min, created_at_max } = getDateRange(filter);
  const isLarge = filter === 'year' || filter === 'lastyear';
  const maxOrders = isLarge ? 5000 : 50000;

  let aborted = false;
  const abort = new AbortController();
  // Per-filter timeout: 25s for large, 20s for others
  const timer = setTimeout(() => { abort.abort(); aborted = true; }, isLarge ? 25000 : 20000);

  try {
    const allOrders: any[] = [];
    const params = new URLSearchParams({ status: 'any', limit: '250', created_at_min, created_at_max });
    let pageUrl: string | null = `https://${SHOP}/admin/api/2024-01/orders.json?${params}`;

    while (pageUrl && allOrders.length < maxOrders) {
      let res: Response;
      try {
        res = await fetch(pageUrl, { headers: { 'X-Shopify-Access-Token': TOKEN }, cache: 'no-store', signal: abort.signal });
      } catch (e: any) {
        if (e.name === 'AbortError') break;
        throw e;
      }
      if (!res.ok) return { ok: false, orders: 0 };
      const body = await res.json();
      if (Array.isArray(body.orders)) allOrders.push(...body.orders);
      const next = res.headers.get('Link')?.match(/<([^>]+)>;\s*rel="next"/);
      pageUrl = next ? next[1] : null;
    }

    // Don't write zeros or truncated data — incomplete results poison the cache
    if (!aborted && allOrders.length > 0) {
      const data = { ...computeStats(allOrders), truncated: allOrders.length >= maxOrders };
      if (data.truncated) return { ok: false, orders: allOrders.length };
      await fetch(`${SB_URL}/rest/v1/cache_dashboard`, {
        method: 'POST',
        headers: {
          apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`,
          'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify({ filtro: filter, dados: data, updated_at: new Date().toISOString() }),
      });
    }

    return { ok: !aborted && allOrders.length > 0, orders: allOrders.length };
  } catch {
    return { ok: false, orders: 0 };
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(request: NextRequest) {
  // Vercel sets Authorization: Bearer <CRON_SECRET> for cron invocations.
  // If CRON_SECRET is configured, enforce it.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const results: Record<string, any> = {};
  for (const filter of FILTERS_TO_CACHE) {
    const r = await fetchAndCache(filter);
    results[filter] = r;
  }

  return NextResponse.json({ ok: true, cached: results, at: new Date().toISOString() });
}
