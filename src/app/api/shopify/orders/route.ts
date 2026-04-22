import { NextRequest, NextResponse } from 'next/server';

const SHOP = 'pelos-pets-9091.myshopify.com';
const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN!;
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const maxDuration = 60;

function isCacheValid(updatedAt: string, filter: string): boolean {
  const now = new Date();
  const cache = new Date(updatedAt);
  const diffMs = now.getTime() - cache.getTime();
  if (filter === 'today') return diffMs < 30 * 60 * 1000;
  if (['yesterday', 'anteontem', '7d', '30d', 'month'].includes(filter)) {
    const fmt = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
    return fmt(now) === fmt(cache);
  }
  if (filter === 'year' || filter === 'lastyear') return diffMs < 7 * 24 * 60 * 60 * 1000;
  return false;
}

async function readCache(filter: string): Promise<any | null> {
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/cache_dashboard?filtro=eq.${encodeURIComponent(filter)}&select=dados,updated_at&limit=1`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }, cache: 'no-store' }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    if (!rows[0] || !isCacheValid(rows[0].updated_at, filter)) return null;
    const dados = rows[0].dados;
    // Reject cached zeros for historical filters — likely from an aborted cron fetch
    if (filter !== 'today' && (dados?.pedidosGerados ?? 0) === 0) return null;
    // Reject truncated entries — partial data from a previous cap-limited fetch
    if (dados?.truncated) return null;
    return dados;
  } catch { return null; }
}

async function writeCache(filter: string, data: object): Promise<void> {
  try {
    await fetch(`${SB_URL}/rest/v1/cache_dashboard`, {
      method: 'POST',
      headers: {
        apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({ filtro: filter, dados: data, updated_at: new Date().toISOString() }),
    });
  } catch {}
}

function nowBrasilia() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
}

function getDateRange(filter: string) {
  const now = nowBrasilia();
  let created_at_min: string;
  let created_at_max: string = new Date().toISOString();

  if (filter === 'today') {
    const start = new Date(now); start.setHours(0,0,0,0);
    created_at_min = new Date(start.getTime() + 3 * 60 * 60 * 1000).toISOString();
  } else if (filter === 'yesterday') {
    const start = new Date(now); start.setDate(start.getDate()-1); start.setHours(0,0,0,0);
    const end = new Date(now); end.setHours(0,0,0,0);
    created_at_min = new Date(start.getTime() + 3 * 60 * 60 * 1000).toISOString();
    created_at_max = new Date(end.getTime() + 3 * 60 * 60 * 1000).toISOString();
  } else if (filter === 'anteontem') {
    const start = new Date(now); start.setDate(start.getDate()-2); start.setHours(0,0,0,0);
    const end = new Date(now); end.setDate(end.getDate()-1); end.setHours(0,0,0,0);
    created_at_min = new Date(start.getTime() + 3 * 60 * 60 * 1000).toISOString();
    created_at_max = new Date(end.getTime() + 3 * 60 * 60 * 1000).toISOString();
  } else if (filter === '7d') {
    const start = new Date(now); start.setDate(start.getDate()-7); start.setHours(0,0,0,0);
    created_at_min = new Date(start.getTime() + 3 * 60 * 60 * 1000).toISOString();
  } else if (filter === '30d') {
    const start = new Date(now); start.setDate(start.getDate()-30); start.setHours(0,0,0,0);
    created_at_min = new Date(start.getTime() + 3 * 60 * 60 * 1000).toISOString();
  } else if (filter === 'year') {
    const start = new Date(now.getFullYear(), 0, 1);
    created_at_min = new Date(start.getTime() + 3 * 60 * 60 * 1000).toISOString();
  } else if (filter === 'lastyear') {
    const start = new Date(now.getFullYear() - 1, 0, 1);
    const end = new Date(now.getFullYear(), 0, 1);
    created_at_min = new Date(start.getTime() + 3 * 60 * 60 * 1000).toISOString();
    created_at_max = new Date(end.getTime() + 3 * 60 * 60 * 1000).toISOString();
  } else if (filter.startsWith('custom:')) {
    const parts = filter.split(':');
    const start = new Date(parts[1] + 'T00:00:00-03:00');
    const end = new Date(parts[2] + 'T23:59:59-03:00');
    created_at_min = start.toISOString();
    created_at_max = end.toISOString();
  } else {
    // month (default)
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    created_at_min = new Date(start.getTime() + 3 * 60 * 60 * 1000).toISOString();
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
  const reenviosPct = pagosValidos.length > 0
    ? Math.round((reenvios.length / pagosValidos.length) * 100) : 0;
  const pendentes = allOrders.filter((o: any) => ['pending','partially_paid'].includes(o.financial_status));

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
    pedidosGerados: allOrders.filter((o: any) => parseFloat(o.total_price || '0') >= 1).length, pedidosPagos: pagosValidos.length, pedidosPendentes: pendentes.length,
    cartaoAprovado, cartaoPendente, boletoPago, boletoPendente, pixPago, pixPendente,
    ticketMedio, descontos, frete,
    reenvios: reenvios.length, reenviosPct,
    hourly, states,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get('filter') || 'today';
  const useStream = searchParams.get('stream') === '1';

  const { created_at_min, created_at_max } = getDateRange(filter);
  const maxOrders = filter === 'year' ? 20000 : 50000;

  const params = new URLSearchParams({ status: 'any', limit: '250', created_at_min, created_at_max });
  const firstUrl = `https://${SHOP}/admin/api/2024-01/orders.json?${params}`;

  if (useStream) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(ctrl) {
        const send = (obj: object) => {
          try { ctrl.enqueue(encoder.encode(JSON.stringify(obj) + '\n')); } catch {}
        };
        const abort = new AbortController();
        const timer = setTimeout(() => abort.abort(), 55000);
        try {
          const allOrders: any[] = [];
          let pageUrl: string | null = firstUrl;
          while (pageUrl && allOrders.length < maxOrders) {
            let res: Response;
            try {
              res = await fetch(pageUrl, { headers: { 'X-Shopify-Access-Token': TOKEN }, cache: 'no-store', signal: abort.signal });
            } catch (e: any) {
              if (e.name === 'AbortError') break;
              throw e;
            }
            if (!res.ok) { send({ type: 'error', message: await res.text() }); return; }
            const { orders } = await res.json();
            if (Array.isArray(orders)) allOrders.push(...orders);
            send({ type: 'progress', count: allOrders.length });
            const next = res.headers.get('Link')?.match(/<([^>]+)>;\s*rel="next"/);
            pageUrl = next ? next[1] : null;
          }
          send({ type: 'result', data: { ...computeStats(allOrders), truncated: allOrders.length >= maxOrders } });
        } catch (e: any) {
          send({ type: 'error', message: e.message });
        } finally {
          clearTimeout(timer);
          ctrl.close();
        }
      }
    });
    return new Response(stream, {
      headers: { 'Content-Type': 'application/x-ndjson', 'Cache-Control': 'no-cache, no-transform', 'X-Accel-Buffering': 'no' }
    });
  }

  // Start abort timer BEFORE cache check so it covers the full request duration
  let aborted = false;
  const abort = new AbortController();
  const timer = setTimeout(() => { abort.abort(); aborted = true; }, 50000);

  try {
    // Non-streaming — check cache first
    if (!filter.startsWith('custom:')) {
      const cached = await readCache(filter);
      if (cached) return NextResponse.json({ ...cached, fromCache: true });
    }

    const allOrders: any[] = [];
    let pageUrl: string | null = firstUrl;
    let retries = 0;
    while (pageUrl && allOrders.length < maxOrders) {
      let res: Response;
      try {
        res = await fetch(pageUrl, { headers: { 'X-Shopify-Access-Token': TOKEN }, cache: 'no-store', signal: abort.signal });
      } catch (e: any) {
        if (e.name === 'AbortError') break;
        throw e;
      }
      if (!res.ok) {
        if (res.status === 429 && retries < 3) {
          // Rate limited — back off exponentially and retry the same page
          retries++;
          await new Promise(r => setTimeout(r, 1500 * retries));
          continue;
        }
        // Other Shopify errors: return whatever we've collected so far
        break;
      }
      retries = 0;
      const { orders } = await res.json();
      if (Array.isArray(orders)) allOrders.push(...orders);
      const next = res.headers.get('Link')?.match(/<([^>]+)>;\s*rel="next"/);
      pageUrl = next ? next[1] : null;
    }
    const result = { ...computeStats(allOrders), truncated: allOrders.length >= maxOrders };
    if (!filter.startsWith('custom:') && !aborted && !result.truncated && allOrders.length > 0) writeCache(filter, result);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  } finally {
    clearTimeout(timer);
  }
}
