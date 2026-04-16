import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const shop = 'pelos-pets-9091.myshopify.com';

  if (!code) {
    return NextResponse.json({ error: 'Code não encontrado' }, { status: 400 });
  }

  try {
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_API_KEY,
        client_secret: process.env.SHOPIFY_API_SECRET,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      return NextResponse.json({ error: 'Token não gerado', details: tokenData }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      access_token: tokenData.access_token,
      message: 'Copie este token e salve no Vercel como SHOPIFY_ACCESS_TOKEN'
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
