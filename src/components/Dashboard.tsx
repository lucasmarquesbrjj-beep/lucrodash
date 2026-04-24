'use client'
import { useState, useEffect } from 'react'
import { Sk, skSt } from './LoadingSkeleton'

// [FIX PERMANENTE - Meta Ads parallel fetch - não remover]
// Shopify + Meta spend são buscados em PARALELO via Promise.all.
// Os cards só renderizam quando os DOIS chegarem juntos — um único setState batch.
// React 18 auto-bate múltiplos setState dentro do mesmo .then(), garantindo
// exatamente UM re-render com todos os valores corretos.
// Resultado: lucro líquido nunca pula/pisca após ser exibido.
//
// NÃO separar o fetch do Meta em componente externo (MetaSpend) nem em useEffect
// independente — isso causaria o problema original de dois re-renders sequenciais.

const brl = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
const num = (v: number) => new Intl.NumberFormat('pt-BR').format(v)

const FILTERS = [['today','Hoje'],['yesterday','Ontem'],['anteontem','Anteontem'],['7d','7 dias'],['month','Este mês'],['30d','30 dias'],['year','Este ano'],['lastyear','Ano passado']]
const CHANNELS = [
  { id: 'ecom', icon: '🛒', label: 'E-commerce' },
  { id: 'ml',   icon: '🟡', label: 'Mercado Livre' },
  { id: 'shopee', icon: '🧡', label: 'Shopee' },
  { id: 'geral', icon: '📊', label: 'Geral' },
]

