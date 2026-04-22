import { NextResponse } from 'next/server';
const APP_ID = process.env.META_APP_ID!;
const REDIRECT_URI = 'https://holydash.vercel.app/api/auth/meta/callback';
export async function GET() {
  const url = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=ads_read&response_type=code`;
  return NextResponse.redirect(url);
}
