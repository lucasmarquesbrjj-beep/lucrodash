import { NextResponse } from 'next/server';

const SHOP = 'pelos-pets-9091.myshopify.com';
const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN!;

export const maxDuration = 60;

export async function GET() {
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), 55000);

  try {
    const allProducts: any[] = [];
    let pageUrl: string | null =
      `https://${SHOP}/admin/api/2024-01/products.json?limit=250&status=active`;

    while (pageUrl) {
      let res: Response;
      try {
        res = await fetch(pageUrl, {
          headers: { 'X-Shopify-Access-Token': TOKEN },
          cache: 'no-store',
          signal: abort.signal,
        });
      } catch (e: any) {
        if (e.name === 'AbortError') break;
        throw e;
      }
      if (!res.ok) {
        const err = await res.text();
        return NextResponse.json({ error: err }, { status: res.status });
      }
      const body = await res.json();
      if (Array.isArray(body.products)) allProducts.push(...body.products);
      const next = res.headers.get('Link')?.match(/<([^>]+)>;\s*rel="next"/);
      pageUrl = next ? next[1] : null;
    }

    const catalog = allProducts.map((p: any) => ({
      id: p.id,
      title: p.title,
      product_type: p.product_type || '',
      variants: (p.variants || []).map((v: any) => ({
        id: v.id,
        title: v.title === 'Default Title' ? '' : v.title,
        sku: v.sku || '',
        price: parseFloat(v.price || '0'),
        inventory_quantity: v.inventory_quantity ?? null,
      })),
    }));

    const totalVariants = catalog.reduce((s, p) => s + p.variants.length, 0);

    return NextResponse.json({
      totalProducts: catalog.length,
      totalVariants,
      catalog,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  } finally {
    clearTimeout(timer);
  }
}
