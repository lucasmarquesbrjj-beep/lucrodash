import { NextResponse } from 'next/server';

const APP_ID   = process.env.ML_APP_ID!;
const SB_URL   = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_KEY   = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const REDIRECT_URI = 'https://holydash.vercel.app/api/auth/ml/callback';

export async function GET() {
  // [PROTEÇÃO PERMANENTE - não remover]
  // NÃO apagar ml_access_token aqui. O callback escreve o novo token ao concluir o OAuth.
  // Apagar antes causava desconexão silenciosa se o usuário abandonasse o fluxo OAuth.
  const url = `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=advertising`;
  return NextResponse.redirect(url);
}
