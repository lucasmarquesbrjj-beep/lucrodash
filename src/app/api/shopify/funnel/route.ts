import { NextRequest, NextResponse } from 'next/server';

const SHOP = 'pelos-pets-9091.myshopify.com';
const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN!;

export const maxDuration = 60;

function nowBrasilia() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
}

function getDateRange(filter: string) {
  const now = nowBrasilia();
  let created_at_min: string;
  let created_at_max: string = new Date().toISOString();

  if (filter === 'today') {
    const start = new Date(now); start.setHours(0, 0, 0, 0);
    created_at_min = new Date(start.getTime() + 3 * 60 * 60 * 1000).toISOString();
  } else if (filter === 'yesterday') {
    const start = new Date(now); start.setDate(start.getDate() - 1); start.setHours(0, 0, 0, 0);
    const end = new Date(now); end.setHours(0, 0, 0, 0);
    created_at_min = new Date(start.getTime() + 3 * 60 * 60 * 1000).toISOString();
    created_at_max = new Date(end.getTime() + 3 * 60 * 60 * 1000).toISOString();
  } else if (filter === 'anteontem') {
    const start = new Date(now); start.setDate(start.getDate() - 2); start.setHours(0, 0, 0, 0);
    const end = new Date(now); end.setDate(end.getDate() - 1); end.setHours(0, 0, 0, 0);
    created_at_min = new Date(start.getTime() + 3 * 60 * 60 * 1000).toISOString();
    created_at_max = new Date(end.getTime() + 3 * 60 * 60 * 1000).toISOString();
  } else if (filter === '7d') {
    const start = new Date(now); start.setDate(start.getDate() - 7); start.setHours(0, 0, 0, 0);
    created_at_min = new Date(start.getTime() + 3 * 60 * 60 * 1000).toISOString();
  } else if (filter === '30d') {
    const start = new Date(now); start.setDate(start.getDate() - 30); start.setHours(0, 0, 0, 0);
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
    created_at_min = new Date(parts[1] + 'T00:00:00-03:00').toISOString();
    created_at_max = new Date(parts[2] + 'T23:59:59-03:00').toISOString();
  } else {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    created_at_min = new Date(start.getTime() + 3 * 60 * 60 * 1000).toISOString();
  }

  return { created_at_min, created_at_max };
}

export async function GET(request: NextRequest) {
  const filter = request.nextUrl.searchParams.get('filter') || 'today';
  const { created_at_min, created_at_max } = getDateRange(filter);

  // Open (incomplete) checkouts = carrinhos abandonados
  // checkouts iniciados = abandoned + pedidos gerados (computed on frontend)
  const params = new URLSearchParams({ status: 'open', created_at_min, created_at_max });
  const countUrl = `https://${SHOP}/admin/api/2024-01/checkouts/count.json?${params}`;

  try {
    const res = await fetch(countUrl, {
      headers: { 'X-Shopify-Access-Token': TOKEN },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json({ abandoned: 0, error: `Shopify ${res.status}` });
    }

    const body = await res.json();
    return NextResponse.json({ abandoned: body.count ?? 0 });
  } catch (e: any) {
    return NextResponse.json({ abandoned: 0, error: e.message });
  }
}
