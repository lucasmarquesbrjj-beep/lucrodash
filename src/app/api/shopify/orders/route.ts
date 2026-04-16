import { NextRequest, NextResponse } from 'next/server';

const SHOP = 'pelos-pets-9091.myshopify.com';
const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN!;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get('filter') || 'today';

  const now = new Date();
  let created_at_min: string;
  let created_at_max: string = now.toISOString();

  if (filter === 'today') {
    const start = new Date(now); start.setHours(0,0,0,0);
    created_at_min = start.toISOString();
  } else if (filter === 'yesterday') {
    const start = new Date(now); start.setDate(start.getDate()-1); start.setHours(0,0,0,0);
    const end = new Date(now); end.setHours(0,0,0,0);
    created_at_min = start.toISOString(); created_at_max = end.toISOString();
  } else if (filter === '7d') {
    const start = new Date(now); start.setDate(start.getDate()-7); start.setHours(0,0,0,0);
    created_at_min = start.toISOString();
  } else if (filter === '30d') {
    const start = new Date(now); start.setDate(start.getDate()-30); start.setHours(0,0,0,0);
    created_at_min = start.toISOString();
  } else {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    created_at_min = start.toISOString();
  }

  try {
    const url = `https://${SHOP}/admin/api/2024-01/orders.json?status=any&limit=250&created_at_min=${created_at_min}&created_at_max=${created_at_max}`;
    const res = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': TOKEN,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const { orders } = await res.json();

    const pagos = orders.filter((o: any) => o.financial_status === 'paid');
    const pendentes = orders.filter((o: any) => ['pending','partially_paid'].includes(o.financial_status));

    const faturamentoPago = pagos.reduce((s: number, o: any) => s + parseFloat(o.total_price || '0'), 0);
    const faturamentoBruto = orders.reduce((s: number, o: any) => s + parseFloat(o.total_price || '0'), 0);

    const getPaymentType = (o: any) => {
      const attrs = o.note_attributes || [];
      const attr = attrs.find((a: any) => a.name === 'shipping_payment_type');
      return (attr?.value || o.payment_gateway || '').toLowerCase();
    }

    const cartaoAprovado = pagos.filter((o: any) => getPaymentType(o).includes('credit')).length;
    const cartaoPendente = pendentes.filter((o: any) => getPaymentType(o).includes('credit')).length;
    const boletoPago = pagos.filter((o: any) => getPaymentType(o).includes('boleto')).length;
    const boletoPendente = pendentes.filter((o: any) => getPaymentType(o).includes('boleto')).length;
    const pixPago = pagos.filter((o: any) => getPaymentType(o).includes('pix')).length;
    const pixPendente = pendentes.filter((o: any) => getPaymentType(o).includes('pix')).length;

    const ticketMedio = pagos.length > 0 ? faturamentoPago / pagos.length : 0;
    const descontos = orders.reduce((s: number, o: any) => s + parseFloat(o.total_discounts || '0'), 0);
    const frete = pagos.reduce((s: number, o: any) => s + parseFloat(o.total_shipping_price_set?.shop_money?.amount || '0'), 0);

    const hourly = Array(24).fill(0);
    pagos.forEach((o: any) => {
      const h = new Date(o.created_at).getHours();
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
      .map(([state, d]) => ({ state, orders: d.orders, revenue: d.revenue, pct: Math.round((d.orders / pagos.length) * 100) }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);

    return NextResponse.json({
      faturamentoPago,
      faturamentoBruto,
      pedidosGerados: orders.length,
      pedidosPagos: pagos.length,
      pedidosPendentes: pendentes.length,
      cartaoAprovado, cartaoPendente,
      boletoPago, boletoPendente,
      pixPago, pixPendente,
      ticketMedio,
      descontos,
      frete,
      hourly,
      states,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
