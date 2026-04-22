import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const DATE_PRESET: Record<string, string> = {
  today:     'today',
  yesterday: 'yesterday',
  '7d':      'last_7d',
  '30d':     'last_30d',
  month:     'this_month',
  year:      'this_year',
  lastyear:  'last_year',
};

function dateStr(daysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

export async function GET(request: NextRequest) {
  const filter = request.nextUrl.searchParams.get('filter') || 'today';
  const isAnteontem = filter === 'anteontem';
  const datePreset = isAnteontem ? null : (DATE_PRESET[filter] ?? 'today');
  const anteontemDate = isAnteontem ? dateStr(2) : null;

  // 1. Busca o token salvo no Supabase
  const configRes = await fetch(
    `${SUPABASE_URL}/rest/v1/taxas_config?id=eq.config&select=meta_access_token&limit=1`,
    {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      cache: 'no-store',
    }
  );
  const configData = await configRes.json();
  const token = configData[0]?.meta_access_token;

  if (!token) {
    return NextResponse.json({ error: 'meta_access_token não encontrado' }, { status: 400 });
  }

  // 2. Busca as contas de anúncio do usuário
  const accountsRes = await fetch(
    `https://graph.facebook.com/v20.0/me/adaccounts?fields=id&access_token=${token}`,
    { cache: 'no-store' }
  );
  const accountsData = await accountsRes.json();

  if (accountsData.error) {
    return NextResponse.json({ error: accountsData.error.message }, { status: 400 });
  }

  const accounts: { id: string }[] = accountsData.data || [];
  let totalSpend = 0;

  // 3. Soma o gasto do período de todas as contas
  for (const account of accounts) {
    const timeParam = isAnteontem
      ? `time_range={"since":"${anteontemDate}","until":"${anteontemDate}"}`
      : `date_preset=${datePreset}`;
    const insightsRes = await fetch(
      `https://graph.facebook.com/v20.0/${account.id}/insights?fields=spend&${timeParam}&access_token=${token}`,
      { cache: 'no-store' }
    );
    const insightsData = await insightsRes.json();
    totalSpend += parseFloat(insightsData.data?.[0]?.spend ?? '0');
  }

  // 4. Persiste no Supabase apenas para o filtro "today"
  if (filter === 'today') {
    await fetch(`${SUPABASE_URL}/rest/v1/taxas_config?id=eq.config`, {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ meta_ads_hoje: totalSpend, updated_at: new Date().toISOString() }),
    });
  }

  return NextResponse.json({ spend: totalSpend, filter, datePreset });
}
