'use client'
import { useState } from 'react'

const fmt = (v: number, t = 'brl') => {
  if (t === 'brl') return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
  if (t === 'pct') return `${Number(v).toFixed(2)}%`
  if (t === 'num') return new Intl.NumberFormat('pt-BR').format(v)
  if (t === 'x') return `${Number(v).toFixed(2)}x`
  return String(v)
}

const MOCK = {
  faturamentoPago: 87240, faturamentoBruto: 101654, pedidosGerados: 908, pedidosPagos: 552,
  pedidosPendentes: 287, lucro: 24830, roi: 1.82, margem: 28.46, cpa: 20.12,
  adsTotal: 13640, adsMeta: 9840, adsGoogle: 3800, custoProdutos: 22180, frete: 8940,
  gateway: 2618, checkout: 1312, impostos: 8718, cartaoAprovado: 298, cartaoPendente: 87,
  boletoPago: 142, boletoPendente: 184, pixPago: 112, pixPendente: 16,
  ticketMedio: 158.04, reembolsado: 1240, descontos: 3200, metaMes: 250000, faturadoMes: 87240,
}

const PRODS = [
  { id: 1, name: 'Creme Anti-Age Premium', sku: 'CAP-001', cost: 28.5, price: 197, sales: 142, revenue: 27974, profit: 9840, cpa: 18.5, img: '🧴' },
  { id: 2, name: 'Suplemento Colágeno 60 caps', sku: 'SUP-002', cost: 19.9, price: 149, sales: 89, revenue: 13261, profit: 5230, cpa: 22.1, img: '💊' },
  { id: 3, name: 'Kit Emagrecimento 30 dias', sku: 'KIT-003', cost: 45.0, price: 297, sales: 67, revenue: 19899, profit: 8120, cpa: 31.4, img: '📦' },
  { id: 4, name: 'Sérum Vitamina C', sku: 'SER-004', cost: 22.0, price: 127, sales: 203, revenue: 25781, profit: 11230, cpa: 14.2, img: '✨' },
]

const HOURLY = [1200,800,400,300,200,600,1800,3200,5400,7200,8900,9800,7600,8200,9100,10200,11400,10800,9600,8400,7100,5800,4200,2900]
const STATES = [
  { state: 'SP', orders: 312, revenue: 48200, pct: 34 },
  { state: 'RJ', orders: 187, revenue: 28900, pct: 20 },
  { state: 'MG', orders: 143, revenue: 22100, pct: 16 },
  { state: 'RS', orders: 98, revenue: 15200, pct: 11 },
  { state: 'PR', orders: 87, revenue: 13400, pct: 10 },
  { state: 'Outros', orders: 81, revenue: 12500, pct: 9 },
]

const PAGES = ['dashboard','produtos','taxas','meta-ads','lancamentos'] as const
type Page = typeof PAGES[number]
const LABELS: Record<Page,string> = { dashboard:'Dashboard', produtos:'Produtos', taxas:'Taxas & Tarifas', 'meta-ads':'Meta Ads', lancamentos:'Lançamentos' }
const ICONS: Record<Page,string> = { dashboard:'▣', produtos:'◈', taxas:'%', 'meta-ads':'⬡', lancamentos:'⊕' }

