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
    // month (default)
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    created_at_min = new Date(start.getTime() + 3 * 60 * 60 * 1000).toISOString();
  }

  return { created_at_min, created_at_max };
}

function toBrDate(isoStr: string): string {
  return new Date(isoStr).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

async function fetchAbandoned(
  created_at_min: string, created_at_max: string, signal: AbortSignal
): Promise<number> {
  try {
    const params = new URLSearchParams({ status: 'open', created_at_min, created_at_max });
    const res = await fetch(
      `https://${SHOP}/admin/api/2024-01/checkouts/count.json?${params}`,
      { headers: { 'X-Shopify-Access-Token': TOKEN }, cache: 'no-store', signal }
    );
    if (!res.ok) return 0;
    const body = await res.json();
    return body.count ?? 0;
  } catch { return 0; }
}

async function fetchSessions(
  dateFrom: string, dateTo: string, signal: AbortSignal
): Promise<{ sessions: number; sessionsCart: number } | null> {
  const shopifyql = `FROM sessions SHOW sessions, sessions_added_to_cart SINCE ${dateFrom} UNTIL ${dateTo}`;
  try {
    const res = await fetch(
      `https://${SHOP}/admin/api/2024-01/graphql.json`,
      {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `{ shopifyqlQuery(query: ${JSON.stringify(shopifyql)}) { tableData { rowData columns { name } } parseErrors { code message } } }`
        }),
        cache: 'no-store',
        signal,
      }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const result = json?.data?.shopifyqlQuery;
    if (!result || (result.parseErrors?.length ?? 0) > 0) return null;
    const cols: string[] = (result.tableData?.columns ?? []).map((c: any) => c.name);
    const rows: string[][] = result.tableData?.rowData ?? [];
    if (!rows.length || !cols.length) return null;
    const row = rows[0];
    const si = cols.indexOf('sessions');
    const ci = cols.indexOf('sessions_added_to_cart');
    if (si === -1) return null;
    return {
      sessions: Number(row[si]) || 0,
      sessionsCart: ci !== -1 ? (Number(row[ci]) || 0) : 0,
    };
  } catch { return null; }
}

export async function GET(request: NextRequest) {
  const filter = request.nextUrl.searchParams.get('filter') || 'today';
  const { created_at_min, created_at_max } = getDateRange(filter);

  // Subtract 1ms from max so midnight-boundary maps to the correct last day
  const dateFrom = toBrDate(created_at_min);
  const dateTo = toBrDate(new Date(new Date(created_at_max).getTime() - 1).toISOString());

  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), 25000);

  try {
    const [abandonedResult, sessionsResult] = await Promise.allSettled([
      fetchAbandoned(created_at_min, created_at_max, abort.signal),
      fetchSessions(dateFrom, dateTo, abort.signal),
    ]);

    const abandoned = abandonedResult.status === 'fulfilled' ? abandonedResult.value : 0;
    const sess = sessionsResult.status === 'fulfilled' ? sessionsResult.value : null;

    return NextResponse.json({
      abandoned,
      sessions: sess?.sessions ?? null,
      sessionsCart: sess?.sessionsCart ?? null,
    });
  } catch (e: any) {
    return NextResponse.json({ abandoned: 0, sessions: null, sessionsCart: null, error: e.message });
  } finally {
    clearTimeout(timer);
  }
}
