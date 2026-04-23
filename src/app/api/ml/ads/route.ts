import { NextRequest, NextResponse } from 'next/server';

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const maxDuration = 30;

function getBRT(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
}

function toYMD(brtDate: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${brtDate.getFullYear()}-${pad(brtDate.getMonth() + 1)}-${pad(brtDate.getDate())}`;
}

function getDateYMD(filter: string): { from: string; to: string } {
  const b = getBRT();
  const Y = b.getFullYear(), Mo = b.getMonth(), D = b.getDate();

  if (filter === 'today')       return { from: toYMD(new Date(Y,Mo,D)),   to: toYMD(new Date(Y,Mo,D)) };
  if (filter === 'yesterday')   return { from: toYMD(new Date(Y,Mo,D-1)), to: toYMD(new Date(Y,Mo,D-1)) };
  if (filter === 'anteontem')   return { from: toYMD(new Date(Y,Mo,D-2)), to: toYMD(new Date(Y,Mo,D-2)) };
  if (filter === '7d')          return { from: toYMD(new Date(Y,Mo,D-7)), to: toYMD(new Date(Y,Mo,D)) };
  if (filter === '30d')         return { from: toYMD(new Date(Y,Mo,D-30)),to: toYMD(new Date(Y,Mo,D)) };
  if (filter === 'year')        return { from: `${Y}-01-01`,               to: `${Y}-12-31` };
  if (filter === 'lastyear')    return { from: `${Y-1}-01-01`,             to: `${Y-1}-12-31` };
  if (filter.startsWith('custom:')) {
    const [,d1,d2] = filter.split(':');
    return { from: d1, to: d2 };
  }
  // month
  return { from: toYMD(new Date(Y,Mo,1)), to: toYMD(new Date(Y,Mo,D)) };
}

export async function GET(request: NextRequest) {
  const filter = request.nextUrl.searchParams.get('filter') || 'today';
  const { from, to } = getDateYMD(filter);

  // 1. Token do ML
  const sbRes = await fetch(
    `${SB_URL}/rest/v1/taxas_config?id=eq.config&select=ml_access_token&limit=1`,
    { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }, cache: 'no-store' }
  );
  if (!sbRes.ok) return NextResponse.json({ spend: 0 });
  const sbData = await sbRes.json();
  const token = sbData[0]?.ml_access_token;
  if (!token) return NextResponse.json({ spend: 0 });

  // 2. Seller ID
  const meRes = await fetch('https://api.mercadolibre.com/users/me', {
    headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
  });
  if (!meRes.ok) return NextResponse.json({ spend: 0 });
  const me = await meRes.json();
  const sellerId = me.id;

  // 3. Advertiser ID do ML
  const advRes = await fetch(
    `https://api.mercadolibre.com/advertising/onboarding/advertisers?user_id=${sellerId}`,
    { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
  );
  if (!advRes.ok) return NextResponse.json({ spend: 0 });
  const advData = await advRes.json();
  const advertiserId = advData?.find?.((a: any) => a.status === 'active')?.id ?? advData?.[0]?.id;
  if (!advertiserId) return NextResponse.json({ spend: 0 });

  // 4. Gasto de anúncios no período
  // Endpoint: daily_summary de todas as campanhas PRODUCT_ADS no intervalo
  const statsRes = await fetch(
    `https://api.mercadolibre.com/advertising/advertisers/${advertiserId}/adproducts/PRODUCT_ADS/adgroups/adgroupsAll/campaigns/all/daily_summary?date_from=${from}&date_to=${to}`,
    { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
  );

  if (!statsRes.ok) return NextResponse.json({ spend: 0 });
  const stats = await statsRes.json();

  // Soma o campo 'spent' de cada dia retornado
  let spend = 0;
  if (Array.isArray(stats)) {
    spend = stats.reduce((s: number, day: any) => s + (day.spent ?? day.total_spent ?? 0), 0);
  } else if (typeof stats?.spent === 'number') {
    spend = stats.spent;
  } else if (typeof stats?.total_spent === 'number') {
    spend = stats.total_spent;
  }

  return NextResponse.json({ spend, advertiserId, from, to });
}
