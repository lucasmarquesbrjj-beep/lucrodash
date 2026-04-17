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
