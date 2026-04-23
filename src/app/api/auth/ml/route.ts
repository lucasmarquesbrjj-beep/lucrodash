import { NextResponse } from 'next/server';

const APP_ID = process.env.ML_APP_ID!;
const REDIRECT_URI = 'https://holydash.vercel.app/api/auth/ml/callback';

export async function GET() {
  // scope=advertising necessário para acessar a API de Product Ads (CPA/ROAS)
  const url = `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=advertising`;
  return NextResponse.redirect(url);
}
