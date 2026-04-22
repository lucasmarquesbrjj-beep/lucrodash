import { NextRequest, NextResponse } from 'next/server';

const SHOP = 'pelos-pets-9091.myshopify.com';
const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN!;

export const maxDuration = 60;

function nowBrasilia() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get('filter') || 'today';

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

  const isLargeFilter = filter === 'year' || filter === 'lastyear';
  const maxOrders = isLargeFilter ? 5000 : 50000;

  const controller = new AbortController();
  const abortTimer = setTimeout(() => controller.abort(), 55000);

  try {
    const allOrders: any[] = [];
    const params = new URLSearchParams({
      status: 'any',
      limit: '250',
      created_at_min,
      created_at_max,
    });
    let pageUrl: string | null = `https://${SHOP}/admin/api/2024-01/orders.json?${params}`;

    while (pageUrl && allOrders.length < maxOrders) {
      let res: Response;
      try {
        res = await fetch(pageUrl, {
          headers: { 'X-Shopify-Access-Token': TOKEN },
          cache: 'no-store',
          signal: controller.signal,
        });
      } catch (fetchErr: any) {
        if (fetchErr.name === 'AbortError') break;
        throw fetchErr;
      }

      if (!res.ok) {
        const err = await res.text();
        return NextResponse.json({ error: err }, { status: res.status });
      }

      const { orders } = await res.json();
      if (Array.isArray(orders)) allOrders.push(...orders);

      const linkHeader = res.headers.get('Link');
      const nextMatch = linkHeader?.match(/<([^>]+)>;\s*rel="next"/);
      pageUrl = nextMatch ? nextMatch[1] : null;
    }

    const orders = allOrders;
    const pagos = orders.filter((o: any) => o.financial_status === 'paid');
    const pagosValidos = pagos.filter((o: any) => parseFloat(o.total_price || '0') >= 1);
    const reenvios = pagos.filter((o: any) =>
      parseFloat(o.total_price || '0') < 1 &&
      (o.line_items || []).some((li: any) => li.title?.toLowerCase().includes('reenvio'))
    );
    const reenviosPct = pagosValidos.length > 0
      ? Math.round((reenvios.length / pagosValidos.length) * 100)
      : 0;
    const pendentes = orders.filter((o: any) => ['pending','partially_paid'].includes(o.financial_status));

    const faturamentoPago = pagos.reduce((s: number, o: any) => s + parseFloat(o.total_price || '0'), 0);
    const faturamentoBruto = orders.reduce((s: number, o: any) => s + parseFloat(o.total_price || '0'), 0);

    const getPaymentType = (o: any) => {
      const attrs = o.note_attributes || [];
      const attr = attrs.find((a: any) => a.name === 'shipping_payment_type');
      return (attr?.value || o.payment_gateway || '').toLowerCase();
    };

    const cartaoAprovado = pagos.filter((o: any) => { const t = getPaymentType(o); return t === 'cc' || t.includes('credit') || t.includes('card'); }).length;
    const cartaoPendente = pendentes.filter((o: any) => { const t = getPaymentType(o); return t === 'cc' || t.includes('credit') || t.includes('card'); }).length;
    const boletoPago = pagos.filter((o: any) => getPaymentType(o).includes('boleto')).length;
    const boletoPendente = pendentes.filter((o: any) => getPaymentType(o).includes('boleto')).length;
    const pixPago = pagos.filter((o: any) => getPaymentType(o).includes('pix')).length;
    const pixPendente = pendentes.filter((o: any) => getPaymentType(o).includes('pix')).length;

    const ticketMedio = pagosValidos.length > 0 ? faturamentoPago / pagosValidos.length : 0;
    const descontos = orders.reduce((s: number, o: any) => s + parseFloat(o.total_discounts || '0'), 0);
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

    return NextResponse.json({
      faturamentoPago,
      faturamentoBruto,
      pedidosGerados: orders.length,
      pedidosPagos: pagosValidos.length,
      pedidosPendentes: pendentes.length,
      cartaoAprovado, cartaoPendente,
      boletoPago, boletoPendente,
      pixPago, pixPendente,
      ticketMedio,
      descontos,
      frete,
      reenvios: reenvios.length,
      reenviosPct,
      hourly,
      states,
      truncated: allOrders.length >= maxOrders,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    clearTimeout(abortTimer);
  }
}
