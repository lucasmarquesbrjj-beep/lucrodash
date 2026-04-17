import { NextResponse } from 'next/server';

const SHOP = 'pelos-pets-9091.myshopify.com';
const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN!;

export async function GET() {
  const res = await fetch(`https://${SHOP}/admin/api/2024-01/orders.json?status=any&limit=3`, {
    headers: { 'X-Shopify-Access-Token': TOKEN },
    cache: 'no-store',
  });
  const data = await res.json();
  
  // Mostra só os campos relevantes dos primeiros 3 pedidos
  const resumo = data.orders?.map((o: any) => ({
    id: o.id,
    financial_status: o.financial_status,
    payment_gateway: o.payment_gateway,
    note_attributes: o.note_attributes,
    total_price: o.total_price,
  }));

  return NextResponse.json(resumo);
}
