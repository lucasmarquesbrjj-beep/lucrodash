# Regras permanentes do projeto HolyDash

## Cálculo de custos
- **Frete**: sempre R$ 0,00 para os canais `ml` e `shopee` — `tFr = 0` nesses canais
- **Taxa ML**: usar `order_items[i].sale_fee` real da API (`sale_fee_amount` no nível do pedido é sempre null)

## API do Mercado Livre
- **Filtro de data**: usar `order.date_created.from` / `order.date_created.to` (com prefixo `order.`) — sem o prefixo a API ignora o filtro e retorna todos os pedidos históricos
- **Offset de fuso**: datas com `-04:00` (America/Manaus) — UTC e `-03:00` quebram o filtro
- **URL manual**: construir a URL sem `URLSearchParams` para evitar encoding `%3A` nos colons das datas
- **API de Advertising**: endpoint `/advertising/advertisers?product_id=PADS&user_id=X` com header `Api-Version: 1`; spend via `/marketplace/advertising/{site}/advertisers/{id}/product_ads/campaigns/search` com `Api-Version: 2`

## Cache localStorage
- **Chave ML orders**: `hd_ml2_<filter>` (chave `hd_ml_` era v1 com dados sem filtro de data)
- **Chave ML ads**: `hd_ml2_ads_<filter>` — salvar junto com orders para restaurar profit correto
- **Restaurar stale ML**: só restaurar cache imediatamente se AMBOS `hd_ml2_` e `hd_ml2_ads_` existirem; caso contrário manter skeleton até Promise.all resolver
- **Limpar cache**: `doRefresh()` apaga todas as chaves `hd_*` e re-busca tudo

## Carregamento sem flash de lucro
- **Shopify + Meta Ads**: `Promise.all([shopify, meta])` — `setLoading(false)` só quando os DOIS chegarem no mesmo `.then()`
- **ML orders + ads**: `Promise.all([orders, ads])` — `setMlLoading(false)` só quando os DOIS chegarem no mesmo `.then()`
- **NUNCA** mostrar lucro líquido antes de ter custo de ads — manter skeleton até tudo chegar
- **Trocar filtro** (hoje→ontem) mantém loading=true até Shopify+Meta chegarem juntos

## Mobile
- **7 KPI cards** visíveis no mobile em 2 colunas: `gridTemplateColumns: repeat(auto-fill, minmax(min(150px, calc(50% - 5px)), 1fr))`

## Layout
- **Nunca sobrescrever** `layout.tsx` — background `#0a0918` e metadados estão lá

## Deploy
```
vercel --prod && vercel alias set [url-gerada] holydash.vercel.app
```
