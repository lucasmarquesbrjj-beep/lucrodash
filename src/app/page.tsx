'use client'
import { useState, useEffect, useLayoutEffect } from 'react'

const brl = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
const num = (v: number) => new Intl.NumberFormat('pt-BR').format(v)

type Page = 'dashboard' | 'produtos' | 'taxas' | 'lancamentos' | 'integracoes' | 'configuracoes'
const PAGE_LABELS: Record<Page, string> = {
  dashboard: 'Dashboard', produtos: 'Produtos', taxas: 'Taxas & Tarifas',
  lancamentos: 'Lançamentos Manuais', integracoes: 'Integrações', configuracoes: 'Configurações'
}
const NAV_ITEMS: { id: Page; icon: string; label: string }[] = [
  { id: 'dashboard', icon: '▣', label: 'Dashboard' },
  { id: 'produtos', icon: '◈', label: 'Produtos' },
  { id: 'taxas', icon: '%', label: 'Taxas & Tarifas' },
  { id: 'lancamentos', icon: '⊕', label: 'Lançamentos Manuais' },
  { id: 'integracoes', icon: '⬡', label: 'Integrações' },
  { id: 'configuracoes', icon: '⚙', label: 'Configurações' },
]

function LoginPage({ onLogin }: { onLogin: (nome: string) => void }) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const doLogin = async () => {
    setLoading(true); setErro(false)
    const res = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    })
    const data = await res.json()
    if (data.success) { localStorage.setItem('holydash_user', data.nome); onLogin(data.nome) }
    else setErro(true)
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0918', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <svg width="56" height="56" viewBox="0 0 100 100" fill="none">
            <rect width="20" height="40" x="5" y="55" rx="3" fill="url(#lg1)" />
            <rect width="20" height="55" x="30" y="40" rx="3" fill="url(#lg1)" />
            <rect width="20" height="70" x="55" y="25" rx="3" fill="url(#lg1)" />
            <rect width="20" height="85" x="80" y="10" rx="3" fill="url(#lg1)" />
            <path d="M15 65 Q42 35 65 20 L90 8" stroke="url(#lg2)" strokeWidth="5" fill="none" strokeLinecap="round" />
            <polygon points="88,2 97,15 82,13" fill="#4ade80" />
            <defs>
              <linearGradient id="lg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7c3aed" /><stop offset="100%" stopColor="#4ade80" /></linearGradient>
              <linearGradient id="lg2" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#7c3aed" /><stop offset="100%" stopColor="#4ade80" /></linearGradient>
            </defs>
          </svg>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', marginTop: 12 }}>Holy Dash</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Ferramentas para quem constrói com propósito</div>
        </div>
        <div style={{ background: '#141320', border: '1px solid #1e1d2e', borderRadius: 16, padding: 28 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com"
              onKeyDown={e => e.key === 'Enter' && doLogin()}
              style={{ width: '100%', padding: '10px 14px', background: '#0f0e17', border: '1px solid #2d2d3d', borderRadius: 10, color: '#f1f5f9', fontSize: 14, boxSizing: 'border-box' as any }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6 }}>Senha</label>
            <div style={{ position: 'relative' }}>
              <input type={showPass ? 'text' : 'password'} value={senha} onChange={e => setSenha(e.target.value)} placeholder="••••••••"
                onKeyDown={e => e.key === 'Enter' && doLogin()}
                style={{ width: '100%', padding: '10px 44px 10px 14px', background: '#0f0e17', border: '1px solid #2d2d3d', borderRadius: 10, color: '#f1f5f9', fontSize: 14, boxSizing: 'border-box' as any }} />
              <button onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#64748b', fontSize: 16, cursor: 'pointer' }}>{showPass ? '🙈' : '👁️'}</button>
            </div>
          </div>
          {erro && <div style={{ fontSize: 12, color: '#f87171', textAlign: 'center', marginBottom: 12 }}>Email ou senha incorretos</div>}
          <button onClick={doLogin} disabled={loading}
            style={{ width: '100%', padding: 12, borderRadius: 10, background: 'linear-gradient(135deg,#4338ca,#7c3aed)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 8, opacity: loading ? 0.7 : 1 }}>
            {loading ? '⏳ Entrando...' : 'Entrar'}
          </button>
          <button onClick={() => { localStorage.setItem('holydash_user', 'Demo'); onLogin('Demo') }}
            style={{ width: '100%', padding: 10, borderRadius: 10, background: 'transparent', border: '1px solid #2d2d3d', color: '#64748b', fontSize: 13, cursor: 'pointer' }}>
            Entrar sem senha (demo)
          </button>
        </div>
      </div>
    </div>
  )
}

function Toast({ msg, onHide }: { msg: string; onHide: () => void }) {
  useEffect(() => { const t = setTimeout(onHide, 2500); return () => clearTimeout(t) }, [msg])
  return (
    <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#1e1d2e', border: '1px solid #34d399', borderRadius: 10, padding: '10px 20px', fontSize: 13, color: '#34d399', zIndex: 200, whiteSpace: 'nowrap' }}>
      ✓ {msg}
    </div>
  )
}

const FILTERS = [['today','Hoje'],['yesterday','Ontem'],['anteontem','Anteontem'],['7d','7 dias'],['month','Este mês'],['30d','30 dias'],['year','Este ano'],['lastyear','Ano passado']]
const CHANNELS = [
  { id: 'ecom', icon: '🛒', label: 'E-commerce' },
  { id: 'ml', icon: '🟡', label: 'Mercado Livre' },
  { id: 'shopee', icon: '🧡', label: 'Shopee' },
  { id: 'geral', icon: '📊', label: 'Geral' },
]

function DashPage({ taxas }: { taxas: any }) {
  const [filter, setFilter] = useState('today')
  const [channel, setChannel] = useState('ecom')
  const [showCustom, setShowCustom] = useState(false)
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [data, setData] = useState<any>(() => {
    try { const s = localStorage.getItem('hd_today'); return s ? JSON.parse(s) : null } catch { return null }
  })
  const [loading, setLoading] = useState<boolean>(() => {
    try { return localStorage.getItem('hd_today') === null } catch { return true }
  })
  const [metaLoading, setMetaLoading] = useState<boolean>(() => {
    try { return localStorage.getItem('hd_meta_today') === null } catch { return true }
  })
  const [metaSpend, setMetaSpend] = useState<number | null>(() => {
    try { const s = localStorage.getItem('hd_meta_today'); return s !== null ? Number(s) : null } catch { return null }
  })
  const [monthData, setMonthData] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [funnel, setFunnel] = useState<{ abandoned: number } | null>(null)
  const [mlData, setMlData] = useState<any>(null)
  const [mlLoading, setMlLoading] = useState(false)
  const [mlNotConnected, setMlNotConnected] = useState(false)
  const metaGoal = taxas.meta_mensal ?? 250000

  useEffect(() => {
    let cancelled = false
    setProducts([]); setFunnel(null)

    // Stale-while-revalidate for orders
    const cacheKey = `hd_${filter}`
    try {
      const stale = localStorage.getItem(cacheKey)
      if (stale) { setData(JSON.parse(stale)); setLoading(false) }
      else { setData(null); setLoading(true) }
    } catch { setData(null); setLoading(true) }

    // Stale-while-revalidate for meta spend
    const metaKey = `hd_meta_${filter}`
    try {
      const staleMeta = localStorage.getItem(metaKey)
      if (staleMeta !== null) { setMetaSpend(Number(staleMeta)); setMetaLoading(false) }
      else { setMetaSpend(null); setMetaLoading(true) }
    } catch { setMetaSpend(null); setMetaLoading(true) }

    fetch(`/api/shopify/orders?filter=${filter}`)
      .then(r => r.json())
      .then(d => {
        if (!cancelled && !d?.error) {
          setData(d); setLoading(false)
          try { localStorage.setItem(cacheKey, JSON.stringify(d)) } catch {}
        }
      })
      .catch(() => { if (!cancelled) setLoading(false) })
    fetch(`/api/meta/spend?filter=${filter}`)
      .then(r => r.json())
      .then(d => {
        if (!cancelled && typeof d.spend === 'number') {
          setMetaSpend(d.spend); setMetaLoading(false)
          try { localStorage.setItem(metaKey, String(d.spend)) } catch {}
        }
      })
      .catch(() => { if (!cancelled) setMetaLoading(false) })
    fetch('/api/shopify/orders?filter=month')
      .then(r => r.json()).then(d => { if (!cancelled) setMonthData(d) }).catch(() => {})
    fetch(`/api/shopify/products?filter=${filter}`)
      .then(r => r.json()).then(d => { if (!cancelled && Array.isArray(d.products)) setProducts(d.products) }).catch(() => {})
    fetch(`/api/shopify/funnel?filter=${filter}`)
      .then(r => r.json()).then(d => { if (!cancelled) setFunnel({ abandoned: d.abandoned ?? 0 }) }).catch(() => {})
    return () => { cancelled = true }
  }, [filter])

  useEffect(() => {
    if (channel !== 'ml') { setMlData(null); setMlNotConnected(false); return }
    let cancelled = false
    setMlNotConnected(false)
    const mlKey = `hd_ml_${filter}`
    try {
      const stale = localStorage.getItem(mlKey)
      if (stale) { setMlData(JSON.parse(stale)); setMlLoading(false) }
      else { setMlData(null); setMlLoading(true) }
    } catch { setMlData(null); setMlLoading(true) }
    fetch(`/api/ml/orders?filter=${filter}`)
      .then(r => r.json())
      .then(d => {
        if (!cancelled) {
          if (d.notConnected) { setMlNotConnected(true); setMlLoading(false) }
          else if (!d.error) {
            setMlData(d); setMlLoading(false)
            try { localStorage.setItem(mlKey, JSON.stringify(d)) } catch {}
          } else setMlLoading(false)
        }
      })
      .catch(() => { if (!cancelled) setMlLoading(false) })
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

  const tCo = fat * (taxas.checkout_pct || 0) / 100
  const tGw = fat * (taxas.gateway_pct || 0) / 100
  const tIm = fat * (taxas.imposto_pct || 0) / 100
  const tPr = pedidos * (taxas.custo_produto || 0)
  const tFr = pedidos * (taxas.frete_fixo || 0)
  const tMa = metaSpend !== null ? metaSpend : (filter === 'today' ? (taxas.meta_ads_hoje ?? 0) : 0)
  const tGo = taxas.google_ads_hoje || 0
  const tMi = tMa * (taxas.imposto_meta_pct || 0) / 100
  const totalCustos = tCo + tGw + tIm + tPr + tFr + tMa + tGo + tMi
  const lucro = fat - totalCustos
  const margem = fat > 0 ? (lucro / fat) * 100 : 0
  const cpa = pedidos > 0 && tMa > 0 ? tMa / pedidos : null
  const cpaColor = cpa === null ? '#94a3b8' : cpa < (d.ticketMedio || 0) ? '#34d399' : '#f87171'
  const roas = tMa > 0 ? fat / tMa : null
  const roasColor = roas === null ? '#94a3b8' : roas >= 3 ? '#34d399' : roas >= 1.5 ? '#fbbf24' : '#f87171'

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

  const skSt: React.CSSProperties = {
    background: 'linear-gradient(90deg,#1a1929 25%,#252436 50%,#1a1929 75%)',
    backgroundSize: '400px 100%',
    animation: 'shimmer 1.4s infinite linear',
    borderRadius: 5,
  }
  const Sk = (w: string, h: number) => <div style={{ ...skSt, width: w, height: h }} />

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

      {/* Slow query progress bar */}
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

      {/* ML not connected */}
      {isML && mlNotConnected && (
        <div style={{ padding: '32px 20px', background: '#141320', border: '1px solid #292131', borderRadius: 14, marginBottom: 14, textAlign: 'center' as any }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>🟡</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 6 }}>Mercado Livre não conectado</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>Conecte sua conta em <strong style={{ color: '#a5b4fc' }}>Integrações</strong> para ver os dados reais do ML.</div>
        </div>
      )}

      {!mlNotConnected && (<>

        {/* KPI cards — always rendered, inline skeletons by data source */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10, marginBottom: 14 }}>
          {([
            { label: 'Faturamento pago', color: '#6366f1', ld: loading, val: brl(fat), sub: `Bruto: ${brl(Math.round((d.faturamentoBruto || 0) * m))}` },
            { label: 'Lucro líquido',    color: lucro > 0 ? '#34d399' : '#f87171', valColor: lucro > 0 ? '#34d399' : '#f87171', ld: loading || metaLoading, val: brl(lucro), sub: `Margem: ${margem.toFixed(1)}%` },
            { label: 'Pedidos pagos',    color: '#a78bfa', ld: loading, val: num(pedidos), sub: `de ${num(Math.round((d.pedidosGerados || 0) * m))} gerados` },
            { label: 'Ticket médio',     color: '#fbbf24', ld: loading, val: brl(d.ticketMedio || 0) },
            { label: 'Total custos',     color: '#f87171', ld: loading || metaLoading, val: brl(totalCustos) },
            { label: 'CPA',              color: cpaColor, valColor: cpaColor, ld: loading || metaLoading, val: cpa !== null ? brl(cpa) : 'Sem dados de ads', sub: 'Custo / pedido pago' },
            { label: 'ROAS',             color: roasColor, valColor: roasColor, ld: metaLoading, val: roas !== null ? roas.toFixed(2) + 'x' : '—', sub: 'Fat. / gasto Ads' },
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
            {(loading || metaLoading) ? (
              Array(9).fill(0).map((_, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #1a1929' }}>
                  {Sk(`${40 + (i % 3) * 10}%`, 9)}{Sk('22%', 9)}
                </div>
              ))
            ) : (
              <>
                {([
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
            {loading ? (
              Array(10).fill(0).map((_, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #1a1929' }}>
                  {Sk(`${40 + (i % 3) * 10}%`, 9)}{Sk('22%', 9)}
                </div>
              ))
            ) : (
              [
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
              ].map((r, i) => (
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
                  { label: 'Cartão', aprov: ccAprov,  pend: ccPend,  conv: ccConv,  pct: ccPct,  color: '#7c3aed', bg: 'rgba(124,58,237,0.12)', dot: '#a78bfa' },
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

        {/* Funil */}
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

function TaxasPage({ taxas, onSave, onToast }: { taxas: any; onSave: (t: any) => void; onToast: (m: string) => void }) {
  const [t, setT] = useState({
    checkout_pct: taxas.checkout_pct ?? 0.5,
    gateway_pct: taxas.gateway_pct ?? 5,
    imposto_pct: taxas.imposto_pct ?? 16,
    imposto_meta_pct: taxas.imposto_meta_pct ?? 13.65,
    frete_fixo: taxas.frete_fixo ?? 15,
    custo_produto: taxas.custo_produto ?? 8,
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await fetch('/api/taxas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(t) })
    onSave(t); onToast('Taxas salvas com sucesso!')
    setSaving(false)
  }

  const field = (label: string, k: keyof typeof t, suf = '%', hint = '') => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 11, color: '#64748b', fontWeight: 500, display: 'block', marginBottom: 5 }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="number" step="0.01" value={t[k]} onChange={e => setT(p => ({ ...p, [k]: parseFloat(e.target.value) || 0 }))}
          style={{ width: 100, flexShrink: 0, background: '#0f0e17', border: '1px solid #2d2d3d', borderRadius: 8, padding: '8px 12px', color: '#e2e8f0', fontSize: 14 }} />
        <span style={{ fontSize: 12, color: '#64748b' }}>{suf}</span>
      </div>
      {hint && <span style={{ fontSize: 10, color: '#475569', marginTop: 3, display: 'block' }}>{hint}</span>}
    </div>
  )

  const sections = [
    { title: 'Taxas de pagamento', color: '#a5b4fc', fields: [['Taxa checkout %','checkout_pct','%','Percentual por venda'],['Taxa gateway','gateway_pct','%','Sobre valor aprovado']] },
    { title: 'Custos fixos', color: '#fbbf24', fields: [['Custo por produto','custo_produto','R$','Por unidade vendida'],['Frete por pedido','frete_fixo','R$','Custo médio de envio']] },
    { title: 'Impostos', color: '#f87171', fields: [['Imposto s/ faturamento','imposto_pct','%','Sobre receita paga'],['Imposto s/ Meta Ads','imposto_meta_pct','%','IOF + ISS sobre ads']] },
  ]

  return (
    <div>
      <div style={{ marginBottom: 18 }}><h1 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>Taxas & Tarifas</h1><p style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>Configure tudo que impacta seu lucro</p></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
        {sections.map(s => (
          <div key={s.title} style={{ background: '#141320', border: '1px solid #1e1d2e', borderRadius: 14, padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: s.color, marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid #1e1d2e' }}>{s.title}</div>
            {s.fields.map(([l, k, sf, h]) => field(l, k as keyof typeof t, sf, h))}
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'right', marginTop: 14 }}>
        <button onClick={handleSave} disabled={saving}
          style={{ padding: '9px 24px', borderRadius: 10, fontSize: 13, fontWeight: 700, border: 'none', background: 'linear-gradient(135deg,#4338ca,#7c3aed)', color: '#fff', cursor: 'pointer' }}>
          {saving ? '⏳ Salvando...' : 'Salvar Configurações'}
        </button>
      </div>
    </div>
  )
}

function LancamentosPage({ onToast }: { onToast: (m: string) => void }) {
  const [entries, setEntries] = useState([
    { id: 1, date: '2026-04-15', tipo: 'Google Ads', valor: 380, obs: 'Campanha search' },
    { id: 2, date: '2026-04-14', tipo: 'Despesa Fixa', valor: 500, obs: 'Shopify' },
  ])
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], tipo: 'Google Ads', valor: '', obs: '' })

  const add = () => {
    if (form.valor) {
      setEntries(p => [{ ...form, id: Date.now(), valor: parseFloat(form.valor) }, ...p])
      setForm(p => ({ ...p, valor: '', obs: '' }))
      onToast('Lançamento adicionado!')
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 18 }}><h1 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>Lançamentos Manuais</h1><p style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>Google Ads, despesas extras e outras entradas</p></div>
      <div style={{ background: '#141320', border: '1px solid #1e1d2e', borderRadius: 14, padding: 18, marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, color: '#64748b' }}>Data</label>
            <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} style={{ width: 150, background: '#0f0e17', border: '1px solid #2d2d3d', borderRadius: 8, padding: '8px 12px', color: '#e2e8f0', fontSize: 14 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, color: '#64748b' }}>Tipo</label>
            <select value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))} style={{ width: 160, background: '#0f0e17', border: '1px solid #2d2d3d', borderRadius: 8, padding: '8px 12px', color: '#e2e8f0', fontSize: 14 }}>
              {['Google Ads','TikTok Ads','Despesa Fixa','Despesa Variável','Outro'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, color: '#64748b' }}>Valor (R$)</label>
            <input type="number" placeholder="0,00" value={form.valor} onChange={e => setForm(p => ({ ...p, valor: e.target.value }))} style={{ width: 120, background: '#0f0e17', border: '1px solid #2d2d3d', borderRadius: 8, padding: '8px 12px', color: '#e2e8f0', fontSize: 14 }} />
          </div>
          <div style={{ flex: 1, minWidth: 160, display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, color: '#64748b' }}>Observação</label>
            <input placeholder="Opcional..." value={form.obs} onChange={e => setForm(p => ({ ...p, obs: e.target.value }))} style={{ background: '#0f0e17', border: '1px solid #2d2d3d', borderRadius: 8, padding: '8px 12px', color: '#e2e8f0', fontSize: 14 }} />
          </div>
          <button onClick={add} style={{ padding: '9px 20px', borderRadius: 8, background: 'linear-gradient(135deg,#4338ca,#7c3aed)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Adicionar</button>
        </div>
      </div>
      <div style={{ background: '#141320', border: '1px solid #1e1d2e', borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ background: '#0f0e17' }}>{['Data','Tipo','Valor','Observação',''].map(h => <th key={h} style={{ fontSize: 11, color: '#475569', fontWeight: 600, textAlign: 'left', padding: '10px 14px', borderBottom: '1px solid #1e1d2e' }}>{h}</th>)}</tr></thead>
          <tbody>
            {entries.map(e => (
              <tr key={e.id} style={{ borderBottom: '1px solid #1a1929' }}>
                <td style={{ padding: '11px 14px', fontSize: 13, color: '#64748b' }}>{e.date}</td>
                <td style={{ padding: '11px 14px' }}><span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: e.tipo.includes('Ads') ? 'rgba(251,191,36,0.12)' : 'rgba(99,102,241,0.12)', color: e.tipo.includes('Ads') ? '#fbbf24' : '#a5b4fc' }}>{e.tipo}</span></td>
                <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 700, color: '#f87171' }}>{brl(e.valor)}</td>
                <td style={{ padding: '11px 14px', fontSize: 13, color: '#64748b' }}>{e.obs || '—'}</td>
                <td style={{ padding: '11px 14px' }}><button onClick={() => setEntries(p => p.filter(x => x.id !== e.id))} style={{ padding: '3px 9px', borderRadius: 6, background: 'transparent', border: '1px solid #2d2d3d', color: '#f87171', fontSize: 11, cursor: 'pointer' }}>✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function IntegracoesPage({ onToast }: { onToast: (m: string) => void }) {
  const [shopify, setShopify] = useState(true)
  const [meta, setMeta] = useState(false)
  const [ml, setMl] = useState(false)
  const [shopee, setShopee] = useState(false)
  const [google, setGoogle] = useState(false)

  useEffect(() => {
    fetch('/api/taxas')
      .then(r => r.json())
      .then(d => {
        if (d.meta_access_token) setMeta(true)
        if (d.ml_access_token) setMl(true)
      })
  }, [])

  const IntCard = ({ icon, iconBg, title, desc, connected, onToggle, connectLabel, connectBg }: any) => (
    <div style={{ background: '#141320', border: '1px solid #1e1d2e', borderRadius: 14, padding: 18, marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>{title}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{desc}</div>
        </div>
        <span style={{ fontSize: 11, padding: '4px 12px', borderRadius: 20, fontWeight: 600, background: connected ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)', color: connected ? '#34d399' : '#f87171' }}>● {connected ? 'Conectado' : 'Desconectado'}</span>
      </div>
      <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #1e1d2e' }}>
        <button onClick={onToggle} style={{ padding: '8px 18px', borderRadius: 10, border: connected ? '1px solid #f87171' : 'none', background: connected ? 'transparent' : connectBg, color: connected ? '#f87171' : '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          {connected ? 'Desconectar' : connectLabel}
        </button>
      </div>
    </div>
  )

  return (
    <div>
      <div style={{ marginBottom: 18 }}><h1 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>Integrações</h1><p style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>Conecte suas plataformas</p></div>
      <IntCard icon="🛒" iconBg="rgba(149,191,71,0.15)" title="Shopify" desc="Pedidos e faturamento em tempo real" connected={shopify} connectLabel="Conectar com Shopify" connectBg="linear-gradient(135deg,#4338ca,#7c3aed)" onToggle={() => { setShopify(!shopify); onToast(shopify ? 'Shopify desconectada' : 'Shopify conectada!') }} />
      <IntCard icon="📘" iconBg="rgba(24,119,242,0.15)" title="Meta Ads" desc="Gastos com anúncios automaticamente" connected={meta} connectLabel="Conectar com Facebook" connectBg="linear-gradient(135deg,#1877f2,#0d5abf)" onToggle={() => { if (!meta) { window.location.href = '/api/auth/meta' } else { setMeta(false); onToast('Meta Ads desconectado') } }} />
      <IntCard icon="🟡" iconBg="rgba(251,191,36,0.15)" title="Mercado Livre" desc="Pedidos e faturamento do ML" connected={ml} connectLabel="Conectar com Mercado Livre" connectBg="linear-gradient(135deg,#f5a623,#e08e00)" onToggle={() => { if (!ml) { window.location.href = '/api/auth/ml' } else { setMl(false); onToast('Mercado Livre desconectado') } }} />
      <IntCard icon="🧡" iconBg="rgba(249,115,22,0.15)" title="Shopee" desc="Pedidos e faturamento da Shopee" connected={shopee} connectLabel="Conectar com Shopee" connectBg="linear-gradient(135deg,#f97316,#c2410c)" onToggle={() => { setShopee(!shopee); onToast(shopee ? 'Shopee desconectada' : 'Shopee conectada!') }} />
      <IntCard icon="🎯" iconBg="rgba(234,67,53,0.15)" title="Google Ads" desc="Gastos com anúncios automaticamente" connected={google} connectLabel="Conectar com Google Ads" connectBg="linear-gradient(135deg,#ea4335,#c5221f)" onToggle={() => { setGoogle(!google); onToast(google ? 'Google Ads desconectado' : 'Google Ads conectado!') }} />
    </div>
  )
}

function ConfiguracoesPage({ taxas, onSave, onToast }: { taxas: any; onSave: (t: any) => void; onToast: (m: string) => void }) {
  const [metaMensal, setMetaMensal] = useState<number>(taxas.meta_mensal ?? 250000)
  const [saving, setSaving] = useState(false)

  useEffect(() => { setMetaMensal(taxas.meta_mensal ?? 250000) }, [taxas.meta_mensal])

  const handleSave = async () => {
    setSaving(true)
    const res = await fetch('/api/taxas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ meta_mensal: metaMensal }) })
    const updated = await res.json()
    onSave({ ...taxas, ...updated, meta_mensal: metaMensal })
    onToast('Configurações salvas!')
    setSaving(false)
  }

  return (
    <div>
      <div style={{ marginBottom: 18 }}><h1 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>Configurações</h1><p style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>Personalize sua conta</p></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 14 }}>
        <div style={{ background: '#141320', border: '1px solid #1e1d2e', borderRadius: 14, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#a5b4fc', marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid #1e1d2e' }}>🏪 Sua Loja</div>
          {[['Nome da loja','Pelos Pets'],['Domínio Shopify','pelos-pets-9091.myshopify.com']].map(([l, v]) => (
            <div key={l} style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 5 }}>{l}</label>
              <input type="text" defaultValue={v} style={{ width: '100%', background: '#0f0e17', border: '1px solid #2d2d3d', borderRadius: 8, padding: '8px 12px', color: '#e2e8f0', fontSize: 14, boxSizing: 'border-box' as any }} />
            </div>
          ))}
        </div>
        <div style={{ background: '#141320', border: '1px solid #1e1d2e', borderRadius: 14, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#a5b4fc', marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid #1e1d2e' }}>🎯 Metas</div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 5 }}>Meta de faturamento mensal (R$)</label>
            <input type="number" value={metaMensal} onChange={e => setMetaMensal(parseFloat(e.target.value) || 0)}
              style={{ width: '100%', background: '#0f0e17', border: '1px solid #2d2d3d', borderRadius: 8, padding: '8px 12px', color: '#e2e8f0', fontSize: 14, boxSizing: 'border-box' as any }} />
            <span style={{ fontSize: 10, color: '#475569', marginTop: 3, display: 'block' }}>Aparece no card "Meta do Mês" do dashboard</span>
          </div>
        </div>
      </div>
      <div style={{ textAlign: 'right', marginTop: 14 }}>
        <button onClick={handleSave} disabled={saving} style={{ padding: '9px 24px', borderRadius: 10, fontSize: 13, fontWeight: 700, border: 'none', background: 'linear-gradient(135deg,#4338ca,#7c3aed)', color: '#fff', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
          {saving ? '⏳ Salvando...' : 'Salvar Configurações'}
        </button>
      </div>
    </div>
  )
}

const PROD_FILTERS = [['today','Hoje'],['yesterday','Ontem'],['7d','7 dias'],['month','Este mês'],['30d','30 dias'],['year','Este ano'],['lastyear','Ano passado']]

function ProdutosPage() {
  const [activeTab, setActiveTab] = useState<'vendidos' | 'catalogo'>('vendidos')

  // Mais Vendidos
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orderCount, setOrderCount] = useState(0)
  const [filter, setFilter] = useState('month')
  const [showCustom, setShowCustom] = useState(false)
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  // Catálogo
  const [catalog, setCatalog] = useState<any[]>([])
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [totalProducts, setTotalProducts] = useState(0)
  const [totalVariants, setTotalVariants] = useState(0)
  const [catalogLoaded, setCatalogLoaded] = useState(false)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [catalogSearch, setCatalogSearch] = useState('')

  useEffect(() => {
    setLoading(true); setError(null); setProducts([]); setOrderCount(0)
    let cancelled = false
    fetch(`/api/shopify/products?filter=${encodeURIComponent(filter)}`)
      .then(r => r.json())
      .then(d => {
        if (cancelled) return
        if (d.error) { setError(d.error); return }
        if (Array.isArray(d.products)) { setProducts(d.products); setOrderCount(d.orderCount || 0) }
      })
      .catch(e => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [filter])

  useEffect(() => {
    if (activeTab !== 'catalogo' || catalogLoaded) return
    setCatalogLoading(true); setCatalogError(null)
    fetch('/api/shopify/catalog')
      .then(r => r.json())
      .then(d => {
        if (d.error) { setCatalogError(d.error); return }
        setCatalog(d.catalog || [])
        setTotalProducts(d.totalProducts || 0)
        setTotalVariants(d.totalVariants || 0)
        setCatalogLoaded(true)
      })
      .catch(e => setCatalogError(e.message))
      .finally(() => setCatalogLoading(false))
  }, [activeTab, catalogLoaded])

  const toggleExpand = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  const filteredCatalog = catalogSearch.trim()
    ? catalog.filter(p =>
        p.title.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        p.variants.some((v: any) => v.sku?.toLowerCase().includes(catalogSearch.toLowerCase()) || v.title?.toLowerCase().includes(catalogSearch.toLowerCase()))
      )
    : catalog

  const isLarge = filter === 'year' || filter === 'lastyear'
  const loadingMsg = filter === '30d' ? 'Carregando 30 dias de pedidos...'
    : isLarge ? 'Carregando dados do ano inteiro, aguarde...'
    : 'Buscando produtos...'

  return (
    <div>
      <style>{`@keyframes ld-slide2{0%{left:-50%;width:45%}60%{width:55%}100%{left:110%;width:45%}}`}</style>

      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>Produtos</h1>
        <p style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>Ranking de vendas e catálogo da loja</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #1e1d2e', paddingBottom: 0 }}>
        {([['vendidos', 'Mais Vendidos'], ['catalogo', 'Catálogo']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            style={{ padding: '8px 18px', fontSize: 13, fontWeight: 600, background: 'transparent', border: 'none', borderBottom: activeTab === id ? '2px solid #6366f1' : '2px solid transparent', color: activeTab === id ? '#a5b4fc' : '#475569', cursor: 'pointer', marginBottom: -1 }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Mais Vendidos ── */}
      {activeTab === 'vendidos' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14, flexWrap: 'wrap', gap: 6 }}>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {PROD_FILTERS.map(([v, l]) => (
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

          {loading && (
            <div style={{ padding: '48px 20px', textAlign: 'center' }}>
              <div style={{ maxWidth: 360, margin: '0 auto' }}>
                <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 14 }}>{loadingMsg}</div>
                {!['today','yesterday','anteontem'].includes(filter) && (
                  <div style={{ height: 5, background: '#1e1d2e', borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 0, height: '100%', background: 'linear-gradient(90deg,#4338ca,#7c3aed)', borderRadius: 3, animation: 'ld-slide2 1.6s ease-in-out infinite' }} />
                  </div>
                )}
              </div>
            </div>
          )}
          {!loading && error && (
            <div style={{ padding: 24, background: '#141320', border: '1px solid #1e1d2e', borderRadius: 14, color: '#f87171', fontSize: 13 }}>
              Erro ao buscar produtos: {error}
            </div>
          )}
          {!loading && !error && (
            <div style={{ background: '#141320', border: '1px solid #1e1d2e', borderRadius: 14, overflow: 'hidden' }}>
              {products.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', fontSize: 13, color: '#475569' }}>Nenhum pedido pago encontrado no período.</div>
              ) : (
                <>
                  <div style={{ padding: '10px 16px', borderBottom: '1px solid #1e1d2e', fontSize: 11, color: '#475569' }}>
                    {orderCount} pedidos · {products.length} variantes
                  </div>
                  <div style={{ overflowX: 'auto' as any }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                      <thead>
                        <tr style={{ background: '#0f0e17' }}>
                          {['#','Produto','Variante','Qtd','Receita','Ticket Médio','% do total'].map(h => (
                            <th key={h} style={{ fontSize: 11, color: '#475569', fontWeight: 600, textAlign: 'left', padding: '10px 14px', borderBottom: '1px solid #1e1d2e', whiteSpace: 'nowrap' as any }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((p, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #1a1929' }}>
                            <td style={{ padding: '11px 14px', fontSize: 12, fontWeight: 700, color: '#6366f1', minWidth: 28 }}>#{i + 1}</td>
                            <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: '#e2e8f0', maxWidth: 220 }}>
                              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as any }}>{p.product_title}</div>
                            </td>
                            <td style={{ padding: '11px 14px', fontSize: 12, color: '#94a3b8', maxWidth: 140 }}>
                              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as any }}>{p.variant_title || '—'}</div>
                            </td>
                            <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: '#a5b4fc', whiteSpace: 'nowrap' as any }}>{num(p.qty)} un.</td>
                            <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 700, color: '#34d399', whiteSpace: 'nowrap' as any }}>{brl(p.revenue)}</td>
                            <td style={{ padding: '11px 14px', fontSize: 13, color: '#fbbf24', whiteSpace: 'nowrap' as any }}>{brl(p.ticket_medio)}</td>
                            <td style={{ padding: '11px 14px', minWidth: 130 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ flex: 1, height: 4, background: '#1e1d2e', borderRadius: 2, overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${Math.min(p.pct, 100)}%`, background: 'linear-gradient(90deg,#4338ca,#7c3aed)', borderRadius: 2 }} />
                                </div>
                                <span style={{ fontSize: 11, color: '#64748b', minWidth: 34, textAlign: 'right' as any }}>{p.pct.toFixed(1)}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Catálogo ── */}
      {activeTab === 'catalogo' && (
        <>
          {catalogLoading && (
            <div style={{ padding: '48px 20px', textAlign: 'center' }}>
              <div style={{ maxWidth: 360, margin: '0 auto' }}>
                <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 14 }}>Buscando catálogo da loja...</div>
                <div style={{ height: 5, background: '#1e1d2e', borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 0, height: '100%', background: 'linear-gradient(90deg,#4338ca,#7c3aed)', borderRadius: 3, animation: 'ld-slide2 1.6s ease-in-out infinite' }} />
                </div>
              </div>
            </div>
          )}
          {!catalogLoading && catalogError && (
            <div style={{ padding: 24, background: '#141320', border: '1px solid #1e1d2e', borderRadius: 14, color: '#f87171', fontSize: 13 }}>
              Erro ao buscar catálogo: {catalogError}
            </div>
          )}
          {!catalogLoading && !catalogError && catalogLoaded && (() => {
            const materialWords = new Set(['escultura', 'em', 'de', 'da', 'do', 'madeira', 'resina', 'pelúcia', 'pelucia'])
            const isEscultura = (p: any) =>
              p.title.toLowerCase().includes('escultura') || p.product_type.toLowerCase().includes('escultura')
            const esculturas = filteredCatalog.filter(isEscultura)
            const drop = filteredCatalog.filter((p: any) => !isEscultura(p))
            const skusEscultura = esculturas.reduce((s: number, p: any) => s + p.variants.length, 0)
            const skusDrop = drop.reduce((s: number, p: any) => s + p.variants.length, 0)
            const racas = new Set(
              esculturas.map((p: any) =>
                p.title.split(/\s+/).filter((w: string) => !materialWords.has(w.toLowerCase())).join(' ').trim()
              ).filter(Boolean)
            )

            const renderProductList = (products: any[]) => products.map((p: any, i: number) => {
              const isOpen = expanded.has(p.id)
              return (
                <div key={p.id} style={{ borderBottom: i < products.length - 1 ? '1px solid #1a1929' : 'none' }}>
                  <button
                    onClick={() => toggleExpand(p.id)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: isOpen ? 'rgba(99,102,241,0.06)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' as any }}
                  >
                    <span style={{ fontSize: 11, color: isOpen ? '#6366f1' : '#475569', transition: 'transform 0.15s', display: 'inline-block', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', flexShrink: 0 }}>▶</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as any }}>{p.title}</div>
                      {p.product_type && <div style={{ fontSize: 11, color: '#475569', marginTop: 1 }}>{p.product_type}</div>}
                    </div>
                    <span style={{ fontSize: 11, color: '#64748b', flexShrink: 0, background: '#1e1d2e', padding: '2px 8px', borderRadius: 10 }}>
                      {p.variants.length} {p.variants.length === 1 ? 'variante' : 'variantes'}
                    </span>
                  </button>
                  {isOpen && (
                    <div style={{ background: '#0f0e17', borderTop: '1px solid #1e1d2e' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '7px 16px 7px 44px', borderBottom: '1px solid #1e1d2e' }}>
                        {['Variante', 'SKU', 'Preço'].map(h => (
                          <span key={h} style={{ fontSize: 10, fontWeight: 600, color: '#475569', textTransform: 'uppercase' as any, letterSpacing: '0.4px' }}>{h}</span>
                        ))}
                      </div>
                      {p.variants.map((v: any, vi: number) => (
                        <div key={v.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '9px 16px 9px 44px', borderBottom: vi < p.variants.length - 1 ? '1px solid #1a1929' : 'none', alignItems: 'center' }}>
                          <span style={{ fontSize: 12, color: v.title ? '#c4b5fd' : '#475569', fontStyle: v.title ? 'normal' : 'italic' }}>
                            {v.title || 'Padrão'}
                          </span>
                          <span style={{ fontSize: 11, color: v.sku ? '#94a3b8' : '#334155', fontFamily: 'monospace' }}>
                            {v.sku || '—'}
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#34d399' }}>
                            {brl(v.price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })

            return (
              <>
                {/* Summary cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10, marginBottom: 16 }}>
                  {[
                    { label: 'Raças', val: num(racas.size), color: '#f59e0b' },
                    { label: 'SKUs de escultura', val: num(skusEscultura), color: '#6366f1' },
                    { label: 'Produtos drop', val: num(drop.length), color: '#10b981' },
                    { label: 'SKUs drop', val: num(skusDrop), color: '#a78bfa' },
                  ].map((k, i) => (
                    <div key={i} style={{ background: '#141320', border: '1px solid #1e1d2e', borderRadius: 14, padding: '14px 16px', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${k.color},transparent)` }} />
                      <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' as any, letterSpacing: '0.4px', marginBottom: 6 }}>{k.label}</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9' }}>{k.val}</div>
                    </div>
                  ))}
                </div>

                {/* Search */}
                <div style={{ marginBottom: 16 }}>
                  <input
                    type="text"
                    placeholder="Buscar por produto, variante ou SKU..."
                    value={catalogSearch}
                    onChange={e => setCatalogSearch(e.target.value)}
                    style={{ width: '100%', padding: '9px 14px', background: '#141320', border: '1px solid #2d2d3d', borderRadius: 10, color: '#e2e8f0', fontSize: 13, boxSizing: 'border-box' as any }}
                  />
                </div>

                {/* Esculturas section */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>Esculturas</span>
                    <span style={{ fontSize: 11, color: '#64748b', background: '#1e1d2e', padding: '2px 8px', borderRadius: 10 }}>{esculturas.length} produto{esculturas.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div style={{ background: '#141320', border: '1px solid #1e1d2e', borderRadius: 14, overflow: 'hidden' }}>
                    {esculturas.length === 0 ? (
                      <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: '#475569' }}>Nenhuma escultura encontrada.</div>
                    ) : renderProductList(esculturas)}
                  </div>
                </div>

                {/* Produtos Drop section */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>Produtos Drop</span>
                    <span style={{ fontSize: 11, color: '#64748b', background: '#1e1d2e', padding: '2px 8px', borderRadius: 10 }}>{drop.length} produto{drop.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div style={{ background: '#141320', border: '1px solid #1e1d2e', borderRadius: 14, overflow: 'hidden' }}>
                    {drop.length === 0 ? (
                      <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: '#475569' }}>Nenhum produto drop encontrado.</div>
                    ) : renderProductList(drop)}
                  </div>
                </div>
              </>
            )
          })()}
        </>
      )}
    </div>
  )
}

export default function App() {
  const [page, setPage] = useState<Page>('dashboard')
  const [menuOpen, setMenuOpen] = useState(false)
  const [taxas, setTaxas] = useState<any>({})
  const [user, setUser] = useState<string | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [toast, setToast] = useState('')

  useLayoutEffect(() => {
    setUser(localStorage.getItem('holydash_user'))
    setAuthReady(true)
    const shell = document.getElementById('hd-shell')
    if (shell) shell.remove()
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.has('ml_connected') || params.has('ml_error') || params.has('meta_connected') || params.has('meta_error')) {
      if (params.get('ml_connected') === 'true') { setPage('integracoes'); setToast('Mercado Livre conectado!') }
      if (params.get('ml_error') === 'true') setToast('Erro ao conectar Mercado Livre')
      if (params.get('meta_connected') === 'true') { setPage('integracoes'); setToast('Meta Ads conectado!') }
      if (params.get('meta_error') === 'true') setToast('Erro ao conectar Meta Ads')
      window.history.replaceState({}, '', '/')
    }
  }, [])

  const refreshTaxas = () => fetch('/api/taxas').then(r => r.json()).then(setTaxas)

  useEffect(() => {
    if (user) refreshTaxas()
  }, [user])

  if (!authReady) return <div style={{ minHeight: '100vh', background: '#0a0918' }} />
  if (!user) return <LoginPage onLogin={setUser} />

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0918' }}>
      {toast && <Toast msg={toast} onHide={() => setToast('')} />}
      {menuOpen && <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40 }} />}
      <aside style={{ width: 220, minHeight: '100vh', background: '#0f0e17', borderRight: '1px solid #1e1d2e', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, zIndex: 50, transform: menuOpen ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 0.25s ease' }}>
        <div style={{ padding: '18px 16px', borderBottom: '1px solid #1e1d2e', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#4338ca,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13 }}>H</div>
            <span style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 15 }}>Holy Dash</span>
          </div>
          <button onClick={() => setMenuOpen(false)} style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: 18, cursor: 'pointer', padding: 4 }}>✕</button>
        </div>
        <nav style={{ flex: 1, padding: '10px 0' }}>
          {NAV_ITEMS.map(n => (
            <button key={n.id} onClick={() => { setPage(n.id); setMenuOpen(false) }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 16px', background: page === n.id ? 'rgba(99,102,241,0.15)' : 'transparent', border: 'none', borderLeft: page === n.id ? '3px solid #6366f1' : '3px solid transparent', color: page === n.id ? '#a5b4fc' : '#64748b', fontSize: 13, fontWeight: page === n.id ? 600 : 400, cursor: 'pointer', textAlign: 'left' as any }}>
              <span style={{ fontSize: 14, minWidth: 16, textAlign: 'center' as any }}>{n.icon}</span>{n.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: '14px 16px', borderTop: '1px solid #1e1d2e' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#4338ca,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: 700 }}>{user[0].toUpperCase()}</div>
            <div><div style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 600 }}>{user}</div><div style={{ color: '#64748b', fontSize: 11 }}>Pelos Pets</div></div>
          </div>
          <button onClick={() => { localStorage.removeItem('holydash_user'); setUser(null) }} style={{ width: '100%', padding: 6, borderRadius: 8, background: 'transparent', border: '1px solid #2d2d3d', color: '#f87171', fontSize: 11, cursor: 'pointer' }}>Sair</button>
        </div>
      </aside>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{ position: 'sticky', top: 0, zIndex: 30, background: '#0f0e17', borderBottom: '1px solid #1e1d2e', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setMenuOpen(true)} style={{ background: 'transparent', border: 'none', color: '#a5b4fc', fontSize: 22, cursor: 'pointer', padding: 4, lineHeight: 1 }}>☰</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: 'linear-gradient(135deg,#4338ca,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12 }}>H</div>
            <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 14 }}>Holy Dash</span>
          </div>
          <span style={{ fontSize: 13, color: '#64748b', marginLeft: 'auto' }}>{PAGE_LABELS[page]}</span>
        </header>
        <main style={{ flex: 1, overflowY: 'auto', padding: '18px 16px 60px' }}>
          {page === 'dashboard' && <DashPage taxas={taxas} />}
          {page === 'produtos' && <ProdutosPage />}
          {page === 'taxas' && <TaxasPage taxas={taxas} onSave={setTaxas} onToast={setToast} />}
          {page === 'lancamentos' && <LancamentosPage onToast={setToast} />}
          {page === 'integracoes' && <IntegracoesPage onToast={setToast} />}
          {page === 'configuracoes' && <ConfiguracoesPage taxas={taxas} onSave={setTaxas} onToast={setToast} />}
        </main>
      </div>
    </div>
  )
}
