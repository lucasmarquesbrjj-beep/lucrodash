import { NextRequest, NextResponse } from 'next/server';

const APP_ID = process.env.ML_APP_ID!;
const APP_SECRET = process.env.ML_APP_SECRET!;
const REDIRECT_URI = 'https://holydash.vercel.app/api/auth/ml/callback';
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect('https://holydash.vercel.app?ml_error=true');
  }

  try {
    const tokenRes = await fetch('https://api.mercadolivre.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: APP_ID,
        client_secret: APP_SECRET,
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return NextResponse.redirect('https://holydash.vercel.app?ml_error=true');
    }

    await fetch(`${SB_URL}/rest/v1/taxas_config?id=eq.config`, {
      method: 'PATCH',
      headers: {
        apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ml_access_token: tokenData.access_token }),
    });

    return NextResponse.redirect('https://holydash.vercel.app?ml_connected=true');
  } catch {
    return NextResponse.redirect('https://holydash.vercel.app?ml_error=true');
  }
}