const card = (label: string, value: string, color: string, sub?: string, trend?: number) => (
  <div style={{ background:'#141320', border:'1px solid #1e1d2e', borderRadius:14, padding:'16px 18px', position:'relative', overflow:'hidden' }}>
    <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${color},transparent)` }}/>
    <div style={{ fontSize:11, color:'#64748b', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:6 }}>{label}</div>
    <div style={{ fontSize:22, fontWeight:700, color:'#f1f5f9', letterSpacing:'-0.5px' }}>{value}</div>
    {sub && <div style={{ fontSize:12, color:'#64748b', marginTop:3 }}>{sub}</div>}
    {trend !== undefined && <div style={{ fontSize:11, color:trend>0?'#34d399':'#f87171', fontWeight:600, marginTop:3 }}>{trend>0?'▲':'▼'} {Math.abs(trend).toFixed(1)}% vs ontem</div>}
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

function HourBar() {
  const max = Math.max(...HOURLY)
  const now = new Date().getHours()
  return (
    <div style={{ background:'#141320', border:'1px solid #1e1d2e', borderRadius:14, padding:18 }}>
      <div style={{ fontSize:11, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:12 }}>Vendas por Hora</div>
      <div style={{ display:'flex', alignItems:'flex-end', gap:2, height:80 }}>
        {HOURLY.map((v,i) => (
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
        <span style={{ fontSize:11, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.5px' }}>Meta do Mês</span>
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
        <span style={{ fontSize:11, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.5px' }}>Ranking de Produtos</span>
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

function DashPage() {
  const [filter, setFilter] = useState('today')
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:10 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:700, color:'#f1f5f9' }}>Dashboard</h1>
          <p style={{ fontSize:12, color:'#64748b', marginTop:2 }}>Pelos Pets · Visão geral da operação</p>
        </div>
        <div style={{ display:'flex', gap:5 }}>
          {[['today','Hoje'],['yesterday','Ontem'],['7d','7 dias'],['30d','30 dias'],['month','Mês']].map(([v,l]) => (
            <button key={v} onClick={() => setFilter(v)} style={{ padding:'5px 12px', borderRadius:20, fontSize:12, border:filter===v?'1.5px solid #6366f1':'1px solid #2d2d3d', background:filter===v?'rgba(99,102,241,0.15)':'transparent', color:filter===v?'#a5b4fc':'#64748b' }}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(155px,1fr))', gap:10, marginBottom:12 }}>
        {card('Faturamento Pago', fmt(MOCK.faturamentoPago), '#6366f1', `Bruto: ${fmt(MOCK.faturamentoBruto)}`, 12.4)}
        {card('Lucro', fmt(MOCK.lucro), '#34d399', `Margem: ${fmt(MOCK.margem,'pct')}`, 8.7)}
        {card('Pedidos Pagos', fmt(MOCK.pedidosPagos,'num'), '#a78bfa', `de ${fmt(MOCK.pedidosGerados,'num')} gerados`, 5.2)}
        {card('Ticket Médio', fmt(MOCK.ticketMedio), '#fbbf24', undefined, 2.1)}
        {card('ROI', fmt(MOCK.roi,'x'), '#34d399', `CPA: ${fmt(MOCK.cpa)}`, 4.3)}
        {card('Ads Total', fmt(MOCK.adsTotal), '#f87171', `Meta: ${fmt(MOCK.adsMeta)}`, -3.2)}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:12 }}>
        <MiniRows title="Pedidos" color="#a5b4fc" rows={[
          { label:'Gerados', value:fmt(MOCK.pedidosGerados,'num') },
          { label:'Pendentes', value:fmt(MOCK.pedidosPendentes,'num') },
          { label:'Cartão aprovado', value:fmt(MOCK.cartaoAprovado,'num'), hi:true },
          { label:'Cartão pendente', value:fmt(MOCK.cartaoPendente,'num') },
          { label:'Boleto pago', value:fmt(MOCK.boletoPago,'num'), hi:true },
          { label:'Boleto pendente', value:fmt(MOCK.boletoPendente,'num') },
          { label:'PIX pago', value:fmt(MOCK.pixPago,'num'), hi:true },
          { label:'PIX pendente', value:fmt(MOCK.pixPendente,'num') },
        ]}/>
        <MiniRows title="Lucro & Custos" color="#34d399" rows={[
          { label:'ROI', value:fmt(MOCK.roi,'x'), hi:true },
          { label:'Margem', value:fmt(MOCK.margem,'pct'), hi:true },
          { label:'CPA médio', value:fmt(MOCK.cpa) },
          { label:'Meta Ads', value:fmt(MOCK.adsMeta) },
          { label:'Google Ads', value:fmt(MOCK.adsGoogle) },
          { label:'Custo produtos', value:fmt(MOCK.custoProdutos) },
          { label:'Gateway', value:fmt(MOCK.gateway) },
          { label:'Impostos', value:fmt(MOCK.impostos) },
        ]}/>
        <MiniRows title="Extras" color="#fbbf24" rows={[
          { label:'Ticket médio', value:fmt(MOCK.ticketMedio), hi:true },
          { label:'Frete', value:fmt(MOCK.frete) },
          { label:'Descontos', value:fmt(MOCK.descontos) },
          { label:'Reembolsado', value:fmt(MOCK.reembolsado) },
          { label:'Fat. Pago', value:fmt(MOCK.faturamentoPago), hi:true },
        ]}/>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:10, marginBottom:12 }}>
        <HourBar/>
        <MetaMes atual={MOCK.faturadoMes} meta={MOCK.metaMes}/>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:10 }}>
        <div style={{ background:'#141320', border:'1px solid #1e1d2e', borderRadius:14, padding:18 }}>
          <div style={{ fontSize:11, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:12 }}>Vendas por Estado</div>
          {STATES.map((s,i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:i<STATES.length-1?'1px solid #1a1929':'none' }}>
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
    </div>
  )
}

function ProdutosPage() {
  const [prods, setProds] = useState(PRODS.map(p => ({ ...p, editing:false, nc:'' })))
  const [q, setQ] = useState('')
  const filtered = prods.filter(p => p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase()))
  return (
    <div>
      <h1 style={{ fontSize:20, fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>Produtos</h1>
      <p style={{ fontSize:12, color:'#64748b', marginBottom:16 }}>Gerencie custos por SKU</p>
      <div style={{ display:'flex', gap:10, marginBottom:14 }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar produto ou SKU..." style={{ flex:1, maxWidth:320 }}/>
        <button style={{ padding:'8px 18px', borderRadius:8, background:'linear-gradient(135deg,#4338ca,#7c3aed)', border:'none', color:'#fff', fontSize:13, fontWeight:600 }}>+ Novo</button>
      </div>
      <div style={{ background:'#141320', border:'1px solid #1e1d2e', borderRadius:14, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'#0f0e17' }}>
              {['Produto','SKU','Custo','Preço','Margem',''].map(h => (
                <th key={h} style={{ fontSize:11, color:'#475569', fontWeight:600, textAlign:'left', padding:'10px 14px', borderBottom:'1px solid #1e1d2e' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => {
              const m = (((p.price-p.cost)/p.price)*100).toFixed(1)
              return (
                <tr key={p.id} style={{ borderBottom:'1px solid #1a1929' }}>
                  <td style={{ padding:'12px 14px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:18 }}>{p.img}</span>
                      <span style={{ fontSize:13, fontWeight:600, color:'#e2e8f0' }}>{p.name}</span>
                    </div>
                  </td>
                  <td style={{ padding:'12px 14px', fontSize:11, color:'#6366f1', fontFamily:'monospace', fontWeight:600 }}>{p.sku}</td>
                  <td style={{ padding:'12px 14px' }}>
                    {p.editing ? (
                      <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                        <input value={p.nc} onChange={e => setProds(prev => prev.map(x => x.id===p.id ? {...x,nc:e.target.value} : x))} style={{ width:80, padding:'4px 8px' }} autoFocus/>
                        <button onClick={() => setProds(prev => prev.map(x => x.id===p.id ? {...x,cost:parseFloat(x.nc)||x.cost,editing:false} : x))} style={{ padding:'4px 8px', borderRadius:6, background:'#4338ca', border:'none', color:'#fff', fontSize:12 }}>✓</button>
                        <button onClick={() => setProds(prev => prev.map(x => x.id===p.id ? {...x,editing:false} : x))} style={{ padding:'4px 8px', borderRadius:6, background:'transparent', border:'1px solid #2d2d3d', color:'#64748b', fontSize:12 }}>✕</button>
                      </div>
                    ) : <span style={{ fontSize:13, fontWeight:700, color:'#f87171' }}>{fmt(p.cost)}</span>}
                  </td>
                  <td style={{ padding:'12px 14px', fontSize:13, fontWeight:600, color:'#34d399' }}>{fmt(p.price)}</td>
                  <td style={{ padding:'12px 14px' }}>
                    <span style={{ fontSize:11, fontWeight:600, padding:'2px 7px', borderRadius:5, background:parseFloat(m)>70?'rgba(52,211,153,0.15)':'rgba(251,191,36,0.15)', color:parseFloat(m)>70?'#34d399':'#fbbf24' }}>{m}%</span>
                  </td>
                  <td style={{ padding:'12px 14px' }}>
                    <button onClick={() => setProds(prev => prev.map(x => x.id===p.id ? {...x,editing:true,nc:String(x.cost)} : x))} style={{ padding:'4px 10px', borderRadius:6, background:'transparent', border:'1px solid #2d2d3d', color:'#a5b4fc', fontSize:11 }}>✎ Editar custo</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TaxasPage() {
  const [t, setT] = useState({ checkoutPct:1.99, cartaoPct:2.49, pixPct:0.99, boletoFixo:3.5, taxaFixa:0, taxaCartao:0, impostoPct:10, impostoMeta:10, fretePadrao:18.9 })
  const [saved, setSaved] = useState(false)
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
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
        <div style={{ background:'#141320', border:'1px solid #1e1d2e', borderRadius:14, padding:20 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#a5b4fc', marginBottom:16, paddingBottom:10, borderBottom:'1px solid #1e1d2e' }}>Taxas de Pagamento</div>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {f('Taxa Checkout','checkoutPct','%','Por venda concluída')}
            {f('Taxa Cartão','cartaoPct','%','Sobre valor aprovado')}
            {f('Taxa PIX','pixPct','%','Sobre valor recebido')}
            {f('Taxa Boleto','boletoFixo','R$','Fixo por boleto pago')}
          </div>
        </div>
        <div style={{ background:'#141320', border:'1px solid #1e1d2e', borderRadius:14, padding:20 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#fbbf24', marginBottom:16, paddingBottom:10, borderBottom:'1px solid #1e1d2e' }}>Taxas Fixas</div>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {f('Taxa fixa por pedido','taxaFixa','R$')}
            {f('Taxa fixa cartão','taxaCartao','R$')}
            {f('Frete padrão','fretePadrao','R$','Quando sem frete real')}
          </div>
        </div>
        <div style={{ background:'#141320', border:'1px solid #1e1d2e', borderRadius:14, padding:20 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#f87171', marginBottom:16, paddingBottom:10, borderBottom:'1px solid #1e1d2e' }}>Impostos</div>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {f('Imposto s/ Faturamento','impostoPct','%','Sobre receita paga')}
            {f('Imposto s/ Ads Meta','impostoMeta','%','Sobre gasto Meta Ads')}
          </div>
        </div>
      </div>
      <div style={{ marginTop:14, display:'flex', justifyContent:'flex-end' }}>
        <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000) }} style={{ padding:'9px 24px', borderRadius:10, fontSize:13, fontWeight:700, border:'none', background:saved?'rgba(52,211,153,0.2)':'linear-gradient(135deg,#4338ca,#7c3aed)', color:saved?'#34d399':'#fff' }}>
          {saved ? '✓ Salvo!' : 'Salvar Configurações'}
        </button>
      </div>
    </div>
  )
}

function MetaAdsPage() {
  const [entries, setEntries] = useState([
    { date:'2026-04-15', valor:980 },
    { date:'2026-04-14', valor:1240 },
    { date:'2026-04-13', valor:1100 },
  ])
  const [form, setForm] = useState({ date:new Date().toISOString().split('T')[0], valor:'' })
  const add = () => {
    if (form.valor) { setEntries(p => [{ date:form.date, valor:parseFloat(form.valor) }, ...p]); setForm(p => ({...p,valor:''})) }
  }
  return (
    <div>
      <h1 style={{ fontSize:20, fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>Meta Ads</h1>
      <p style={{ fontSize:12, color:'#64748b', marginBottom:16 }}>Lançamento manual do gasto diário</p>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <div style={{ background:'#141320', border:'1px solid #1e1d2e', borderRadius:14, padding:22 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#a5b4fc', marginBottom:14 }}>Lançar Gasto do Dia</div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div><label style={{ fontSize:11, color:'#64748b', display:'block', marginBottom:5 }}>Data</label><input type="date" value={form.date} onChange={e => setForm(p => ({...p,date:e.target.value}))}/></div>
            <div><label style={{ fontSize:11, color:'#64748b', display:'block', marginBottom:5 }}>Gasto (R$)</label><input type="number" placeholder="0,00" value={form.valor} onChange={e => setForm(p => ({...p,valor:e.target.value}))}/></div>
            <button onClick={add} style={{ padding:'9px', borderRadius:8, background:'linear-gradient(135deg,#4338ca,#7c3aed)', border:'none', color:'#fff', fontSize:13, fontWeight:700 }}>Adicionar</button>
          </div>
        </div>
        <div style={{ background:'#141320', border:'1px solid #1e1d2e', borderRadius:14, padding:22 }}>
          <div style={{ fontSize:11, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:14 }}>Histórico</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {entries.map((e,i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'10px 14px', background:'#0f0e17', borderRadius:8, border:'1px solid #1e1d2e' }}>
                <span style={{ fontSize:13, color:'#64748b' }}>{e.date}</span>
                <span style={{ fontSize:14, fontWeight:700, color:'#f87171' }}>{fmt(e.valor)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ marginTop:14, background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:12, padding:'14px 18px' }}>
        <div style={{ fontSize:12, fontWeight:600, color:'#a5b4fc', marginBottom:4 }}>⚡ Integração automática em breve</div>
        <p style={{ fontSize:12, color:'#64748b', lineHeight:1.6 }}>Quando sua conta Meta Developer for aprovada, os gastos serão puxados automaticamente todos os dias.</p>
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
  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#0a0918' }}>
      <aside style={{ width:210, minHeight:'100vh', background:'#0f0e17', borderRight:'1px solid #1e1d2e', display:'flex', flexDirection:'column', flexShrink:0 }}>
        <div style={{ padding:'18px 16px', borderBottom:'1px solid #1e1d2e', display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:28, height:28, borderRadius:8, background:'linear-gradient(135deg,#4338ca,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:14, flexShrink:0 }}>L</div>
          <span style={{ color:'#e2e8f0', fontWeight:700, fontSize:15 }}>LucroDash</span>
        </div>
        <nav style={{ flex:1, padding:'10px 0' }}>
          {PAGES.map(p => (
            <button key={p} onClick={() => setPage(p)} style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'9px 16px', background:page===p?'rgba(99,102,241,0.15)':'transparent', border:'none', borderLeft:page===p?'3px solid #6366f1':'3px solid transparent', color:page===p?'#a5b4fc':'#64748b', fontSize:13, fontWeight:page===p?600:400 }}>
              <span style={{ fontSize:14, minWidth:16 }}>{ICONS[p]}</span>
              {LABELS[p]}
            </button>
          ))}
        </nav>
        <div style={{ padding:'14px 16px', borderTop:'1px solid #1e1d2e', display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:26, height:26, borderRadius:'50%', background:'linear-gradient(135deg,#4338ca,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'#fff', fontWeight:700 }}>LP</div>
          <div><div style={{ color:'#e2e8f0', fontSize:12, fontWeight:600 }}>Lucas</div><div style={{ color:'#64748b', fontSize:11 }}>Pelos Pets</div></div>
        </div>
      </aside>
      <main style={{ flex:1, overflowY:'auto', padding:'22px 22px 48px' }}>
        {page==='dashboard' && <DashPage/>}
        {page==='produtos' && <ProdutosPage/>}
        {page==='taxas' && <TaxasPage/>}
        {page==='meta-ads' && <MetaAdsPage/>}
        {page==='lancamentos' && <LancamentosPage/>}
      </main>
    </div>
  )
}
