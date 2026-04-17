'use client'
import { useState, useEffect } from 'react'

const fmt = (v: number, t = 'brl') => {
  if (t === 'brl') return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
  if (t === 'pct') return `${Number(v).toFixed(2)}%`
  if (t === 'num') return new Intl.NumberFormat('pt-BR').format(v)
  if (t === 'x') return `${Number(v).toFixed(2)}x`
  return String(v)
}

const PAGES = ['dashboard','produtos','taxas','meta-ads','lancamentos'] as const
type Page = typeof PAGES[number]
const LABELS: Record<Page,string> = { dashboard:'Dashboard', produtos:'Produtos', taxas:'Taxas & Tarifas', 'meta-ads':'Meta Ads', lancamentos:'Lançamentos' }
const ICONS: Record<Page,string> = { dashboard:'▣', produtos:'◈', taxas:'%', 'meta-ads':'⬡', lancamentos:'⊕' }

const PRODS = [
  { id: 1, name: 'Creme Anti-Age Premium', sku: 'CAP-001', cost: 28.5, price: 197, sales: 142, revenue: 27974, profit: 9840, cpa: 18.5, img: '🧴' },
  { id: 2, name: 'Suplemento Colágeno 60 caps', sku: 'SUP-002', cost: 19.9, price: 149, sales: 89, revenue: 13261, profit: 5230, cpa: 22.1, img: '💊' },
  { id: 3, name: 'Kit Emagrecimento 30 dias', sku: 'KIT-003', cost: 45.0, price: 297, sales: 67, revenue: 19899, profit: 8120, cpa: 31.4, img: '📦' },
  { id: 4, name: 'Sérum Vitamina C', sku: 'SER-004', cost: 22.0, price: 127, sales: 203, revenue: 25781, profit: 11230, cpa: 14.2, img: '✨' },
]

