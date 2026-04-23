import { NextRequest, NextResponse } from 'next/server';

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const maxDuration = 30;

function getMLLocal(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Manaus' }));
}

function toYMD(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function getDateYMD(filter: string): { from: string; to: string } {
  const b = getMLLocal();
  const Y = b.getFullYear(), Mo = b.getMonth(), D = b.getDate();

  if (filter === 'today')     return { from: toYMD(new Date(Y,Mo,D)),    to: toYMD(new Date(Y,Mo,D)) };
  if (filter === 'yesterday') return { from: toYMD(new Date(Y,Mo,D-1)),  to: toYMD(new Date(Y,Mo,D-1)) };
  if (filter === 'anteontem') return { from: toYMD(new Date(Y,Mo,D-2)),  to: toYMD(new Date(Y,Mo,D-2)) };
  if (filter === '7d')        return { from: toYMD(new Date(Y,Mo,D-7)),  to: toYMD(new Date(Y,Mo,D)) };
  if (filter === '30d')       return { from: toYMD(new Date(Y,Mo,D-30)), to: toYMD(new Date(Y,Mo,D)) };
  if (filter === 'year')      return { from: `${Y}-01-01`,                to: `${Y}-12-31` };
  if (filter === 'lastyear')  return { from: `${Y-1}-01-01`,              to: `${Y-1}-12-31` };
  if (filter.startsWith('custom:')) {
    const [, d1, d2] = filter.split(':');
    return { from: d1, to: d2 };
  }
  return { from: toYMD(new Date(Y,Mo,1)), to: toYMD(new Date(Y,Mo,D)) };
}

export async function GET(request: NextRequest) {
  const filter = request.nextUrl.searchParams.get('filter') || 'today';
  const { from, to } = getDateYMD(filter);

  const sbRes = await fetch(
    `${SB_URL}/rest/v1/taxas_config?id=eq.config&select=ml_access_token&limit=1`,
    { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }, cache: 'no-store' }
  );
  if (!sbRes.ok) return NextResponse.json({ spend: 0, error: 'supabase_error' });
  const sbData = await sbRes.json();
  const token = sbData[0]?.ml_access_token;
  if (!token) return NextResponse.json({ spend: 0, error: 'no_token' });

  const meRes = await fetch('https://api.mercadolibre.com/users/me', {
    headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
  });
  if (!meRes.ok) return NextResponse.json({ spend: 0, error: 'invalid_token' });
  const me = await meRes.json();
  const sellerId = me.id;

  // Passo 1: advertiser ID
  // product_id=PADS obrigatório; sem ele retorna "product_id param not found"
  const advRes = await fetch(
    `https://api.mercadolibre.com/advertising/advertisers?product_id=PADS&user_id=${sellerId}`,
    { headers: { Authorization: `Bearer ${token}`, 'Api-Version': '1' }, cache: 'no-store' }
  );
  if (!advRes.ok) {
    const err = await advRes.json().catch(() => ({}));
    return NextResponse.json({ spend: 0, error: 'advertisers_failed', status: advRes.status, detail: err });
  }
  const advData = await advRes.json();
  const advertiser = advData?.advertisers?.[0];
  if (!advertiser) return NextResponse.json({ spend: 0, error: 'no_advertiser', advData });
  const { advertiser_id: advertiserId, site_id: siteId } = advertiser;

  // Passo 2: gasto por período
  // aggregation_type=DAILY retorna custo por dia; soma o campo cost de cada entry
  const statsRes = await fetch(
    `https://api.mercadolibre.com/marketplace/advertising/${siteId}/advertisers/${advertiserId}/product_ads/campaigns/search` +
    `?date_from=${from}&date_to=${to}&metrics=cost&aggregation_type=DAILY`,
    { headers: { Authorization: `Bearer ${token}`, 'Api-Version': '2' }, cache: 'no-store' }
  );
  if (!statsRes.ok) {
    const err = await statsRes.json().catch(() => ({}));
    return NextResponse.json({ spend: 0, error: 'stats_failed', status: statsRes.status, detail: err, advertiserId, siteId });
  }
  const stats = await statsRes.json();
  const spend: number = (stats?.results ?? []).reduce((s: number, d: any) => s + (d.cost ?? 0), 0);

  return NextResponse.json({ spend, advertiserId, siteId, from, to });
}
