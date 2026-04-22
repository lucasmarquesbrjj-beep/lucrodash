
import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: NextRequest) {
  const { email, senha } = await request.json();

  const res = await fetch(`${SUPABASE_URL}/rest/v1/usuarios?email=eq.${email}&senha=eq.${senha}&limit=1`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
  });

  const data = await res.json();

  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'Email ou senha incorretos' }, { status: 401 });
  }

  const user = data[0];
  const response = NextResponse.json({ success: true, nome: user.nome });
  
  response.cookies.set('holydash_auth', btoa(`${email}:${senha}`), {
    httpOnly: true,
    secure: true,
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });

  return response;
}
