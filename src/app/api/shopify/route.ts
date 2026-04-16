import { NextRequest, NextResponse } from 'next/server'

const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN
const SHOPIFY_KEY = process.env.SHOPIFY_API_KEY
const SHOPIFY_SECRET = process.env.SHOPIFY_API_SECRET

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const created_at_min = searchParams.get('from') || new Date(Date.now() - 86400000).toISOString()

  try {
    const credentials = Buffer.from(`${SHOPIFY_KEY}:${SHOPIFY_SECRET}`).toString('base64')
    const res = await fetch(
      `https://${SHOPIFY_DOMAIN}/admin/api/2024-01/orders.json?status=any&created_at_min=${created_at_min}&limit=250`,
      { headers: { 'Authorization': `Basic ${credentials}`, 'Content-Type': 'application/json' } }
    )

    if (!res.ok) {
      return NextResponse.json({ error: 'Erro ao buscar pedidos Shopify' }, { status: res.status })
    }

    const data = await res.json()
    const orders = data.orders.map((o: any) => ({
      external_id: String(o.id),
      created_at: o.created_at,
      status: mapStatus(o.financial_status),
      payment_method: mapPayment(o.payment_gateway),
      total_amount: parseFloat(o.total_price),
      paid_amount: o.financial_status === 'paid' ? parseFloat(o.total_price) : 0,
      shipping_cost: parseFloat(o.total_shipping_price_set?.shop_money?.amount || '0'),
      discount: parseFloat(o.total_discounts),
      customer_state: o.billing_address?.province_code || null,
      items: o.line_items.map((i: any) => ({
        name: i.name,
        sku: i.sku,
        quantity: i.quantity,
        unit_price: parseFloat(i.price),
      }))
    }))

    return NextResponse.json({ orders, total: orders.length })
  } catch (e) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

function mapStatus(s: string) {
  const map: Record<string, string> = { paid: 'PAID', pending: 'PENDING', refunded: 'REFUNDED', voided: 'CANCELLED' }
  return map[s] || 'PENDING'
}

function mapPayment(gateway: string) {
  if (gateway?.includes('pix')) return 'PIX'
  if (gateway?.includes('boleto')) return 'BOLETO'
  return 'CARD'
}
