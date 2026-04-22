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
      financial_status: 'paid',
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

    const validOrders = allOrders.filter(o => parseFloat(o.total_price || '0') >= 1);

    type VariantData = { product_title: string; variant_title: string; qty: number; revenue: number };
    const variantMap: Record<string, VariantData> = {};

    for (const order of validOrders) {
      for (const item of (order.line_items || [])) {
        const key = String(item.variant_id || `${item.product_id}-${item.title}`);
        if (!variantMap[key]) {
          variantMap[key] = {
            product_title: item.title || '',
            variant_title: item.variant_title || '',
            qty: 0,
            revenue: 0,
          };
        }
        variantMap[key].qty += item.quantity || 0;
        variantMap[key].revenue += parseFloat(item.price || '0') * (item.quantity || 0);
      }
    }

    const totalRevenue = Object.values(variantMap).reduce((s, v) => s + v.revenue, 0);
    const products = Object.values(variantMap)
      .map(p => ({
        ...p,
        ticket_medio: p.qty > 0 ? p.revenue / p.qty : 0,
        pct: totalRevenue > 0 ? (p.revenue / totalRevenue) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 20);

    return NextResponse.json({ products, totalRevenue });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    clearTimeout(abortTimer);
  }
}
