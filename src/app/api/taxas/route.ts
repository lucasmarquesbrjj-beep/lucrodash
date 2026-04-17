import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/taxas_config?id=eq.config&limit=1`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
    cache: 'no-store',
  });
  const data = await res.json();
  return NextResponse.json(data[0] || {});
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/taxas_config?id=eq.config`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({ ...body, updated_at: new Date().toISOString() }),
  });
  const data = await res.json();
  return NextResponse.json(data[0] || {});
}