const card = (label: string, value: string, color: string, sub?: string) => (
  <div style={{ background:'#141320', border:'1px solid #1e1d2e', borderRadius:14, padding:'16px 18px', position:'relative', overflow:'hidden' }}>
    <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${color},transparent)` }}/>
    <div style={{ fontSize:11, color:'#64748b', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:6 }}>{label}</div>
    <div style={{ fontSize:22, fontWeight:700, color:'#f1f5f9', letterSpacing:'-0.5px' }}>{value}</div>
    {sub && <div style={{ fontSize:12, color:'#64748b', marginTop:3 }}>{sub}</div>}
  </div>
)

function MiniRows({ title, rows, color='#6366f1' }: { title:string, rows:{label:string,value:string,hi?:boolean}[], color?:string }) {
  return (
    <div style={{ background:'#141320', border:'1px solid #1e1d2e', borderRadius:14, padding:'16px 18px' }}>
      <div style={{ fontSize:11, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:12 }}>{title}</div>
      {rows.map((r,i) => (
        <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:i<rows.length-1?'1px solid #1a1929':'none' }}>
          <span style={{ fontSize:12, color:'#94a3b8' }}>{r.label}</span>
          <span style={{ fontSize:12, fontWeight:600, color:r.hi?color:'#e2e8f0' }}>{r.value}</span>
        </div>
      ))}
    </div>
  )
}

function LucroComposicao({ fat, taxas, pedidos }: { fat:number, taxas:any, pedidos:number }) {
  const diasMes = new Date(new Date().getFullYear(), new Date().getMonth()+1, 0).getDate()
  const checkoutFixoDiario = (taxas.checkout_fixo_mensal || 0) / diasMes
  const tCheckout = fat * (taxas.checkout_pct || 0) / 100 + checkoutFixoDiario
  const tGateway = fat * (taxas.gateway_pct || 0) / 100
  const tImposto = fat * (taxas.imposto_pct || 0) / 100
  const tCustoProd = pedidos * (taxas.custo_produto || 0)
  const tFrete = pedidos * (taxas.frete_fixo || 0)
  const metaAds = taxas.meta_ads_hoje || 0
  const googleAds = taxas.google_ads_hoje || 0
  const tImpostoMeta = metaAds * (taxas.imposto_meta_pct || 0) / 100
  const totalCustos = tCheckout + tGateway + tImposto + tCustoProd + tFrete + metaAds + googleAds + tImpostoMeta
  const lucro = fat - totalCustos
  const margem = fat > 0 ? (lucro / fat) * 100 : 0

  const row = (label: string, value: number, positive = false) => (
    <div style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid #1a1929' }}>
      <span style={{ fontSize:12, color:'#94a3b8' }}>{label}</span>
      <span style={{ fontSize:12, fontWeight:600, color: positive ? '#34d399' : '#f87171' }}>
        {positive ? '+' : '-'} {fmt(Math.abs(value))}
      </span>
    </div>
  )

  return (
    <div style={{ background:'#141320', border:'1px solid #1e1d2e', borderRadius:14, padding:'16px 18px' }}>
      <div style={{ fontSize:11, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:12 }}>Composição do lucro</div>
      {row('Faturamento pago', fat, true)}
      {row(`Taxa checkout (${taxas.checkout_pct||0}% + fixo diário)`, tCheckout)}
      {row(`Taxa gateway (${taxas.gateway_pct||0}%)`, tGateway)}
      {row(`Impostos (${taxas.imposto_pct||0}%)`, tImposto)}
      {row(`Custo produto (${pedidos}x R$${taxas.custo_produto||0})`, tCustoProd)}
      {row(`Frete (${pedidos}x R$${taxas.frete_fixo||0})`, tFrete)}
      {row('Meta Ads', metaAds)}
      {row(`Imposto Meta (${taxas.imposto_meta_pct||0}%)`, tImpostoMeta)}
      {row('Google Ads', googleAds)}
      <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', marginTop:4, borderTop:'1px solid #2d2d3d' }}>
        <span style={{ fontSize:13, fontWeight:700, color:'#f1f5f9' }}>Lucro líquido</span>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:14, fontWeight:700, color: lucro > 0 ? '#34d399' : '#f87171' }}>{fmt(lucro)}</div>
          <div style={{ fontSize:11, color:'#64748b' }}>Margem: {margem.toFixed(1)}%</div>
        </div>
      </div>
    </div>
  )
}

function HourBar({ hourly }: { hourly: number[] }) {
  const max = Math.max(...hourly, 1)
  const now = new Date().getHours()
  return (
    <div style={{ background:'#141320', border:'1px solid #1e1d2e', borderRadius:14, padding:18 }}>
      <div style={{ fontSize:11, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:12 }}>Vendas por hora</div>
      <div style={{ display:'flex', alignItems:'flex-end', gap:2, height:80 }}>
        {hourly.map((v,i) => (
          <div key={i} title={`${i}h: ${fmt(v)}`} style={{ flex:1, height:`${Math.max((v/max)*100,3)}%`, background:i===now?'#6366f1':`rgba(99,102,241,${0.15+(v/max)*0.5})`, borderRadius:'2px 2px 0 0' }}/>
        ))}
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
        <span style={{ fontSize:10, color:'#475569' }}>00h</span>
        <span style={{ fontSize:10, color:'#475569' }}>12h</span>
        <span style={{ fontSize:10, color:'#475569' }}>23h</span>
      </div>
    </div>
  )
}

function MetaMes({ atual, meta }: { atual:number, meta:number }) {
  const pct = Math.min((atual/meta)*100, 100)
  const proj = (atual/new Date().getDate()) * new Date(new Date().getFullYear(), new Date().getMonth()+1, 0).getDate()
  return (
    <div style={{ background:'#141320', border:'1px solid #1e1d2e', borderRadius:14, padding:18 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
        <span style={{ fontSize:11, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.5px' }}>Meta do mês</span>
        <span style={{ fontSize:12, color:'#a5b4fc', fontWeight:600 }}>{pct.toFixed(1)}%</span>
      </div>
      <div style={{ fontSize:20, fontWeight:700, color:'#f1f5f9' }}>{fmt(atual)}</div>
      <div style={{ fontSize:12, color:'#64748b', marginBottom:10 }}>de {fmt(meta)}</div>
      <div style={{ height:6, background:'#1e1d2e', borderRadius:3, overflow:'hidden', marginBottom:10 }}>
        <div style={{ height:'100%', width:`${pct}%`, background:'linear-gradient(90deg,#4338ca,#7c3aed)', borderRadius:3 }}/>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between' }}>
        <div><div style={{ fontSize:11, color:'#64748b' }}>Projeção</div><div style={{ fontSize:13, fontWeight:600, color:proj>=meta?'#34d399':'#fbbf24' }}>{fmt(proj)}</div></div>
        <div style={{ textAlign:'right' }}><div style={{ fontSize:11, color:'#64748b' }}>Faltam</div><div style={{ fontSize:13, fontWeight:600, color:'#94a3b8' }}>{fmt(meta-atual)}</div></div>
      </div>
    </div>
  )
}

function Ranking() {
  const [sort, setSort] = useState('revenue')
  const sorted = [...PRODS].sort((a,b) => {
    if (sort==='profit') return b.profit-a.profit
    if (sort==='sales') return b.sales-a.sales
    if (sort==='margin') return (b.profit/b.revenue)-(a.profit/a.revenue)
    if (sort==='cpa') return a.cpa-b.cpa
    return b.revenue-a.revenue
  })
  return (
    <div style={{ background:'#141320', border:'1px solid #1e1d2e', borderRadius:14, padding:18 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, flexWrap:'wrap', gap:8 }}>
        <span style={{ fontSize:11, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.5px' }}>Ranking de produtos</span>
        <div style={{ display:'flex', gap:4 }}>
          {[['revenue','Fat.'],['profit','Lucro'],['sales','Qtd'],['margin','Margem'],['cpa','CPA']].map(([v,l]) => (
            <button key={v} onClick={() => setSort(v)} style={{ padding:'3px 9px', borderRadius:6, fontSize:11, border:sort===v?'1px solid #6366f1':'1px solid #2d2d3d', background:sort===v?'rgba(99,102,241,0.2)':'transparent', color:sort===v?'#a5b4fc':'#64748b' }}>{l}</button>
          ))}
        </div>
      </div>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', minWidth:560 }}>
          <thead>
            <tr style={{ borderBottom:'1px solid #1e1d2e' }}>
              {['#','Produto','Vendas','Faturamento','Lucro','Margem','CPA'].map(h => (
                <th key={h} style={{ fontSize:11, color:'#475569', fontWeight:600, textAlign:'left', padding:'0 10px 8px 0' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((p,i) => {
              const m = ((p.profit/p.revenue)*100).toFixed(1)
              return (
                <tr key={p.id} style={{ borderBottom:'1px solid #1a1929' }}>
                  <td style={{ padding:'10px 10px 10px 0' }}>
                    <div style={{ width:20, height:20, borderRadius:4, background:i===0?'rgba(251,191,36,0.15)':'rgba(99,102,241,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:i===0?'#fbbf24':'#6366f1' }}>{i+1}</div>
                  </td>
                  <td style={{ padding:'10px 14px 10px 0' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:16 }}>{p.img}</span>
                      <div>
                        <div style={{ fontSize:12, fontWeight:600, color:'#e2e8f0' }}>{p.name}</div>
                        <div style={{ fontSize:10, color:'#475569', fontFamily:'monospace' }}>{p.sku}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:'10px 14px 10px 0', fontSize:12, color:'#94a3b8' }}>{p.sales}</td>
                  <td style={{ padding:'10px 14px 10px 0', fontSize:12, fontWeight:600, color:'#e2e8f0' }}>{fmt(p.revenue)}</td>
                  <td style={{ padding:'10px 14px 10px 0', fontSize:12, fontWeight:700, color:'#34d399' }}>{fmt(p.profit)}</td>
                  <td style={{ padding:'10px 14px 10px 0' }}>
                    <span style={{ fontSize:11, fontWeight:600, padding:'2px 7px', borderRadius:5, background:parseFloat(m)>25?'rgba(52,211,153,0.15)':'rgba(251,191,36,0.15)', color:parseFloat(m)>25?'#34d399':'#fbbf24' }}>{m}%</span>
                  </td>
                  <td style={{ padding:'10px 0', fontSize:12, color:'#94a3b8' }}>{fmt(p.cpa)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function LoginPage({ onLogin }: { onLogin: (nome: string) => void }) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    setErro('')
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha }),
    })
    const data = await res.json()
    if (data.success) {
      localStorage.setItem('lucrodash_user', data.nome)
      onLogin(data.nome)
    } else {
      setErro('Email ou senha incorretos')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight:'100vh', background:'#0a0918', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ width:'100%', maxWidth:380 }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ width:52, height:52, borderRadius:14, background:'linear-gradient(135deg,#4338ca,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:22, margin:'0 auto 16px' }}>L</div>
          <h1 style={{ fontSize:22, fontWeight:700, color:'#f1f5f9', margin:0 }}>LucroDash</h1>
          <p style={{ fontSize:13, color:'#64748b', marginTop:6 }}>Pelos Pets · Controle de lucro</p>
        </div>
        <div style={{ background:'#141320', border:'1px solid #1e1d2e', borderRadius:16, padding:28 }}>
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div>
              <label style={{ fontSize:12, color:'#64748b', display:'block', marginBottom:6 }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                style={{ width:'100%', padding:'10px 14px', background:'#0f0e17', border:'1px solid #2d2d3d', borderRadius:10, color:'#f1f5f9', fontSize:14, boxSizing:'border-box' }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <div>
              <label style={{ fontSize:12, color:'#64748b', display:'block', marginBottom:6 }}>Senha</label>
              <input
                type="password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="••••••••"
                style={{ width:'100%', padding:'10px 14px', background:'#0f0e17', border:'1px solid #2d2d3d', borderRadius:10, color:'#f1f5f9', fontSize:14, boxSizing:'border-box' }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>
            {erro && <div style={{ fontSize:12, color:'#f87171', textAlign:'center' }}>{erro}</div>}
            <button
              onClick={handleLogin}
              disabled={loading}
              style={{ padding:'12px', borderRadius:10, background:'linear-gradient(135deg,#4338ca,#7c3aed)', border:'none', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? '⏳ Entrando...' : 'Entrar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function DashPage({ taxas }: { taxas: any }) {
  const [filter, setFilter] = useState('today')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    fetch(`/api/shopify/orders?filter=${filter}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [filter])

  const d = data || {}
  const hourly = d.hourly || Array(24).fill(0)
  const states = d.states || []
  const diasMes = new Date(new Date().getFullYear(), new Date().getMonth()+1, 0).getDate()
  const checkoutFixoDiario = (taxas.checkout_fixo_mensal || 0) / diasMes
  const fat = d.faturamentoPago || 0
  const pedidos = d.pedidosPagos || 0
  const tCheckout = fat * (taxas.checkout_pct || 0) / 100 + checkoutFixoDiario
  const tGateway = fat * (taxas.gateway_pct || 0) / 100
  const tImposto = fat * (taxas.imposto_pct || 0) / 100
  const tCustoProd = pedidos * (taxas.custo_produto || 0)
  const tFrete = pedidos * (taxas.frete_fixo || 0)
  const metaAds = taxas.meta_ads_hoje || 0
  const googleAds = taxas.google_ads_hoje || 0
  const tImpostoMeta = metaAds * (taxas.imposto_meta_pct || 0) / 100
  const totalCustos = tCheckout + tGateway + tImposto + tCustoProd + tFrete + metaAds + googleAds + tImpostoMeta
  const lucroLiquido = fat - totalCustos
  const margem = fat > 0 ? (lucroLiquido / fat) * 100 : 0

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:10 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:700, color:'#f1f5f9' }}>Dashboard</h1>
          <p style={{ fontSize:12, color:'#64748b', marginTop:2 }}>Pelos Pets · Visão geral da operação</p>
        </div>
        <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
          {[['today','Hoje'],['yesterday','Ontem'],['7d','7 dias'],['30d','30 dias'],['month','Mês']].map(([v,l]) => (
            <button key={v} onClick={() => setFilter(v)} style={{ padding:'5px 12px', borderRadius:20, fontSize:12, border:filter===v?'1.5px solid #6366f1':'1px solid #2d2d3d', background:filter===v?'rgba(99,102,241,0.15)':'transparent', color:filter===v?'#a5b4fc':'#64748b' }}>{l}</button>
          ))}
        </div>
      </div>

      {loading && <div style={{ textAlign:'center', padding:60, color:'#64748b', fontSize:14 }}>⏳ Carregando dados da Shopify...</div>}
      {error && <div style={{ textAlign:'center', padding:40, color:'#f87171', fontSize:13 }}>❌ Erro: {error}</div>}

      {!loading && !error && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(155px,1fr))', gap:10, marginBottom:12 }}>
            {card('Faturamento pago', fmt(fat), '#6366f1', `Bruto: ${fmt(d.faturamentoBruto||0)}`)}
            {card('Lucro líquido', fmt(lucroLiquido), lucroLiquido > 0 ? '#34d399' : '#f87171', `Margem: ${margem.toFixed(1)}%`)}
            {card('Pedidos pagos', fmt(pedidos,'num'), '#a78bfa', `de ${fmt(d.pedidosGerados||0,'num')} gerados`)}
            {card('Ticket médio', fmt(d.ticketMedio||0), '#fbbf24')}
            {card('Total custos', fmt(totalCustos), '#f87171')}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:10, marginBottom:12 }}>
            <LucroComposicao fat={fat} taxas={taxas} pedidos={pedidos} />
            <MiniRows title="Pedidos" color="#a5b4fc" rows={[
              { label:'Gerados', value:fmt(d.pedidosGerados||0,'num') },
              { label:'Pendentes', value:fmt(d.pedidosPendentes||0,'num') },
              { label:'Cartão aprovado', value:fmt(d.cartaoAprovado||0,'num'), hi:true },
              { label:'Cartão pendente', value:fmt(d.cartaoPendente||0,'num') },
              { label:'Boleto pago', value:fmt(d.boletoPago||0,'num'), hi:true },
              { label:'Boleto pendente', value:fmt(d.boletoPendente||0,'num') },
              { label:'PIX pago', value:fmt(d.pixPago||0,'num'), hi:true },
              { label:'PIX pendente', value:fmt(d.pixPendente||0,'num') },
            ]}/>
            <MiniRows title="Pedidos por método" color="#fbbf24" rows={[
              { label:'Cartão aprovado', value:fmt(d.cartaoAprovado||0,'num'), hi:true },
              { label:'Boleto pago', value:fmt(d.boletoPago||0,'num'), hi:true },
              { label:'PIX pago', value:fmt(d.pixPago||0,'num'), hi:true },
              { label:'Cartão pendente', value:fmt(d.cartaoPendente||0,'num') },
              { label:'Boleto pendente', value:fmt(d.boletoPendente||0,'num') },
              { label:'PIX pendente', value:fmt(d.pixPendente||0,'num') },
            ]}/>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:10, marginBottom:12 }}>
            <HourBar hourly={hourly}/>
            <MetaMes atual={fat} meta={250000}/>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:10 }}>
            <div style={{ background:'#141320', border:'1px solid #1e1d2e', borderRadius:14, padding:18 }}>
              <div style={{ fontSize:11, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:12 }}>Vendas por estado</div>
              {states.length === 0 && <div style={{ fontSize:12, color:'#475569' }}>Sem dados</div>}
              {states.map((s: any, i: number) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:i<states.length-1?'1px solid #1a1929':'none' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:'#a5b4fc', minWidth:28 }}>{s.state}</span>
                    <div style={{ height:3, width:`${s.pct*1.6}px`, background:'linear-gradient(90deg,#4338ca,#7c3aed)', borderRadius:2 }}/>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:12, fontWeight:600, color:'#e2e8f0' }}>{fmt(s.revenue)}</div>
                    <div style={{ fontSize:10, color:'#64748b' }}>{s.orders} pedidos</div>
                  </div>
                </div>
              ))}
            </div>
            <Ranking/>
          </div>
        </>
      )}
    </div>
  )
}