export default function Dashboard({ taxas }: { taxas: any }) {
  const [filter, setFilter] = useState('today')
  const [channel, setChannel] = useState('ecom')
  const [showCustom, setShowCustom] = useState(false)
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  // [FIX PERMANENTE - Meta Ads parallel fetch - não remover]
  // metaSpend inicia do cache localStorage (hd_meta_today) se disponível,
  // senão de taxas.meta_ads_hoje. loading só é false quando shopify E meta estão prontos.
  const [data, setData] = useState<any>(() => {
    try { const s = localStorage.getItem('hd_today'); return s ? JSON.parse(s) : null } catch { return null }
  })
  const [metaSpend, setMetaSpend] = useState<number>(() => {
    try {
      const c = localStorage.getItem('hd_meta_today')
      return c !== null ? Number(c) : (taxas.meta_ads_hoje ?? 0)
    } catch { return taxas.meta_ads_hoje ?? 0 }
  })
  // loading=false só quando shopify E meta estão disponíveis (cache ou fetch)
  const [loading, setLoading] = useState<boolean>(() => {
    try {
      const hasShopify = localStorage.getItem('hd_today') !== null
      const hasMeta = localStorage.getItem('hd_meta_today') !== null || taxas.meta_ads_hoje != null
      return !(hasShopify && hasMeta)
    } catch { return true }
  })

  const [monthData, setMonthData] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [funnel, setFunnel] = useState<{ abandoned: number } | null>(null)
  const [mlData, setMlData] = useState<any>(null)
  const [mlLoading, setMlLoading] = useState(false)
  const [mlNotConnected, setMlNotConnected] = useState(false)
  // [FIX PERMANENTE - não remover] mlAdsSpend = gasto real em Anúncios do ML (via /api/ml/ads)
  const [mlAdsSpend, setMlAdsSpend] = useState(0)
  const [mlAdsAvailable, setMlAdsAvailable] = useState(false)

  const metaGoal = taxas.meta_mensal ?? 250000

  useEffect(() => {
    let cancelled = false
    setProducts([]); setFunnel(null)

    const cacheKey = `hd_${filter}`
    const metaKey  = `hd_meta_${filter}`

    // [FIX PERMANENTE - Meta Ads parallel fetch - não remover]
    // Stale-while-revalidate: se shopify E meta estão em cache, exibe imediatamente.
    // Depois re-busca os dois em paralelo e atualiza juntos (um único re-render).
    // Se algum não estiver em cache, mantém loading=true até ambos chegarem.
    try {
      const staleShopify = localStorage.getItem(cacheKey)
      const staleMeta    = localStorage.getItem(metaKey)
      const metaFallback = filter === 'today' ? (taxas.meta_ads_hoje ?? 0) : 0

      if (staleShopify && (staleMeta !== null || filter === 'today' && taxas.meta_ads_hoje != null)) {
        setData(JSON.parse(staleShopify))
        setMetaSpend(staleMeta !== null ? Number(staleMeta) : metaFallback)
        setLoading(false)
      } else {
        setData(null)
        setMetaSpend(metaFallback)
        setLoading(true)
      }
    } catch {
      setData(null)
      setMetaSpend(filter === 'today' ? (taxas.meta_ads_hoje ?? 0) : 0)
      setLoading(true)
    }

    // [FIX PERMANENTE - Meta Ads parallel fetch - não remover]
    // Promise.all garante que setData + setMetaSpend + setLoading(false) rodam
    // no MESMO callback → React 18 os bate em UM re-render → lucro não pula.
    // NUNCA separe esses dois fetches em Promises independentes.
    Promise.all([
      fetch(`/api/shopify/orders?filter=${filter}`).then(r => r.json()).catch(() => null),
      fetch(`/api/meta/spend?filter=${filter}`).then(r => r.json()).catch(() => null),
    ]).then(([shopifyData, metaData]) => {
      if (cancelled) return

      if (shopifyData && !shopifyData.error) {
        setData(shopifyData)
        try { localStorage.setItem(cacheKey, JSON.stringify(shopifyData)) } catch {}
      }

      if (metaData && typeof metaData.spend === 'number') {
        setMetaSpend(metaData.spend)
        try { localStorage.setItem(metaKey, String(metaData.spend)) } catch {}
        if (filter === 'today') {
          try {
            const t = JSON.parse(localStorage.getItem('hd_taxas') || '{}')
            t.meta_ads_hoje = metaData.spend
            localStorage.setItem('hd_taxas', JSON.stringify(t))
          } catch {}
        }
      }

      setLoading(false) // ambos chegaram — UM único re-render com valores definitivos
    })

    // Fetches secundários (não bloqueiam os KPI cards)
    fetch('/api/shopify/orders?filter=month')
      .then(r => r.json()).then(d => { if (!cancelled) setMonthData(d) }).catch(() => {})
    fetch(`/api/shopify/products?filter=${filter}`)
      .then(r => r.json()).then(d => { if (!cancelled && Array.isArray(d.products)) setProducts(d.products) }).catch(() => {})
    fetch(`/api/shopify/funnel?filter=${filter}`)
      .then(r => r.json()).then(d => { if (!cancelled) setFunnel({ abandoned: d.abandoned ?? 0 }) }).catch(() => {})

    return () => { cancelled = true }
  }, [filter])

  useEffect(() => {
    if (channel !== 'ml') { setMlData(null); setMlNotConnected(false); setMlAdsSpend(0); setMlAdsAvailable(false); return }
    let cancelled = false
    setMlNotConnected(false)
    // [FIX PERMANENTE - não remover] chave ml2_ (v2) — ml_ tinha cache com dados sem filtro de data
    // mlAdsKey guarda o último spend de ads junto — restaurado junto ao stale para
    // evitar que o lucro mostre primeiro sem custo de ads e depois com (2 re-renders)
    const mlKey    = `hd_ml2_${filter}`
    const mlAdsKey = `hd_ml2_ads_${filter}`
    try {
      const stale    = localStorage.getItem(mlKey)
      const staleAds = localStorage.getItem(mlAdsKey)
      if (stale) {
        // Restaura orders + ads spend juntos → único re-render com lucro correto
        setMlData(JSON.parse(stale))
        setMlAdsSpend(staleAds !== null ? Number(staleAds) : 0)
        setMlAdsAvailable(staleAds !== null)
        setMlLoading(false)
      } else {
        setMlData(null); setMlAdsSpend(0); setMlAdsAvailable(false); setMlLoading(true)
      }
    } catch { setMlData(null); setMlAdsSpend(0); setMlAdsAvailable(false); setMlLoading(true) }

    // [FIX PERMANENTE - não remover] Promise.all: orders + ads em paralelo
    // setMlData + setMlAdsSpend + setMlAdsAvailable + setMlLoading(false) no MESMO .then()
    // → React 18 bate em UM re-render → lucro não pula entre estados intermediários
    Promise.all([
      fetch(`/api/ml/orders?filter=${filter}`).then(r => r.json()).catch(() => null),
      fetch(`/api/ml/ads?filter=${filter}`).then(r => r.json()).catch(() => null),
    ]).then(([ordersData, adsData]) => {
      if (cancelled) return
      if (ordersData?.notConnected) { setMlNotConnected(true); setMlLoading(false); return }
      if (ordersData && !ordersData.error) {
        const spend = typeof adsData?.spend === 'number' && !adsData?.error ? adsData.spend : 0
        const adsOk = typeof adsData?.spend === 'number' && !adsData?.error
        setMlData(ordersData)
        setMlAdsSpend(spend)
        setMlAdsAvailable(adsOk)
        setMlLoading(false)
        try {
          localStorage.setItem(mlKey, JSON.stringify(ordersData))
          localStorage.setItem(mlAdsKey, String(spend))
        } catch {}
      } else { setMlLoading(false) }
    }).catch(() => { if (!cancelled) setMlLoading(false) })
    return () => { cancelled = true }
  }, [channel, filter])

  const isML = channel === 'ml'
  const d = isML
    ? (mlData ? {
        faturamentoPago: mlData.faturamentoPago, faturamentoBruto: mlData.faturamentoPago,
        pedidosPagos: mlData.pedidosPagos, pedidosGerados: mlData.pedidosPagos,
        ticketMedio: mlData.ticketMedio, hourly: mlData.hourly || Array(24).fill(0),
        states: [], pedidosPendentes: 0, descontos: 0, frete: 0,
        cartaoAprovado: 0, cartaoPendente: 0, pixPago: 0, pixPendente: 0,
        boletoPago: 0, boletoPendente: 0, reenvios: 0, reenviosPct: 0,
      } : {})
    : (data || {})

  const MULT: Record<string, number> = { ecom: 1, ml: 1, shopee: 0.18, geral: 1.53 }
  const m = MULT[channel] || 1
  const fat = Math.round((d.faturamentoPago || 0) * m)
  const pedidos = Math.round((d.pedidosPagos || 0) * m)
  const hourly: number[] = (d.hourly || Array(24).fill(0)).map((v: number) => Math.round(v * m))
  const states = (d.states || []).map((s: any) => ({ ...s, orders: Math.round(s.orders * m), revenue: Math.round(s.revenue * m) }))

  // Custos diferenciados por canal:
  // ML: sem checkout/gateway/Meta/Google — usa Taxa ML no lugar
  // Ecom/Shopee/Geral: taxas normais da Shopify + Meta Ads
  const tCo = isML ? 0 : fat * (taxas.checkout_pct || 0) / 100
  const tGw = isML ? 0 : fat * (taxas.gateway_pct || 0) / 100
  const tIm = fat * (taxas.imposto_pct || 0) / 100
  const tPr = pedidos * (taxas.custo_produto || 0)
  const tFr = (isML || channel === 'shopee') ? 0 : pedidos * (taxas.frete_fixo || 0)
  // [FIX PERMANENTE - não remover] tMl usa taxaMlTotal da API (real) se disponível; fallback 13.5%
  const tMl = isML ? (mlData?.taxaMlTotal ?? fat * (taxas.ml_taxa_pct ?? 13.5) / 100) : 0
  // [FIX PERMANENTE - não remover] tMlAds = gasto real em Publicidade ML (via /api/ml/ads)
  const tMlAds = isML ? mlAdsSpend : 0
  const tMa = isML ? 0 : metaSpend
  const tGo = isML ? 0 : (taxas.google_ads_hoje || 0)
  const tMi = isML ? 0 : tMa * (taxas.imposto_meta_pct || 0) / 100
  const totalCustos = tCo + tGw + tIm + tPr + tFr + tMl + tMlAds + tMa + tGo + tMi
  const lucro = fat - totalCustos
  const margem = fat > 0 ? (lucro / fat) * 100 : 0
  const cpa = pedidos > 0 && tMa > 0 ? tMa / pedidos : null
  const cpaColor = cpa === null ? '#94a3b8' : cpa < (d.ticketMedio || 0) ? '#34d399' : '#f87171'
  const roas = tMa > 0 ? fat / tMa : null
  const roasColor = roas === null ? '#94a3b8' : roas >= 3 ? '#34d399' : roas >= 1.5 ? '#fbbf24' : '#f87171'
  // CPA e ROAS específicos do ML (calculados localmente com mlAdsSpend)
  const mlCpa  = mlAdsAvailable && mlAdsSpend > 0 && pedidos > 0 ? mlAdsSpend / pedidos : null
  const mlRoas = mlAdsAvailable && mlAdsSpend > 0 ? fat / mlAdsSpend : null

  // loading correto por canal: ML usa mlLoading, os outros usam o loading do Shopify+Meta
  const cardLoading = isML ? (mlLoading && !mlData) : loading

  const ccAprov = Math.round((d.cartaoAprovado || 0) * m)
  const ccPend  = Math.round((d.cartaoPendente || 0) * m)
  const pixAprov = Math.round((d.pixPago || 0) * m)
  const pixPend  = Math.round((d.pixPendente || 0) * m)
  const bolAprov = Math.round((d.boletoPago || 0) * m)
  const bolPend  = Math.round((d.boletoPendente || 0) * m)
  const ccTotal  = ccAprov + ccPend
  const pixTotal = pixAprov + pixPend
  const bolTotal = bolAprov + bolPend
  const totalAprovados = ccAprov + pixAprov + bolAprov
  const ccPct  = totalAprovados > 0 ? (ccAprov / totalAprovados) * 100 : 0
  const pixPct = totalAprovados > 0 ? (pixAprov / totalAprovados) * 100 : 0
  const bolPct = totalAprovados > 0 ? (bolAprov / totalAprovados) * 100 : 0
  const ccConv  = ccTotal  > 0 ? (ccAprov  / ccTotal)  * 100 : 0
  const pixConv = pixTotal > 0 ? (pixAprov / pixTotal) * 100 : 0
  const bolConv = bolTotal > 0 ? (bolAprov / bolTotal) * 100 : 0

  const monthFat = Math.round((monthData?.faturamentoPago || 0) * m)
  const pct = Math.min((monthFat / metaGoal) * 100, 100)
  const proj = (monthFat / (new Date().getDate())) * new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
  const maxH = Math.max(...hourly, 1)
  const nowH = new Date().getHours()
  const isSlow = ['30d','7d','month','year','lastyear'].includes(filter)

  return (
    <div>
      <style>{`
        @media(max-width:600px){.grid-lucro-pedidos{grid-template-columns:1fr!important}}
        @keyframes ld-slide{0%{left:-50%;width:45%}60%{width:55%}100%{left:110%;width:45%}}
        @keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>Dashboard</h1>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>Pelos Pets · Visão geral da operação</p>
        </div>
        <div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 6 }}>
            {FILTERS.map(([v, l]) => (
              <button key={v} onClick={() => { setFilter(v); setShowCustom(false) }}
                style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, border: filter === v && !showCustom ? '1.5px solid #6366f1' : '1px solid #2d2d3d', background: filter === v && !showCustom ? 'rgba(99,102,241,0.15)' : 'transparent', color: filter === v && !showCustom ? '#a5b4fc' : '#64748b', cursor: 'pointer' }}>{l}</button>
            ))}
            <button onClick={() => setShowCustom(!showCustom)}
              style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, border: showCustom ? '1.5px solid #6366f1' : '1px solid #2d2d3d', background: showCustom ? 'rgba(99,102,241,0.15)' : 'transparent', color: showCustom ? '#a5b4fc' : '#64748b', cursor: 'pointer' }}>📅 Período</button>
          </div>
          {showCustom && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} style={{ padding: '4px 8px', fontSize: 12, borderRadius: 8, background: '#0f0e17', border: '1px solid #2d2d3d', color: '#e2e8f0' }} />
              <span style={{ color: '#64748b', fontSize: 12 }}>até</span>
              <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} style={{ padding: '4px 8px', fontSize: 12, borderRadius: 8, background: '#0f0e17', border: '1px solid #2d2d3d', color: '#e2e8f0' }} />
              <button onClick={() => { if (customStart && customEnd) { setFilter(`custom:${customStart}:${customEnd}`); setShowCustom(false) } }}
                style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, background: 'linear-gradient(135deg,#4338ca,#7c3aed)', border: 'none', color: '#fff', cursor: 'pointer' }}>Buscar</button>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {CHANNELS.map(ch => (
          <button key={ch.id} onClick={() => setChannel(ch.id)}
            style={{ padding: '7px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, border: channel === ch.id ? '1.5px solid #6366f1' : '1px solid #2d2d3d', background: channel === ch.id ? 'rgba(99,102,241,0.15)' : 'transparent', color: channel === ch.id ? '#a5b4fc' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            {ch.icon} {ch.label}
          </button>
        ))}
      </div>

      {loading && isSlow && (
        <div style={{ marginBottom: 14, padding: '8px 14px', background: '#141320', border: '1px solid #1e1d2e', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ height: 4, flex: 1, background: '#1e1d2e', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, height: '100%', background: 'linear-gradient(90deg,#4338ca,#7c3aed)', borderRadius: 2, animation: 'ld-slide 1.6s ease-in-out infinite' }} />
          </div>
          <span style={{ fontSize: 11, color: '#475569', whiteSpace: 'nowrap' as any }}>
            {filter === 'year' || filter === 'lastyear' ? 'Carregando ano inteiro...' : 'Carregando pedidos...'}
          </span>
        </div>
      )}

      {isML && mlNotConnected && (
        <div style={{ padding: '32px 20px', background: '#141320', border: '1px solid #292131', borderRadius: 14, marginBottom: 14, textAlign: 'center' as any }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>🟡</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 6 }}>Mercado Livre não conectado</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>Conecte sua conta em <strong style={{ color: '#a5b4fc' }}>Integrações</strong> para ver os dados reais do ML.</div>
        </div>
      )}

      {!mlNotConnected && (<>

        {/* KPI cards — repeat(auto-fill, minmax(min(150px,calc(50%-5px)),1fr))
            garante mínimo de 2 colunas em qualquer largura de tela (mobile incluído) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(150px,calc(50% - 5px)),1fr))', gap: 10, marginBottom: 14 }}>
          {([
            { label: 'Faturamento pago', color: '#6366f1', ld: cardLoading, val: brl(fat), sub: isML ? undefined : `Bruto: ${brl(Math.round((d.faturamentoBruto || 0) * m))}` },
            // [FIX PERMANENTE - não remover] ld: cardLoading (Shopify+Meta para ecom, mlLoading para ML)
            { label: 'Lucro líquido',    color: lucro > 0 ? '#34d399' : '#f87171', valColor: lucro > 0 ? '#34d399' : '#f87171', ld: cardLoading, val: brl(lucro), sub: `Margem: ${margem.toFixed(1)}%` },
            { label: 'Pedidos pagos',    color: '#a78bfa', ld: cardLoading, val: num(pedidos), sub: isML ? undefined : `de ${num(Math.round((d.pedidosGerados || 0) * m))} gerados` },
            { label: 'Ticket médio',     color: '#fbbf24', ld: cardLoading, val: brl(d.ticketMedio || 0) },
            { label: 'Total custos',     color: '#f87171', ld: cardLoading, val: brl(totalCustos) },
            // CPA e ROAS só fazem sentido para Ecom (dependem de Meta Ads spend)
            { label: 'CPA',  color: cpaColor,  valColor: cpaColor,  ld: cardLoading, val: isML ? (mlAdsAvailable ? (mlCpa !== null ? brl(mlCpa) : '—') : 'N/A') : (cpa !== null ? brl(cpa) : 'Sem dados de ads'), sub: isML ? (mlAdsAvailable ? 'Ads ML / pedido' : 'Habilitar ads no ML') : 'Custo / pedido pago' },
            { label: 'ROAS', color: roasColor, valColor: roasColor, ld: false,       val: isML ? (mlAdsAvailable ? (mlRoas !== null ? mlRoas.toFixed(2) + 'x' : '—') : 'N/A') : (roas !== null ? roas.toFixed(2) + 'x' : '—'), sub: isML ? (mlAdsAvailable ? 'Fat. / gasto Ads ML' : 'Habilitar ads no ML') : 'Fat. / gasto Ads' },
          ] as { label: string; color: string; valColor?: string; ld: boolean; val: string; sub?: string }[]).map((k, i) => (
            <div key={i} style={{ background: '#141320', border: '1px solid #1e1d2e', borderRadius: 14, padding: '14px 16px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${k.color},transparent)` }} />
              <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' as any, letterSpacing: '0.4px', marginBottom: 6 }}>{k.label}</div>
              {k.ld ? (
                <>{Sk('70%', 22)}<div style={{ height: 5 }} />{Sk('45%', 9)}</>
              ) : (
                <>
                  <div style={{ fontSize: 20, fontWeight: 700, color: k.valColor || '#f1f5f9' }}>{k.val}</div>
                  {k.sub && <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>{k.sub}</div>}
                </>
              )}
            </div>
          ))}
        </div>

        {/* Composição do lucro + Pedidos */}
        <div className="grid-lucro-pedidos" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div style={{ background: '#141320', border: '1px solid #1e1d2e', borderRadius: 14, padding: '16px 18px' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' as any, letterSpacing: '0.5px', marginBottom: 12 }}>Composição do lucro</div>
            {/* [FIX PERMANENTE - não remover] apenas cardLoading controla skeleton aqui */}
            {cardLoading ? (
              Array(9).fill(0).map((_, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #1a1929' }}>
                  {Sk(`${40 + (i % 3) * 10}%`, 9)}{Sk('22%', 9)}
                </div>
              ))
            ) : (
              <>
                {(isML ? [
                  // Composição do lucro específica para Mercado Livre
                  { title: 'Receita', rows: [{ label: 'Faturamento pago', val: fat, pos: true }] },
                  { title: 'Taxa Mercado Livre', rows: [
                    { label: mlData?.taxaMlTotal ? 'Taxa ML (real)' : `Taxa ML (${taxas.ml_taxa_pct ?? 13.5}%)`, val: tMl },
                  ]},
                  ...(tMlAds > 0 ? [{ title: 'Publicidade ML', rows: [{ label: 'Ads Mercado Livre', val: tMlAds }] }] : []),
                  { title: 'Impostos', rows: [
                    { label: `Faturamento (${taxas.imposto_pct || 0}%)`, val: tIm },
                  ]},
                  { title: 'Custos Operacionais', rows: [
                    { label: `Custo produto (${pedidos}x)`, val: tPr },
                    { label: `Frete (${pedidos}x)`, val: tFr },
                  ]},
                ] : [
                  // Composição do lucro para Ecom / Shopee / Geral
                  { title: 'Receita', rows: [{ label: 'Faturamento pago', val: fat, pos: true }] },
                  { title: 'Taxas de Plataforma', rows: [
                    { label: `Checkout (${taxas.checkout_pct || 0}%)`, val: tCo },
                    { label: `Gateway (${taxas.gateway_pct || 0}%)`, val: tGw },
                  ]},
                  { title: 'Impostos', rows: [
                    { label: `Faturamento (${taxas.imposto_pct || 0}%)`, val: tIm },
                    { label: `Meta Ads (${taxas.imposto_meta_pct || 0}%)`, val: tMi },
                  ]},
                  { title: 'Custos Operacionais', rows: [
                    { label: `Custo produto (${pedidos}x)`, val: tPr },
                    { label: `Frete (${pedidos}x)`, val: tFr },
                  ]},
                  { title: 'Publicidade', rows: [
                    { label: 'Meta Ads', val: tMa },
                    { label: 'Google Ads', val: tGo },
                  ]},
                ] as { title: string; rows: { label: string; val: number; pos?: boolean }[] }[]).map((sec, si) => (
                  <div key={si} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#475569', textTransform: 'uppercase' as any, letterSpacing: '0.6px', paddingBottom: 5, marginBottom: 2, borderBottom: '2px solid #2d2d3d' }}>{sec.title}</div>
                    {sec.rows.map((r, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12 }}>
                        <span style={{ color: '#94a3b8' }}>{r.label}</span>
                        <span style={{ fontWeight: 600, color: r.pos ? '#34d399' : '#f87171', marginLeft: 16 }}>{r.pos ? '+' : '-'} {brl(Math.abs(r.val))}</span>
                      </div>
                    ))}
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', marginTop: 4, borderTop: '2px solid #2d2d3d' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>Lucro líquido</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: lucro > 0 ? '#34d399' : '#f87171' }}>{brl(lucro)}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Margem: {margem.toFixed(1)}%</div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div style={{ background: '#141320', border: '1px solid #1e1d2e', borderRadius: 14, padding: '16px 18px' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' as any, letterSpacing: '0.5px', marginBottom: 12 }}>Pedidos</div>
            {cardLoading ? (
              Array(isML ? 3 : 10).fill(0).map((_, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #1a1929' }}>
                  {Sk(`${40 + (i % 3) * 10}%`, 9)}{Sk('22%', 9)}
                </div>
              ))
            ) : (
              (isML ? [
                // ML: só mostra pedidos pagos e ticket médio (dados reais da API do ML)
                { label: 'Pagos', val: num(pedidos), hi: true },
                { label: 'Ticket médio', val: brl(d.ticketMedio || 0), hi: true },
              ] : [
                // Ecom / Shopee / Geral: breakdown completo de pagamentos
                { label: 'Gerados', val: num(Math.round((d.pedidosGerados || 0) * m)) },
                { label: 'Pagos', val: num(pedidos), hi: true },
                { label: 'Pendentes', val: num(Math.round((d.pedidosPendentes || 0) * m)) },
                { label: 'Cartão aprovado', val: num(Math.round((d.cartaoAprovado || 0) * m)), hi: true },
                { label: 'Cartão pendente', val: num(Math.round((d.cartaoPendente || 0) * m)) },
                { label: 'PIX pago', val: num(Math.round((d.pixPago || 0) * m)), hi: true },
                { label: 'PIX pendente', val: num(Math.round((d.pixPendente || 0) * m)) },
                { label: 'Boleto pago', val: num(Math.round((d.boletoPago || 0) * m)), hi: true },
                { label: 'Boleto pendente', val: num(Math.round((d.boletoPendente || 0) * m)) },
                { label: 'Reenvios', val: `${Math.round((d.reenvios || 0) * m)} (${d.reenviosPct || 0}%)`, red: true },
              ]).map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #1a1929', fontSize: 12 }}>
                  <span style={{ color: '#94a3b8' }}>{r.label}</span>
                  <span style={{ fontWeight: 600, color: (r as any).red ? '#fca5a5' : r.hi ? '#a5b4fc' : '#e2e8f0', marginLeft: 16 }}>{r.val}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Métodos de pagamento */}
        <div style={{ background: '#141320', border: '1px solid #1e1d2e', borderRadius: 14, padding: '16px 18px', marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' as any, letterSpacing: '0.5px', marginBottom: 14 }}>Métodos de Pagamento</div>
          {loading ? (
            <>
              <div style={{ ...skSt, height: 10, borderRadius: 6, marginBottom: 18, width: '100%' }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} style={{ background: '#1a1929', border: '1px solid #1e1d2e', borderRadius: 12, padding: '12px 14px' }}>
                    {Sk('60%', 9)}<div style={{ height: 10 }} />{Sk('100%', 4)}<div style={{ height: 10 }} />
                    {Array(3).fill(0).map((__, j) => (
                      <div key={j} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                        {Sk('45%', 9)}{Sk('20%', 9)}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </>
          ) : totalAprovados === 0 ? (
            <div style={{ fontSize: 12, color: '#475569' }}>Sem pedidos pagos no período.</div>
          ) : (
            <>
              <div style={{ display: 'flex', height: 10, borderRadius: 6, overflow: 'hidden', marginBottom: 18, gap: 2 }}>
                {ccPct  > 0 && <div style={{ width: `${ccPct}%`,  background: '#7c3aed', borderRadius: '4px 0 0 4px' }} title={`Cartão ${ccPct.toFixed(1)}%`} />}
                {pixPct > 0 && <div style={{ width: `${pixPct}%`, background: '#34d399' }} title={`PIX ${pixPct.toFixed(1)}%`} />}
                {bolPct > 0 && <div style={{ width: `${bolPct}%`, background: '#fbbf24', borderRadius: '0 4px 4px 0' }} title={`Boleto ${bolPct.toFixed(1)}%`} />}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
                {([
                  { label: 'Cartão', aprov: ccAprov, pend: ccPend, conv: ccConv, pct: ccPct, color: '#7c3aed', bg: 'rgba(124,58,237,0.12)', dot: '#a78bfa' },
                  { label: 'PIX',    aprov: pixAprov, pend: pixPend, conv: pixConv, pct: pixPct, color: '#34d399', bg: 'rgba(52,211,153,0.10)', dot: '#34d399' },
                  { label: 'Boleto', aprov: bolAprov, pend: bolPend, conv: bolConv, pct: bolPct, color: '#fbbf24', bg: 'rgba(251,191,36,0.10)', dot: '#fbbf24' },
                ]).map(pm => (
                  <div key={pm.label} style={{ background: pm.bg, border: `1px solid ${pm.color}22`, borderRadius: 12, padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: pm.dot, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>{pm.label}</span>
                      <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 700, color: pm.dot }}>{pm.pct.toFixed(1)}%</span>
                    </div>
                    <div style={{ height: 4, background: '#1e1d2e', borderRadius: 2, overflow: 'hidden', marginBottom: 10 }}>
                      <div style={{ height: '100%', width: `${pm.pct}%`, background: pm.color, borderRadius: 2 }} />
                    </div>
                    {[
                      { label: 'Aprovados', val: pm.aprov, color: pm.dot },
                      { label: 'Pendentes', val: pm.pend,  color: '#64748b' },
                      { label: 'Conversão', val: `${pm.conv.toFixed(1)}%`, color: pm.conv >= 70 ? '#34d399' : pm.conv >= 40 ? '#fbbf24' : '#f87171' },
                    ].map(r => (
                      <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0' }}>
                        <span style={{ color: '#94a3b8' }}>{r.label}</span>
                        <span style={{ fontWeight: 600, color: r.color }}>{typeof r.val === 'number' ? num(r.val) : r.val}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Funil de Vendas */}
        {(() => {
          const abandoned    = funnel?.abandoned ?? 0
          const gerados      = Math.round((d.pedidosGerados || 0) * m)
          const pagos        = Math.round((d.pedidosPagos   || 0) * m)
          const hasAbandoned = funnel !== null && abandoned > 0
          const iniciados    = hasAbandoned ? abandoned + gerados : gerados
          const steps = hasAbandoned
            ? [
                { label: 'Checkouts iniciados', sub: 'carrinhos abandonados + pedidos gerados', val: iniciados, color: '#6366f1', bg: 'rgba(99,102,241,0.18)' },
                { label: 'Pedidos gerados',     sub: 'checkout finalizado',                     val: gerados,   color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' },
                { label: 'Pedidos pagos',       sub: 'pagamento confirmado',                    val: pagos,     color: '#34d399', bg: 'rgba(52,211,153,0.13)' },
              ]
            : [
                { label: 'Pedidos gerados', sub: 'checkout finalizado',  val: gerados, color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' },
                { label: 'Pedidos pagos',   sub: 'pagamento confirmado', val: pagos,   color: '#34d399', bg: 'rgba(52,211,153,0.13)' },
              ]
          const maxVal   = steps[0]?.val || 1
          const taxaConv = hasAbandoned
            ? (iniciados > 0 ? (pagos / iniciados) * 100 : 0)
            : (gerados   > 0 ? (pagos / gerados)   * 100 : 0)
          return (
            <div style={{ background: '#141320', border: '1px solid #1e1d2e', borderRadius: 14, padding: '16px 18px', marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' as any, letterSpacing: '0.5px' }}>Funil de Vendas</div>
                {(loading || funnel === null) && <span style={{ fontSize: 11, color: '#475569' }}>Carregando...</span>}
              </div>
              {loading ? (
                Array(2).fill(0).map((_, i) => (
                  <div key={i}>
                    {i > 0 && <div style={{ height: 32 }} />}
                    <div style={{ background: '#1a1929', border: '1px solid #2d2d3d', borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        {Sk('38%', 13)}{Sk('18%', 18)}
                      </div>
                      {Sk('100%', 5)}
                    </div>
                  </div>
                ))
              ) : (
                <>
                  {funnel !== null && !hasAbandoned && (
                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 14, padding: '6px 10px', background: '#1a1929', borderRadius: 7, borderLeft: '3px solid #334155' }}>
                      Dados de carrinho abandonado indisponíveis — exibindo pedidos gerados → pagos
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column' as any, gap: 0 }}>
                    {steps.map((step, i) => {
                      const barPct  = (step.val / maxVal) * 100
                      const prevVal = i > 0 ? steps[i - 1].val : null
                      const convPct = prevVal !== null && prevVal > 0 ? (step.val / prevVal) * 100 : null
                      const sairam  = prevVal !== null ? prevVal - step.val : 0
                      const dropPct = convPct !== null ? 100 - convPct : 0
                      return (
                        <div key={i}>
                          {i > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0 7px 12px' }}>
                              <div style={{ width: 1, height: 18, background: '#2d2d3d', marginLeft: 8, flexShrink: 0 }} />
                              <span style={{ fontSize: 11, color: dropPct > 50 ? '#f87171' : dropPct > 20 ? '#fbbf24' : '#34d399' }}>
                                ↓ {convPct !== null ? convPct.toFixed(1) : '0'}% converteram
                              </span>
                              <span style={{ fontSize: 11, color: '#64748b' }}>·</span>
                              <span style={{ fontSize: 11, color: '#f87171' }}>{num(sairam)} saíram</span>
                            </div>
                          )}
                          <div style={{ background: step.bg, border: `1px solid ${step.color}30`, borderRadius: 10, padding: '12px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{step.label}</div>
                                <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{step.sub}</div>
                              </div>
                              <div style={{ textAlign: 'right' as any }}>
                                <div style={{ fontSize: 20, fontWeight: 700, color: step.color }}>{num(step.val)}</div>
                                <div style={{ fontSize: 10, color: '#64748b' }}>
                                  {convPct !== null ? `${convPct.toFixed(1)}% da etapa anterior` : 'topo do funil'}
                                </div>
                              </div>
                            </div>
                            <div style={{ height: 5, background: '#1e1d2e', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${barPct}%`, background: step.color, borderRadius: 3, transition: 'width 0.4s ease' }} />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {hasAbandoned && (
                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #1e1d2e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>Taxa de conversão</span>
                        <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>pedidos pagos / checkouts iniciados</div>
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: taxaConv >= 5 ? '#34d399' : taxaConv >= 2 ? '#fbbf24' : '#f87171' }}>
                        {taxaConv.toFixed(1)}%
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })()}

        {/* Vendas por hora + Meta do mês */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 12, marginBottom: 14 }}>
          <div style={{ background: '#141320', border: '1px solid #1e1d2e', borderRadius: 14, padding: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' as any, letterSpacing: '0.5px', marginBottom: 12 }}>Vendas por hora</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 80 }}>
              {loading
                ? Array(24).fill(0).map((_, i) => {
                    const h = [20,15,25,18,30,22,35,28,40,55,65,70,75,72,68,80,85,78,60,45,35,28,22,18][i] || 20
                    return <div key={i} style={{ ...skSt, flex: 1, height: `${h}%`, borderRadius: '2px 2px 0 0' }} />
                  })
                : hourly.map((v, i) => (
                    <div key={i} title={`${i}h: ${brl(v)}`}
                      style={{ flex: 1, height: `${Math.max((v / maxH) * 100, 3)}%`, background: i === nowH ? '#6366f1' : `rgba(99,102,241,${0.15 + (v / maxH) * 0.5})`, borderRadius: '2px 2px 0 0' }} />
                  ))
              }
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: '#475569' }}>
              <span>00h</span><span>12h</span><span>23h</span>
            </div>
          </div>
          <div style={{ background: '#141320', border: '1px solid #1e1d2e', borderRadius: 14, padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' as any, letterSpacing: '0.5px' }}>Meta do mês</span>
              {!monthData ? Sk('20%', 14) : <span style={{ fontSize: 12, color: '#a5b4fc', fontWeight: 600 }}>{pct.toFixed(1)}%</span>}
            </div>
            {!monthData ? (
              <>{Sk('55%', 22)}<div style={{ height: 6 }} />{Sk('42%', 10)}<div style={{ height: 12 }} />{Sk('100%', 6)}<div style={{ height: 12 }} />{Array(2).fill(0).map((_, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>{Sk('45%', 9)}{Sk('25%', 9)}</div>)}</>
            ) : (
              <>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>{brl(monthFat)}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>de {brl(metaGoal)}</div>
                <div style={{ height: 6, background: '#1e1d2e', borderRadius: 3, overflow: 'hidden', marginBottom: 10 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#4338ca,#7c3aed)', borderRadius: 3 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div><div style={{ fontSize: 11, color: '#64748b' }}>Projeção</div><div style={{ fontSize: 13, fontWeight: 600, color: proj >= metaGoal ? '#34d399' : '#fbbf24' }}>{brl(proj)}</div></div>
                  <div style={{ textAlign: 'right' }}><div style={{ fontSize: 11, color: '#64748b' }}>Faltam</div><div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>{brl(Math.max(metaGoal - monthFat, 0))}</div></div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Vendas por estado + Ranking de produtos */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 12 }}>
          <div style={{ background: '#141320', border: '1px solid #1e1d2e', borderRadius: 14, padding: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' as any, letterSpacing: '0.5px', marginBottom: 12 }}>Vendas por estado</div>
            {loading
              ? Array(5).fill(0).map((_, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #1a1929' }}>
                    {Sk('40%', 9)}{Sk('25%', 9)}
                  </div>
                ))
              : states.length === 0
                ? <div style={{ fontSize: 12, color: '#475569' }}>Sem dados</div>
                : states.map((s: any, i: number) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: i < states.length - 1 ? '1px solid #1a1929' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#a5b4fc', minWidth: 28 }}>{s.state}</span>
                        <div style={{ height: 3, width: `${s.pct * 1.6}px`, background: 'linear-gradient(90deg,#4338ca,#7c3aed)', borderRadius: 2 }} />
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>{brl(s.revenue)}</div>
                        <div style={{ fontSize: 10, color: '#64748b' }}>{s.orders} pedidos</div>
                      </div>
                    </div>
                  ))
            }
          </div>
          <div style={{ background: '#141320', border: '1px solid #1e1d2e', borderRadius: 14, padding: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' as any, letterSpacing: '0.5px', marginBottom: 12 }}>Ranking de produtos</div>
            {loading
              ? Array(5).fill(0).map((_, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #1a1929' }}>
                    {Sk('50%', 9)}{Sk('20%', 9)}
                  </div>
                ))
              : products.length === 0
                ? <div style={{ fontSize: 12, color: '#475569' }}>Sem dados para o período.</div>
                : products.map((p, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: i < products.length - 1 ? '1px solid #1a1929' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', minWidth: 20, flexShrink: 0 }}>#{i + 1}</span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as any }}>{p.product_title}</div>
                          {p.variant_title && <div style={{ fontSize: 10, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as any }}>{p.variant_title}</div>}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' as any, flexShrink: 0, marginLeft: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#34d399' }}>{brl(p.revenue)}</div>
                        <div style={{ fontSize: 10, color: '#64748b' }}>{p.qty} un.</div>
                      </div>
                    </div>
                  ))
            }
          </div>
        </div>

      </>)}
    </div>
  )
}
