import { NextResponse } from 'next/server';

const APP_ID   = process.env.ML_APP_ID!;
const SB_URL   = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_KEY   = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const REDIRECT_URI = 'https://holydash.vercel.app/api/auth/ml/callback';

export async function GET() {
  // Apaga token antigo antes de redirecionar — força nova autorização com escopos atuais
  await fetch(`${SB_URL}/rest/v1/taxas_config?id=eq.config`, {
    method: 'PATCH',
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ml_access_token: null }),
  }).catch(() => {});

  // scope=advertising necessário para API de Product Ads (CPA/ROAS)
  const url = `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=advertising`;
  return NextResponse.redirect(url);
}