function TaxasPage({ taxas, onSave }: { taxas: any, onSave: (t: any) => void }) {
  const [t, setT] = useState({
    checkout_pct: taxas.checkout_pct ?? 0.5,
    checkout_fixo_mensal: taxas.checkout_fixo_mensal ?? 1500,
    gateway_pct: taxas.gateway_pct ?? 5,
    imposto_pct: taxas.imposto_pct ?? 16,
    imposto_meta_pct: taxas.imposto_meta_pct ?? 13.65,
    frete_fixo: taxas.frete_fixo ?? 15,
    custo_produto: taxas.custo_produto ?? 8,
    meta_ads_hoje: taxas.meta_ads_hoje ?? 0,
    google_ads_hoje: taxas.google_ads_hoje ?? 0,
  })
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await fetch('/api/taxas', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(t) })
    onSave(t)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const f = (label: string, k: keyof typeof t, suf='%', hint='') => (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      <label style={{ fontSize:11, color:'#64748b', fontWeight:500 }}>{label}</label>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <input type="number" step="0.01" value={t[k]} onChange={e => setT(p => ({...p,[k]:parseFloat(e.target.value)||0}))} style={{ width:100 }}/>
        <span style={{ fontSize:12, color:'#64748b' }}>{suf}</span>
      </div>
      {hint && <span style={{ fontSize:10, color:'#475569' }}>{hint}</span>}
    </div>
  )

  return (
    <div>
      <h1 style={{ fontSize:20, fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>Taxas & Tarifas</h1>
      <p style={{ fontSize:12, color:'#64748b', marginBottom:16 }}>Configure tudo que impacta seu lucro</p>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))', gap:14 }}>
        <div style={{ background:'#141320', border:'1px solid #1e1d2e', borderRadius:14, padding:20 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#a5b4fc', marginBottom:16, paddingBottom:10, borderBottom:'1px solid #1e1d2e' }}>Taxas de pagamento</div>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {f('Taxa checkout %','checkout_pct','%','Percentual por venda')}
            {f('Checkout fixo mensal','checkout_fixo_mensal','R$','Mensalidade fixa')}
            {f('Taxa gateway','gateway_pct','%','Sobre valor aprovado')}
          </div>
        </div>
        <div style={{ background:'#141320', border:'1px solid #1e1d2e', borderRadius:14, padding:20 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#fbbf24', marginBottom:16, paddingBottom:10, borderBottom:'1px solid #1e1d2e' }}>Custos fixos</div>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {f('Custo por produto','custo_produto','R$','Por unidade vendida')}
            {f('Frete por pedido','frete_fixo','R$','Custo médio de envio')}
          </div>
        </div>
        <div style={{ background:'#141320', border:'1px solid #1e1d2e', borderRadius:14, padding:20 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#f87171', marginBottom:16, paddingBottom:10, borderBottom:'1px solid #1e1d2e' }}>Impostos</div>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {f('Imposto s/ faturamento','imposto_pct','%','Sobre receita paga')}
            {f('Imposto s/ Meta Ads','imposto_meta_pct','%','IOF + ISS sobre ads')}
          </div>
        </div>
        <div style={{ background:'#141320', border:'1px solid #1e1d2e', borderRadius:14, padding:20 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#34d399', marginBottom:16, paddingBottom:10, borderBottom:'1px solid #1e1d2e' }}>Ads de hoje</div>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {f('Meta Ads hoje','meta_ads_hoje','R$','Gasto do dia')}
            {f('Google Ads hoje','google_ads_hoje','R$','Gasto do dia')}
          </div>
        </div>
      </div>
      <div style={{ marginTop:14, display:'flex', justifyContent:'flex-end' }}>
        <button onClick={handleSave} disabled={saving} style={{ padding:'9px 24px', borderRadius:10, fontSize:13, fontWeight:700, border:'none', background:saved?'rgba(52,211,153,0.2)':'linear-gradient(135deg,#4338ca,#7c3aed)', color:saved?'#34d399':'#fff' }}>
          {saving ? '⏳ Salvando...' : saved ? '✓ Salvo!' : 'Salvar Configurações'}
        </button>
      </div>
    </div>
  )
}

function MetaAdsPage({ taxas, onSave }: { taxas: any, onSave: (t: any) => void }) {
  const [valor, setValor] = useState(String(taxas.meta_ads_hoje || ''))
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    const updated = { ...taxas, meta_ads_hoje: parseFloat(valor) || 0 }
    await fetch('/api/taxas', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(updated) })
    onSave(updated)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <h1 style={{ fontSize:20, fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>Meta Ads</h1>
      <p style={{ fontSize:12, color:'#64748b', marginBottom:16 }}>Lançamento do gasto diário</p>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:14 }}>
        <div style={{ background:'#141320', border:'1px solid #1e1d2e', borderRadius:14, padding:22 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#a5b4fc', marginBottom:14 }}>Gasto de hoje</div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div><label style={{ fontSize:11, color:'#64748b', display:'block', marginBottom:5 }}>Data</label><input type="date" value={date} onChange={e => setDate(e.target.value)}/></div>
            <div><label style={{ fontSize:11, color:'#64748b', display:'block', marginBottom:5 }}>Gasto Meta Ads (R$)</label><input type="number" placeholder="0,00" value={valor} onChange={e => setValor(e.target.value)}/></div>
            <button onClick={handleSave} style={{ padding:'9px', borderRadius:8, background: saved?'rgba(52,211,153,0.2)':'linear-gradient(135deg,#4338ca,#7c3aed)', border:'none', color: saved?'#34d399':'#fff', fontSize:13, fontWeight:700 }}>
              {saved ? '✓ Salvo!' : 'Salvar'}
            </button>
          </div>
        </div>
        <div style={{ background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:12, padding:'14px 18px' }}>
          <div style={{ fontSize:12, fontWeight:600, color:'#a5b4fc', marginBottom:4 }}>⚡ Integração automática em breve</div>
          <p style={{ fontSize:12, color:'#64748b', lineHeight:1.6 }}>Quando sua conta Meta Developer for aprovada, os gastos serão puxados automaticamente.</p>
        </div>
      </div>
    </div>
  )
}

function LancamentosPage() {
  const [entries, setEntries] = useState([
    { id:1, date:'2026-04-15', tipo:'Google Ads', valor:380, obs:'Campanha search' },
    { id:2, date:'2026-04-14', tipo:'Despesa Fixa', valor:500, obs:'Shopify' },
  ])
  const [form, setForm] = useState({ date:new Date().toISOString().split('T')[0], tipo:'Google Ads', valor:'', obs:'' })
  const add = () => {
    if (form.valor) { setEntries(p => [{ ...form, id:Date.now(), valor:parseFloat(form.valor) }, ...p]); setForm(p => ({...p,valor:'',obs:''})) }
  }
  return (
    <div>
      <h1 style={{ fontSize:20, fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>Lançamentos Manuais</h1>
      <p style={{ fontSize:12, color:'#64748b', marginBottom:16 }}>Google Ads, despesas extras e outras entradas</p>
      <div style={{ background:'#141320', border:'1px solid #1e1d2e', borderRadius:14, padding:18, marginBottom:14 }}>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'flex-end' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            <label style={{ fontSize:11, color:'#64748b' }}>Data</label>
            <input type="date" value={form.date} onChange={e => setForm(p => ({...p,date:e.target.value}))} style={{ width:150 }}/>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            <label style={{ fontSize:11, color:'#64748b' }}>Tipo</label>
            <select value={form.tipo} onChange={e => setForm(p => ({...p,tipo:e.target.value}))} style={{ width:160 }}>
              {['Google Ads','TikTok Ads','Despesa Fixa','Despesa Variável','Outro'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            <label style={{ fontSize:11, color:'#64748b' }}>Valor (R$)</label>
            <input type="number" placeholder="0,00" value={form.valor} onChange={e => setForm(p => ({...p,valor:e.target.value}))} style={{ width:120 }}/>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:5, flex:1, minWidth:160 }}>
            <label style={{ fontSize:11, color:'#64748b' }}>Observação</label>
            <input placeholder="Opcional..." value={form.obs} onChange={e => setForm(p => ({...p,obs:e.target.value}))}/>
          </div>
          <button onClick={add} style={{ padding:'9px 20px', borderRadius:8, background:'linear-gradient(135deg,#4338ca,#7c3aed)', border:'none', color:'#fff', fontSize:13, fontWeight:700 }}>Adicionar</button>
        </div>
      </div>
      <div style={{ background:'#141320', border:'1px solid #1e1d2e', borderRadius:14, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'#0f0e17' }}>
              {['Data','Tipo','Valor','Observação',''].map(h => <th key={h} style={{ fontSize:11, color:'#475569', fontWeight:600, textAlign:'left', padding:'10px 14px', borderBottom:'1px solid #1e1d2e' }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {entries.map(e => (
              <tr key={e.id} style={{ borderBottom:'1px solid #1a1929' }}>
                <td style={{ padding:'11px 14px', fontSize:13, color:'#64748b' }}>{e.date}</td>
                <td style={{ padding:'11px 14px' }}><span style={{ fontSize:11, padding:'3px 8px', borderRadius:6, background:e.tipo.includes('Ads')?'rgba(251,191,36,0.12)':'rgba(99,102,241,0.12)', color:e.tipo.includes('Ads')?'#fbbf24':'#a5b4fc' }}>{e.tipo}</span></td>
                <td style={{ padding:'11px 14px', fontSize:13, fontWeight:700, color:'#f87171' }}>{fmt(e.valor)}</td>
                <td style={{ padding:'11px 14px', fontSize:13, color:'#64748b' }}>{e.obs||'—'}</td>
                <td style={{ padding:'11px 14px' }}><button onClick={() => setEntries(p => p.filter(x => x.id!==e.id))} style={{ padding:'3px 9px', borderRadius:6, background:'transparent', border:'1px solid #2d2d3d', color:'#f87171', fontSize:11 }}>✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function App() {
  const [page, setPage] = useState<Page>('dashboard')
  const [menuOpen, setMenuOpen] = useState(false)
  const [taxas, setTaxas] = useState<any>({})
  const [user, setUser] = useState<string | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('lucrodash_user')
    if (saved) setUser(saved)
    setCheckingAuth(false)
  }, [])

  useEffect(() => {
    if (user) fetch('/api/taxas').then(r => r.json()).then(setTaxas)
  }, [user])

  const handleLogout = () => {
    localStorage.removeItem('lucrodash_user')
    setUser(null)
  }

  if (checkingAuth) return <div style={{ minHeight:'100vh', background:'#0a0918' }}/>
  if (!user) return <LoginPage onLogin={setUser}/>

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#0a0918' }}>
      {menuOpen && (
        <div onClick={() => setMenuOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:40 }}/>
      )}
      <aside style={{ width:210, minHeight:'100vh', background:'#0f0e17', borderRight:'1px solid #1e1d2e', display:'flex', flexDirection:'column', flexShrink:0, position:'fixed', top:0, left:0, zIndex:50, transform:menuOpen?'translateX(0)':'translateX(-100%)', transition:'transform 0.25s ease' }}>
        <div style={{ padding:'18px 16px', borderBottom:'1px solid #1e1d2e', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:28, height:28, borderRadius:8, background:'linear-gradient(135deg,#4338ca,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:14 }}>L</div>
            <span style={{ color:'#e2e8f0', fontWeight:700, fontSize:15 }}>LucroDash</span>
          </div>
          <button onClick={() => setMenuOpen(false)} style={{ background:'transparent', border:'none', color:'#64748b', fontSize:18, cursor:'pointer', padding:4 }}>✕</button>
        </div>
        <nav style={{ flex:1, padding:'10px 0' }}>
          {PAGES.map(p => (
            <button key={p} onClick={() => { setPage(p); setMenuOpen(false) }} style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'9px 16px', background:page===p?'rgba(99,102,241,0.15)':'transparent', border:'none', borderLeft:page===p?'3px solid #6366f1':'3px solid transparent', color:page===p?'#a5b4fc':'#64748b', fontSize:13, fontWeight:page===p?600:400 }}>
              <span style={{ fontSize:14, minWidth:16 }}>{ICONS[p]}</span>
              {LABELS[p]}
            </button>
          ))}
        </nav>
        <div style={{ padding:'14px 16px', borderTop:'1px solid #1e1d2e' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
            <div style={{ width:26, height:26, borderRadius:'50%', background:'linear-gradient(135deg,#4338ca,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'#fff', fontWeight:700 }}>{user[0].toUpperCase()}</div>
            <div><div style={{ color:'#e2e8f0', fontSize:12, fontWeight:600 }}>{user}</div><div style={{ color:'#64748b', fontSize:11 }}>Pelos Pets</div></div>
          </div>
          <button onClick={handleLogout} style={{ width:'100%', padding:'6px', borderRadius:8, background:'transparent', border:'1px solid #2d2d3d', color:'#f87171', fontSize:11, cursor:'pointer' }}>Sair</button>
        </div>
      </aside>
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
        <header style={{ position:'sticky', top:0, zIndex:30, background:'#0f0e17', borderBottom:'1px solid #1e1d2e', padding:'12px 16px', display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={() => setMenuOpen(true)} style={{ background:'transparent', border:'none', color:'#a5b4fc', fontSize:22, cursor:'pointer', padding:4, lineHeight:1 }}>☰</button>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:24, height:24, borderRadius:6, background:'linear-gradient(135deg,#4338ca,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:12 }}>L</div>
            <span style={{ color:'#e2e8f0', fontWeight:700, fontSize:14 }}>LucroDash</span>
          </div>
          <span style={{ fontSize:13, color:'#64748b', marginLeft:'auto' }}>{LABELS[page]}</span>
        </header>
        <main style={{ flex:1, overflowY:'auto', padding:'18px 16px 48px' }}>
          {page==='dashboard' && <DashPage taxas={taxas}/>}
          {page==='produtos' && <ProdutosPage/>}
          {page==='taxas' && <TaxasPage taxas={taxas} onSave={setTaxas}/>}
          {page==='meta-ads' && <MetaAdsPage taxas={taxas} onSave={setTaxas}/>}
          {page==='lancamentos' && <LancamentosPage/>}
        </main>
      </div>
    </div>
  )
}
