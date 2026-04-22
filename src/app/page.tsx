'use client'
import { useState, useEffect } from 'react'

type Page = 'dashboard'|'produtos'|'taxas'|'lancamentos'|'integracoes'|'configuracoes'
type Channel = 'ecom'|'ml'|'shopee'|'geral'

interface Taxas {
  checkout_pct:number; checkout_fixo:number; gateway_pct:number
  imposto_pct:number; imposto_meta_pct:number; frete_fixo:number
  custo_produto:number; meta_ads:number; google_ads:number
}

interface DashData {
  fat:number; bruto:number; ped:number; ger:number; pend:number
  ticket:number; cAp:number; cPend:number; bPago:number; bPend:number
  pPago:number; pPend:number; hourly:number[]
  states:{s:string;o:number;r:number}[]
}

const FAKE: Record<string,DashData> = {
  today:     {fat:11534,bruto:12691,ped:126,ger:142,pend:16,ticket:91.54,cAp:68,cPend:1,bPago:0,bPend:0,pPago:58,pPend:15,hourly:[800,400,200,150,100,300,1200,2800,4200,5800,7200,8400,6800,7200,8000,9200,10400,9800,8600,7400,6200,4800,3200,1800],states:[{s:'SP',o:64,r:5824},{s:'RJ',o:23,r:2103},{s:'MG',o:17,r:1540},{s:'RS',o:11,r:980},{s:'PR',o:8,r:720}]},
  yesterday: {fat:9840,bruto:11200,ped:104,ger:121,pend:17,ticket:94.61,cAp:55,cPend:2,bPago:0,bPend:0,pPago:49,pPend:15,hourly:[400,200,100,80,60,200,900,2200,3800,5200,6400,7600,5800,6200,7000,8400,9200,8600,7800,6600,5400,4200,2800,1400],states:[{s:'SP',o:52,r:4920},{s:'RJ',o:19,r:1803},{s:'MG',o:14,r:1340},{s:'RS',o:9,r:780},{s:'PR',o:7,r:620}]},
  '7d':      {fat:78420,bruto:88500,ped:832,ger:950,pend:118,ticket:94.25,cAp:448,cPend:12,bPago:0,bPend:0,pPago:384,pPend:106,hourly:[5600,2800,1400,1050,700,2100,8400,19600,29400,40600,50400,58800,47600,50400,56000,64400,72800,68600,60200,51800,43400,33600,22400,12600],states:[{s:'SP',o:448,r:40780},{s:'RJ',o:161,r:14700},{s:'MG',o:119,r:10780},{s:'RS',o:77,r:6860},{s:'PR',o:56,r:5040}]},
  '30d':     {fat:336000,bruto:379200,ped:3570,ger:4080,pend:510,ticket:94.11,cAp:1920,cPend:52,bPago:0,bPend:0,pPago:1650,pPend:458,hourly:[24000,12000,6000,4500,3000,9000,36000,84000,126000,174000,216000,252000,204000,216000,240000,276000,312000,294000,258000,222000,186000,144000,96000,54000],states:[{s:'SP',o:1920,r:174720},{s:'RJ',o:693,r:63000},{s:'MG',o:513,r:46620},{s:'RS',o:330,r:30030},{s:'PR',o:242,r:22050}]},
  month:     {fat:198000,bruto:223400,ped:2100,ger:2400,pend:300,ticket:94.28,cAp:1130,cPend:31,bPago:0,bPend:0,pPago:970,pPend:269,hourly:[14000,7000,3500,2600,1750,5250,21000,49000,73500,101500,126000,147000,119000,126000,140000,161000,182000,171500,150500,129500,108500,84000,56000,31500],states:[{s:'SP',o:1130,r:102900},{s:'RJ',o:408,r:37100},{s:'MG',o:302,r:27440},{s:'RS',o:194,r:17640},{s:'PR',o:142,r:12950}]},
}

const CH_MULT = {
  ecom:  {mult:1,    label:'E-commerce',   icon:'🛒'},
  ml:    {mult:0.35, label:'Mercado Livre', icon:'🟡'},
  shopee:{mult:0.18, label:'Shopee',        icon:'🧡'},
  geral: {mult:1.53, label:'Geral',         icon:'📊'},
}

const DEF_TAXAS: Taxas = {checkout_pct:0.5,checkout_fixo:1500,gateway_pct:5,imposto_pct:16,imposto_meta_pct:13.65,frete_fixo:15,custo_produto:8,meta_ads:3352,google_ads:0}

const PAGE_LABELS: Record<Page,string> = {dashboard:'Dashboard',produtos:'Produtos',taxas:'Taxas & Tarifas',lancamentos:'Lançamentos Manuais',integracoes:'Integrações',configuracoes:'Configurações'}

const RANK_DATA = [
  {n:'🧴 Creme Anti-Age',s:'CAP-001',v:142,r:27974,l:9840,m:35.2},
  {n:'✨ Sérum Vitamina C',s:'SER-004',v:203,r:25781,l:11230,m:43.6},
  {n:'📦 Kit Emagrecimento',s:'KIT-003',v:67,r:19899,l:8120,m:40.8},
  {n:'💊 Suplemento Colágeno',s:'SUP-002',v:89,r:13261,l:5230,m:39.4},
]

const PRODS_INIT = [
  {id:1,name:'Creme Anti-Age Premium',sku:'CAP-001',cost:28.5,price:197,img:'🧴'},
  {id:2,name:'Suplemento Colágeno 60 caps',sku:'SUP-002',cost:19.9,price:149,img:'💊'},
  {id:3,name:'Kit Emagrecimento 30 dias',sku:'KIT-003',cost:45,price:297,img:'📦'},
  {id:4,name:'Sérum Vitamina C',sku:'SER-004',cost:22,price:127,img:'✨'},
]

const brl = (v:number) => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v)
const num = (v:number) => new Intl.NumberFormat('pt-BR').format(v)

function calcCosts(fat:number,ped:number,t:Taxas) {
  const tCo=fat*t.checkout_pct/100, tGw=fat*t.gateway_pct/100, tIm=fat*t.imposto_pct/100
  const tPr=ped*t.custo_produto, tFr=ped*t.frete_fixo
  const tMa=t.meta_ads, tGo=t.google_ads, tMi=tMa*t.imposto_meta_pct/100
  const total=tCo+tGw+tIm+tPr+tFr+tMa+tGo+tMi
  return {tCo,tGw,tIm,tPr,tFr,tMa,tGo,tMi,total,lucro:fat-total}
}

function normShopify(d:any): DashData {
  return {
    fat:d.faturamentoPago||0, bruto:d.faturamentoBruto||0,
    ped:d.pedidosPagos||0, ger:d.pedidosGerados||0, pend:d.pedidosPendentes||0,
    ticket:d.ticketMedio||0, cAp:d.cartaoAprovado||0, cPend:d.cartaoPendente||0,
    bPago:d.boletoPago||0, bPend:d.boletoPendente||0, pPago:d.pixPago||0, pPend:d.pixPendente||0,
    hourly:d.hourly||Array(24).fill(0),
    states:(d.states||[]).map((s:any)=>({s:s.state,o:s.orders,r:s.revenue})),
  }
}

function getFake(filter:string, channel:Channel): DashData {
  const base=FAKE[filter]||FAKE.today, m=CH_MULT[channel].mult
  return {
    fat:Math.round(base.fat*m), bruto:Math.round(base.bruto*m),
    ped:Math.round(base.ped*m), ger:Math.round(base.ger*m), pend:Math.round(base.pend*m),
    ticket:base.ticket*(channel==='ml'?0.85:channel==='shopee'?0.75:1),
    cAp:Math.round(base.cAp*m), cPend:Math.round(base.cPend*m),
    bPago:Math.round(base.bPago*m), bPend:Math.round(base.bPend*m),
    pPago:Math.round(base.pPago*m), pPend:Math.round(base.pPend*m),
    hourly:base.hourly.map(v=>Math.round(v*m)),
    states:base.states.map(s=>({s:s.s,o:Math.round(s.o*m),r:Math.round(s.r*m)})),
  }
}

function LogoSVG({size=28,uid='a'}:{size?:number;uid?:string}) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <rect width="20" height="40" x="5" y="55" rx="3" fill={`url(#g1${uid})`}/>
      <rect width="20" height="55" x="30" y="40" rx="3" fill={`url(#g1${uid})`}/>
      <rect width="20" height="70" x="55" y="25" rx="3" fill={`url(#g1${uid})`}/>
      <rect width="20" height="85" x="80" y="10" rx="3" fill={`url(#g1${uid})`}/>
      <path d="M15 65 Q42 35 65 20 L90 8" stroke={`url(#g2${uid})`} strokeWidth="5" fill="none" strokeLinecap="round"/>
      <polygon points="88,2 97,15 82,13" fill="#4ade80"/>
      <defs>
        <linearGradient id={`g1${uid}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7c3aed"/><stop offset="100%" stopColor="#4ade80"/></linearGradient>
        <linearGradient id={`g2${uid}`} x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#7c3aed"/><stop offset="100%" stopColor="#4ade80"/></linearGradient>
      </defs>
    </svg>
  )
}

function LoginPage({onLogin}:{onLogin:(nome:string)=>void}) {
  const [email,setEmail]=useState(''), [senha,setSenha]=useState('')
  const [erro,setErro]=useState(''), [loading,setLoading]=useState(false), [showPass,setShowPass]=useState(false)
  const doLogin = async () => {
    setLoading(true); setErro('')
    try {
      const res = await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,senha})})
      const data = await res.json()
      if (data.success) { localStorage.setItem('lucrodash_user',data.nome); onLogin(data.nome) }
      else setErro('Email ou senha incorretos')
    } catch { setErro('Erro de conexão') }
    setLoading(false)
  }
  const startDemo = () => { localStorage.setItem('lucrodash_user','Lucas'); onLogin('Lucas') }
  const inp = {background:'#0f0e17',color:'#e2e8f0',border:'1px solid #2d2d3d',borderRadius:10,fontSize:14,outline:'none',width:'100%',boxSizing:'border-box' as const,fontFamily:'inherit'}
  return (
    <div style={{minHeight:'100vh',background:'#0a0918',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{width:'100%',maxWidth:380}}>
        <div style={{textAlign:'center',marginBottom:28}}>
          <LogoSVG size={56} uid="ln"/>
          <h1 style={{fontSize:22,fontWeight:700,color:'#f1f5f9',marginTop:12}}>Holy Dash</h1>
          <p style={{fontSize:13,color:'#64748b',marginTop:4}}>Ferramentas para quem constrói com propósito</p>
        </div>
        <div style={{background:'#141320',border:'1px solid #1e1d2e',borderRadius:16,padding:28}}>
          <div style={{marginBottom:16}}>
            <label style={{fontSize:12,color:'#64748b',display:'block',marginBottom:6}}>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com" style={{...inp,padding:'10px 14px'}} onKeyDown={e=>e.key==='Enter'&&doLogin()}/>
          </div>
          <div style={{marginBottom:16}}>
            <label style={{fontSize:12,color:'#64748b',display:'block',marginBottom:6}}>Senha</label>
            <div style={{position:'relative'}}>
              <input type={showPass?'text':'password'} value={senha} onChange={e=>setSenha(e.target.value)} placeholder="••••••••" style={{...inp,padding:'10px 44px 10px 14px'}} onKeyDown={e=>e.key==='Enter'&&doLogin()}/>
              <button onClick={()=>setShowPass(!showPass)} style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'transparent',border:'none',color:'#64748b',fontSize:16,cursor:'pointer',padding:0}}>{showPass?'🙈':'👁️'}</button>
            </div>
          </div>
          {erro&&<div style={{fontSize:12,color:'#f87171',textAlign:'center',marginBottom:12}}>{erro}</div>}
          <button onClick={doLogin} disabled={loading} style={{width:'100%',padding:12,borderRadius:10,background:'linear-gradient(135deg,#4338ca,#7c3aed)',border:'none',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',marginBottom:8,opacity:loading?0.7:1}}>{loading?'⏳ Entrando...':'Entrar'}</button>
          <button onClick={startDemo} style={{width:'100%',padding:10,borderRadius:10,background:'transparent',border:'1px solid #2d2d3d',color:'#64748b',fontSize:13,cursor:'pointer'}}>Entrar sem senha (demo)</button>
        </div>
      </div>
    </div>
  )
}

function DashPage({taxas,metaGoal,setMetaGoal,showToast}:{taxas:Taxas;metaGoal:number;setMetaGoal:(v:number)=>void;showToast:(m:string)=>void}) {
  const [filter,setFilter]=useState('today')
  const [channel,setChannel]=useState<Channel>('ecom')
  const [showCustom,setShowCustom]=useState(false)
  const [customStart,setCustomStart]=useState('')
  const [customEnd,setCustomEnd]=useState('')
  const [dashData,setDashData]=useState<DashData|null>(null)
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState('')
  const [showMetaModal,setShowMetaModal]=useState(false)
  const [metaInput,setMetaInput]=useState('')
  const [rankSort,setRankSort]=useState(0)

  useEffect(() => {
    if (channel==='ecom') {
      setLoading(true); setError('')
      fetch(`/api/shopify/orders?filter=${filter}`)
        .then(r=>r.json())
        .then(d=>{setDashData(normShopify(d));setLoading(false)})
        .catch(e=>{setError(e.message);setLoading(false)})
    } else {
      setDashData(getFake(filter,channel))
    }
  },[filter,channel])

  const d = dashData || FAKE.today
  const c = calcCosts(d.fat,d.ped,taxas)
  const mg = d.fat>0?c.lucro/d.fat*100:0
  const pct = Math.min(d.fat/metaGoal*100,100)
  const today = new Date().getDate()
  const daysInMonth = new Date(new Date().getFullYear(),new Date().getMonth()+1,0).getDate()
  const proj = today>0?(d.fat/today)*daysInMonth:0
  const cpa = d.ped>0?(taxas.meta_ads+taxas.google_ads)/d.ped:0
  const roas = (taxas.meta_ads+taxas.google_ads)>0?d.fat/(taxas.meta_ads+taxas.google_ads):0
  const maxH = Math.max(...d.hourly,1)
  const nowH = new Date().getHours()
  const maxR = d.states[0]?.r||1
  const fb = (v:string,l:string) => (
    <button key={v} onClick={()=>{setFilter(v);setShowCustom(false)}} style={{padding:'5px 12px',borderRadius:20,fontSize:12,border:filter===v&&!showCustom?'1.5px solid #6366f1':'1px solid #2d2d3d',background:filter===v&&!showCustom?'rgba(99,102,241,0.15)':'transparent',color:filter===v&&!showCustom?'#a5b4fc':'#64748b',cursor:'pointer'}}>{l}</button>
  )
  const chTab = (ch:Channel,icon:string,label:string) => (
    <button key={ch} onClick={()=>setChannel(ch)} style={{padding:'7px 16px',borderRadius:10,fontSize:13,fontWeight:600,border:channel===ch?'1.5px solid #6366f1':'1px solid #2d2d3d',background:channel===ch?'rgba(99,102,241,0.15)':'transparent',color:channel===ch?'#a5b4fc':'#64748b',display:'flex',alignItems:'center',gap:6,cursor:'pointer'}}>{icon} {label}</button>
  )
  const kpi = (label:string,val:string,cls:string,sub?:string,valColor?:string) => (
    <div style={{background:'#141320',border:'1px solid #1e1d2e',borderRadius:14,padding:'14px 16px',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:cls}}/>
      <div style={{fontSize:10,color:'#64748b',fontWeight:600,textTransform:'uppercase' as const,letterSpacing:'0.4px',marginBottom:6}}>{label}</div>
      <div style={{fontSize:20,fontWeight:700,color:valColor||'#f1f5f9'}}>{val}</div>
      {sub&&<div style={{fontSize:11,color:'#64748b',marginTop:3}}>{sub}</div>}
    </div>
  )
  const row = (l:string,v:string,color?:string) => (
    <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid #1a1929',fontSize:12}}>
      <span style={{color:'#94a3b8'}}>{l}</span><span style={{fontWeight:600,color:color||'#e2e8f0'}}>{v}</span>
    </div>
  )
  const lucroRow = (l:string,v:number,pos=false) => (
    <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid #1a1929',fontSize:12}}>
      <span style={{color:'#94a3b8'}}>{l}</span><span style={{fontWeight:600,color:pos?'#34d399':'#f87171'}}>{pos?'+ ':'- '}{brl(Math.abs(v))}</span>
    </div>
  )
  const RANK_SORTS = ['Fat.','Lucro','Qtd','Margem','CPA']
  return (
    <div style={{padding:'18px 16px 60px'}}>
      {showMetaModal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
          <div style={{background:'#141320',border:'1px solid #1e1d2e',borderRadius:16,padding:24,width:'100%',maxWidth:360}}>
            <h2 style={{fontSize:16,fontWeight:700,color:'#f1f5f9',marginBottom:6}}>🎯 Definir Meta do Mês</h2>
            <p style={{fontSize:12,color:'#64748b',marginBottom:16}}>Quanto você quer faturar este mês?</p>
            <input type="number" value={metaInput} onChange={e=>setMetaInput(e.target.value)} placeholder="Ex: 250000" style={{background:'#0f0e17',color:'#e2e8f0',border:'1px solid #2d2d3d',borderRadius:8,padding:'8px 12px',fontSize:14,width:'100%',outline:'none',marginBottom:14,boxSizing:'border-box'}}/>
            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>{const v=parseFloat(metaInput);if(v>0){setMetaGoal(v);setShowMetaModal(false);showToast('Meta atualizada!')}}} style={{flex:1,padding:10,borderRadius:10,background:'linear-gradient(135deg,#4338ca,#7c3aed)',border:'none',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>Salvar</button>
              <button onClick={()=>setShowMetaModal(false)} style={{padding:'10px 16px',borderRadius:10,background:'transparent',border:'1px solid #2d2d3d',color:'#64748b',fontSize:13,cursor:'pointer'}}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:18,flexWrap:'wrap' as const,gap:10}}>
        <div><h1 style={{fontSize:20,fontWeight:700,color:'#f1f5f9'}}>Dashboard</h1><p style={{fontSize:12,color:'#64748b',marginTop:3}}>Pelos Pets · Visão geral da operação</p></div>
        <div>
          <div style={{display:'flex',gap:5,flexWrap:'wrap' as const}}>
            {fb('today','Hoje')}{fb('yesterday','Ontem')}{fb('7d','7 dias')}{fb('30d','30 dias')}{fb('month','Este mês')}
            <button onClick={()=>setShowCustom(!showCustom)} style={{padding:'5px 12px',borderRadius:20,fontSize:12,border:showCustom?'1.5px solid #6366f1':'1px solid #2d2d3d',background:showCustom?'rgba(99,102,241,0.15)':'transparent',color:showCustom?'#a5b4fc':'#64748b',cursor:'pointer'}}>📅 Período</button>
          </div>
          {showCustom&&(
            <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap' as const,marginTop:8}}>
              <input type="date" value={customStart} onChange={e=>setCustomStart(e.target.value)} style={{background:'#0f0e17',color:'#e2e8f0',border:'1px solid #2d2d3d',borderRadius:8,padding:'4px 8px',fontSize:12,outline:'none'}}/>
              <span style={{color:'#64748b',fontSize:12}}>até</span>
              <input type="date" value={customEnd} onChange={e=>setCustomEnd(e.target.value)} style={{background:'#0f0e17',color:'#e2e8f0',border:'1px solid #2d2d3d',borderRadius:8,padding:'4px 8px',fontSize:12,outline:'none'}}/>
              <button onClick={()=>{if(customStart&&customEnd)setFilter(`custom:${customStart}:${customEnd}`)}} style={{padding:'5px 14px',borderRadius:20,fontSize:12,background:'linear-gradient(135deg,#4338ca,#7c3aed)',border:'none',color:'#fff',cursor:'pointer'}}>Buscar</button>
            </div>
          )}
        </div>
      </div>
      {loading&&<div style={{textAlign:'center',padding:40,color:'#64748b',fontSize:14}}><span style={{display:'inline-block',width:20,height:20,border:'2px solid #2d2d3d',borderTopColor:'#6366f1',borderRadius:'50%',animation:'spin 0.7s linear infinite',marginRight:8,verticalAlign:'middle'}}/>Carregando dados...</div>}
      {error&&<div style={{textAlign:'center',padding:40,color:'#f87171',fontSize:13}}>❌ {error}</div>}
      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap' as const}}>
        {chTab('ecom','🛒','E-commerce')}{chTab('ml','🟡','Mercado Livre')}{chTab('shopee','🧡','Shopee')}{chTab('geral','📊','Geral')}
      </div>
      {!loading&&(
        <>
          <div className="kpi-grid">
            {kpi('Faturamento Pago',brl(d.fat),'linear-gradient(90deg,#6366f1,transparent)',`Bruto: ${brl(d.bruto)}`)}
            {kpi('Lucro Líquido',brl(c.lucro),'linear-gradient(90deg,#34d399,transparent)',`Margem: ${mg.toFixed(1)}%`,c.lucro>0?'#34d399':'#f87171')}
            {kpi('Pedidos Pagos',num(d.ped),'linear-gradient(90deg,#a78bfa,transparent)',`de ${num(d.ger)} gerados`)}
            {kpi('Ticket Médio',brl(d.ticket),'linear-gradient(90deg,#fbbf24,transparent)')}
            {kpi('Total Custos',brl(c.total),'linear-gradient(90deg,#f87171,transparent)',undefined,'#f87171')}
            {kpi('CPA',brl(cpa),'linear-gradient(90deg,#6366f1,transparent)','Custo por pedido pago')}
            {kpi('ROAS',`${roas.toFixed(2)}x`,'linear-gradient(90deg,#34d399,transparent)','Retorno sobre ads',roas>=3?'#34d399':roas>=2?'#fbbf24':'#f87171')}
          </div>
          <div className="g3">
            <div style={{background:'#141320',border:'1px solid #1e1d2e',borderRadius:14,padding:'16px 18px'}}>
              <div style={{fontSize:10,fontWeight:600,color:'#64748b',textTransform:'uppercase' as const,letterSpacing:'0.5px',marginBottom:12}}>Composição do Lucro</div>
              {lucroRow('Faturamento pago',d.fat,true)}
              {lucroRow(`Taxa checkout (${taxas.checkout_pct}%)`,c.tCo)}
              {lucroRow(`Taxa gateway (${taxas.gateway_pct}%)`,c.tGw)}
              {lucroRow(`Impostos (${taxas.imposto_pct}%)`,c.tIm)}
              {lucroRow(`Custo produto (${d.ped}x R$${taxas.custo_produto})`,c.tPr)}
              {lucroRow(`Frete (${d.ped}x R$${taxas.frete_fixo})`,c.tFr)}
              {lucroRow('Meta Ads',c.tMa)}
              {lucroRow(`Imposto Meta (${taxas.imposto_meta_pct}%)`,c.tMi)}
              {lucroRow('Google Ads',c.tGo)}
              <div style={{display:'flex',justifyContent:'space-between',padding:'10px 0 4px',borderTop:'1px solid #2d2d3d',marginTop:6}}>
                <span style={{fontSize:13,fontWeight:700,color:'#f1f5f9'}}>Lucro líquido</span>
                <div style={{textAlign:'right'}}><div style={{fontSize:14,fontWeight:700,color:c.lucro>0?'#34d399':'#f87171'}}>{brl(c.lucro)}</div><div style={{fontSize:11,color:'#64748b'}}>Margem: {mg.toFixed(1)}%</div></div>
              </div>
            </div>
            <div style={{background:'#141320',border:'1px solid #1e1d2e',borderRadius:14,padding:'16px 18px'}}>
              <div style={{fontSize:10,fontWeight:600,color:'#64748b',textTransform:'uppercase' as const,letterSpacing:'0.5px',marginBottom:12}}>Pedidos</div>
              {row('Gerados',num(d.ger))}{row('Pendentes',num(d.pend))}{row('Cartão aprovado',num(d.cAp),'#34d399')}{row('Cartão pendente',num(d.cPend))}{row('Boleto pago',num(d.bPago),'#34d399')}{row('Boleto pendente',num(d.bPend))}{row('PIX pago',num(d.pPago),'#34d399')}{row('PIX pendente',num(d.pPend))}
            </div>
            <div style={{background:'#141320',border:'1px solid #1e1d2e',borderRadius:14,padding:'16px 18px'}}>
              <div style={{fontSize:10,fontWeight:600,color:'#64748b',textTransform:'uppercase' as const,letterSpacing:'0.5px',marginBottom:12}}>Pedidos por Método</div>
              {row('Cartão aprovado',num(d.cAp),'#fbbf24')}{row('PIX pago',num(d.pPago),'#fbbf24')}{row('Boleto pago',num(d.bPago),'#fbbf24')}{row('Cartão pendente',num(d.cPend))}{row('Boleto pendente',num(d.bPend))}{row('PIX pendente',num(d.pPend))}
            </div>
          </div>
          <div className="g2c">
            <div style={{background:'#141320',border:'1px solid #1e1d2e',borderRadius:14,padding:18}}>
              <div style={{fontSize:10,fontWeight:600,color:'#64748b',textTransform:'uppercase' as const,letterSpacing:'0.5px',marginBottom:12}}>Vendas por Hora</div>
              <div style={{display:'flex',alignItems:'flex-end',gap:2,height:80}}>
                {d.hourly.map((v,i)=><div key={i} title={`${i}h: ${brl(v)}`} style={{flex:1,height:`${Math.max(v/maxH*100,3)}%`,background:i===nowH?'#6366f1':`rgba(99,102,241,${0.15+v/maxH*0.5})`,borderRadius:'2px 2px 0 0'}}/>)}
              </div>
              <div style={{display:'flex',justifyContent:'space-between',marginTop:6,fontSize:10,color:'#475569'}}><span>00h</span><span>12h</span><span>23h</span></div>
            </div>
            <div style={{background:'#141320',border:'1px solid #1e1d2e',borderRadius:14,padding:18}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                <span style={{fontSize:10,fontWeight:600,color:'#64748b',textTransform:'uppercase' as const,letterSpacing:'0.5px'}}>Meta do Mês</span>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:12,color:'#a5b4fc',fontWeight:600}}>{pct.toFixed(1)}%</span>
                  <button onClick={()=>{setMetaInput(String(metaGoal));setShowMetaModal(true)}} style={{background:'transparent',border:'1px solid #2d2d3d',borderRadius:6,color:'#64748b',fontSize:10,padding:'2px 7px',cursor:'pointer'}}>Editar</button>
                </div>
              </div>
              <div style={{fontSize:20,fontWeight:700,color:'#f1f5f9'}}>{brl(d.fat)}</div>
              <div style={{fontSize:12,color:'#64748b',marginBottom:2}}>de {brl(metaGoal)}</div>
              <div style={{height:6,background:'#1e1d2e',borderRadius:3,overflow:'hidden',margin:'8px 0'}}>
                <div style={{height:'100%',width:`${pct}%`,background:'linear-gradient(90deg,#4338ca,#7c3aed)',borderRadius:3}}/>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:11}}>
                <div style={{color:'#64748b'}}>Projeção<div style={{fontSize:13,fontWeight:600,color:proj>=metaGoal?'#34d399':'#fbbf24'}}>{brl(proj)}</div></div>
                <div style={{textAlign:'right',color:'#64748b'}}>Faltam<div style={{fontSize:13,fontWeight:600,color:'#94a3b8'}}>{brl(metaGoal-d.fat)}</div></div>
              </div>
            </div>
          </div>
          <div className="gb">
            <div style={{background:'#141320',border:'1px solid #1e1d2e',borderRadius:14,padding:18}}>
              <div style={{fontSize:10,fontWeight:600,color:'#64748b',textTransform:'uppercase' as const,letterSpacing:'0.5px',marginBottom:12}}>Vendas por Estado</div>
              {d.states.map((s,i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'7px 0',borderBottom:i<d.states.length-1?'1px solid #1a1929':'none'}}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <span style={{fontSize:12,fontWeight:700,color:'#a5b4fc',minWidth:28}}>{s.s}</span>
                    <div style={{height:3,width:`${s.r/maxR*60}px`,background:'linear-gradient(90deg,#4338ca,#7c3aed)',borderRadius:2}}/>
                  </div>
                  <div style={{textAlign:'right'}}><div style={{fontSize:12,fontWeight:600,color:'#e2e8f0'}}>{brl(s.r)}</div><div style={{fontSize:10,color:'#64748b'}}>{s.o} pedidos</div></div>
                </div>
              ))}
            </div>
            <div style={{background:'#141320',border:'1px solid #1e1d2e',borderRadius:14,padding:18}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14,flexWrap:'wrap' as const,gap:8}}>
                <span style={{fontSize:10,fontWeight:600,color:'#64748b',textTransform:'uppercase' as const,letterSpacing:'0.5px'}}>Ranking de Produtos</span>
                <div style={{display:'flex',gap:4}}>
                  {RANK_SORTS.map((l,i)=>(
                    <button key={l} onClick={()=>setRankSort(i)} style={{padding:'3px 9px',borderRadius:6,fontSize:11,border:rankSort===i?'1px solid #6366f1':'1px solid #2d2d3d',background:rankSort===i?'rgba(99,102,241,0.2)':'transparent',color:rankSort===i?'#a5b4fc':'#64748b',cursor:'pointer'}}>{l}</button>
                  ))}
                </div>
              </div>
              <div style={{overflowX:'auto' as const}}>
                <table style={{width:'100%',borderCollapse:'collapse' as const,minWidth:400}}>
                  <thead><tr style={{borderBottom:'1px solid #1e1d2e'}}>{['#','Produto','Vendas','Faturamento','Lucro','Margem'].map(h=><th key={h} style={{fontSize:11,color:'#475569',fontWeight:600,textAlign:'left' as const,padding:'0 10px 8px 0',whiteSpace:'nowrap' as const}}>{h}</th>)}</tr></thead>
                  <tbody>
                    {RANK_DATA.map((p,i)=>(
                      <tr key={i} style={{borderBottom:'1px solid #1a1929'}}>
                        <td style={{padding:'10px 10px 10px 0'}}><div style={{width:20,height:20,borderRadius:4,background:i===0?'rgba(251,191,36,0.15)':'rgba(99,102,241,0.1)',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:i===0?'#fbbf24':'#6366f1'}}>{i+1}</div></td>
                        <td style={{padding:'10px 14px 10px 0'}}><div style={{fontSize:12,fontWeight:600,color:'#e2e8f0'}}>{p.n}</div><div style={{fontSize:10,color:'#475569',fontFamily:'monospace'}}>{p.s}</div></td>
                        <td style={{padding:'10px 10px 10px 0',fontSize:12,color:'#94a3b8',whiteSpace:'nowrap' as const}}>{p.v}</td>
                        <td style={{padding:'10px 10px 10px 0',fontSize:12,fontWeight:600,whiteSpace:'nowrap' as const}}>{brl(p.r)}</td>
                        <td style={{padding:'10px 10px 10px 0',fontSize:12,fontWeight:700,color:'#34d399',whiteSpace:'nowrap' as const}}>{brl(p.l)}</td>
                        <td style={{padding:'10px 0'}}><span style={{fontSize:11,fontWeight:600,padding:'2px 7px',borderRadius:5,background:'rgba(52,211,153,0.15)',color:'#34d399'}}>{p.m}%</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function ProdutosPage({showToast}:{showToast:(m:string)=>void}) {
  const [prods,setProds]=useState(PRODS_INIT.map(p=>({...p,editing:false,nc:''})))
  const inp={background:'#0f0e17',color:'#e2e8f0',border:'1px solid #2d2d3d',borderRadius:8,padding:'8px 12px',fontSize:14,outline:'none',fontFamily:'inherit'}
  return (
    <div style={{padding:'18px 16px 60px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:18,flexWrap:'wrap' as const,gap:10}}>
        <div><h1 style={{fontSize:20,fontWeight:700,color:'#f1f5f9'}}>Produtos</h1><p style={{fontSize:12,color:'#64748b',marginTop:3}}>Gerencie custos por SKU</p></div>
        <button onClick={()=>showToast('Em breve: adicionar produto!')} style={{padding:'8px 18px',borderRadius:8,background:'linear-gradient(135deg,#4338ca,#7c3aed)',border:'none',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer'}}>+ Novo</button>
      </div>
      <div style={{background:'#141320',border:'1px solid #1e1d2e',borderRadius:14,overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse' as const}}>
          <thead><tr style={{background:'#0f0e17'}}>{['Produto','SKU','Custo','Preço','Margem',''].map(h=><th key={h} style={{fontSize:11,color:'#475569',fontWeight:600,textAlign:'left' as const,padding:'10px 14px',borderBottom:'1px solid #1e1d2e'}}>{h}</th>)}</tr></thead>
          <tbody>
            {prods.map(p=>{
              const m=(((p.price-p.cost)/p.price)*100).toFixed(1)
              return (
                <tr key={p.id} style={{borderBottom:'1px solid #1a1929'}}>
                  <td style={{padding:'12px 14px'}}><div style={{display:'flex',alignItems:'center',gap:8}}><span style={{fontSize:18}}>{p.img}</span><span style={{fontSize:13,fontWeight:600,color:'#e2e8f0'}}>{p.name}</span></div></td>
                  <td style={{padding:'12px 14px',fontSize:11,color:'#6366f1',fontFamily:'monospace',fontWeight:600}}>{p.sku}</td>
                  <td style={{padding:'12px 14px'}}>
                    {p.editing?(
                      <div style={{display:'flex',gap:6,alignItems:'center'}}>
                        <input value={p.nc} onChange={e=>setProds(prev=>prev.map(x=>x.id===p.id?{...x,nc:e.target.value}:x))} style={{...inp,width:80,padding:'4px 8px'}} autoFocus/>
                        <button onClick={()=>{setProds(prev=>prev.map(x=>x.id===p.id?{...x,cost:parseFloat(x.nc)||x.cost,editing:false}:x));showToast('Custo atualizado!')}} style={{padding:'4px 8px',borderRadius:6,background:'#4338ca',border:'none',color:'#fff',fontSize:12,cursor:'pointer'}}>✓</button>
                        <button onClick={()=>setProds(prev=>prev.map(x=>x.id===p.id?{...x,editing:false}:x))} style={{padding:'4px 8px',borderRadius:6,background:'transparent',border:'1px solid #2d2d3d',color:'#64748b',fontSize:12,cursor:'pointer'}}>✕</button>
                      </div>
                    ):<span style={{fontSize:13,fontWeight:700,color:'#f87171'}}>{brl(p.cost)}</span>}
                  </td>
                  <td style={{padding:'12px 14px',fontSize:13,fontWeight:600,color:'#34d399'}}>{brl(p.price)}</td>
                  <td style={{padding:'12px 14px'}}><span style={{fontSize:11,fontWeight:600,padding:'2px 7px',borderRadius:5,background:parseFloat(m)>70?'rgba(52,211,153,0.15)':'rgba(251,191,36,0.15)',color:parseFloat(m)>70?'#34d399':'#fbbf24'}}>{m}%</span></td>
                  <td style={{padding:'12px 14px'}}><button onClick={()=>setProds(prev=>prev.map(x=>x.id===p.id?{...x,editing:true,nc:String(x.cost)}:x))} style={{padding:'4px 10px',borderRadius:6,background:'transparent',border:'1px solid #2d2d3d',color:'#a5b4fc',fontSize:11,cursor:'pointer'}}>✎ Editar</button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TaxasPage({taxas,setTaxas,showToast}:{taxas:Taxas;setTaxas:(t:Taxas)=>void;showToast:(m:string)=>void}) {
  const [t,setT]=useState(taxas)
  const [saving,setSaving]=useState(false)
  const inp={background:'#0f0e17',color:'#e2e8f0',border:'1px solid #2d2d3d',borderRadius:8,padding:'8px 12px',fontSize:14,outline:'none',fontFamily:'inherit',width:100}
  const handleSave = async () => {
    setSaving(true)
    await fetch('/api/taxas',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
      checkout_pct:t.checkout_pct, checkout_fixo_mensal:t.checkout_fixo, gateway_pct:t.gateway_pct,
      imposto_pct:t.imposto_pct, imposto_meta_pct:t.imposto_meta_pct, frete_fixo:t.frete_fixo,
      custo_produto:t.custo_produto, meta_ads_hoje:t.meta_ads, google_ads_hoje:t.google_ads,
    })})
    setTaxas(t)
    setSaving(false)
    showToast('Taxas salvas com sucesso!')
  }
  const field = (label:string, k:keyof Taxas, suf:string, hint:string) => (
    <div key={k} style={{marginBottom:14}}>
      <label style={{fontSize:11,color:'#64748b',fontWeight:500,display:'block',marginBottom:5}}>{label}</label>
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        <input type="number" step="0.01" value={t[k]} onChange={e=>setT(p=>({...p,[k]:parseFloat(e.target.value)||0}))} style={inp}/>
        <span style={{fontSize:12,color:'#64748b'}}>{suf}</span>
      </div>
      <span style={{fontSize:10,color:'#475569',marginTop:3,display:'block'}}>{hint}</span>
    </div>
  )
  const card = (title:string, color:string, children:React.ReactNode) => (
    <div style={{background:'#141320',border:'1px solid #1e1d2e',borderRadius:14,padding:20}}>
      <div style={{fontSize:12,fontWeight:700,color,marginBottom:16,paddingBottom:10,borderBottom:'1px solid #1e1d2e'}}>{title}</div>
      {children}
    </div>
  )
  return (
    <div style={{padding:'18px 16px 60px'}}>
      <div style={{marginBottom:18}}><h1 style={{fontSize:20,fontWeight:700,color:'#f1f5f9'}}>Taxas & Tarifas</h1><p style={{fontSize:12,color:'#64748b',marginTop:3}}>Configure tudo que impacta seu lucro</p></div>
      <div className="taxas-grid">
        {card('Taxas de Pagamento','#a5b4fc',<>{field('Taxa checkout %','checkout_pct','%','Percentual por venda')}{field('Checkout fixo mensal','checkout_fixo','R$','Mensalidade fixa')}{field('Taxa gateway','gateway_pct','%','Sobre valor aprovado')}</>)}
        {card('Custos Fixos','#fbbf24',<>{field('Custo por produto','custo_produto','R$','Por unidade vendida')}{field('Frete por pedido','frete_fixo','R$','Custo médio de envio')}</>)}
        {card('Impostos','#f87171',<>{field('Imposto s/ faturamento','imposto_pct','%','Sobre receita paga')}{field('Imposto s/ Meta Ads','imposto_meta_pct','%','IOF + ISS sobre ads')}</>)}
        {card('Ads de Hoje','#34d399',<>{field('Meta Ads hoje','meta_ads','R$','Gasto do dia')}{field('Google Ads hoje','google_ads','R$','Gasto do dia')}</>)}
      </div>
      <div style={{textAlign:'right',marginTop:14}}>
        <button onClick={handleSave} disabled={saving} style={{padding:'9px 24px',borderRadius:10,fontSize:13,fontWeight:700,border:'none',background:'linear-gradient(135deg,#4338ca,#7c3aed)',color:'#fff',cursor:'pointer',opacity:saving?0.7:1}}>{saving?'⏳ Salvando...':'Salvar Configurações'}</button>
      </div>
    </div>
  )
}

function LancamentosPage({showToast}:{showToast:(m:string)=>void}) {
  const [entries,setEntries]=useState([
    {id:1,date:'2026-04-15',tipo:'Google Ads',valor:380,obs:'Campanha search'},
    {id:2,date:'2026-04-14',tipo:'Despesa Fixa',valor:500,obs:'Shopify'},
  ])
  const [form,setForm]=useState({date:new Date().toISOString().split('T')[0],tipo:'Google Ads',valor:'',obs:''})
  const inp={background:'#0f0e17',color:'#e2e8f0',border:'1px solid #2d2d3d',borderRadius:8,padding:'8px 12px',fontSize:14,outline:'none',fontFamily:'inherit'}
  const add = () => {
    if (form.valor) {
      setEntries(p=>[{...form,id:Date.now(),valor:parseFloat(form.valor)},...p])
      setForm(p=>({...p,valor:'',obs:''}))
      showToast('Lançamento adicionado!')
    }
  }
  return (
    <div style={{padding:'18px 16px 60px'}}>
      <div style={{marginBottom:18}}><h1 style={{fontSize:20,fontWeight:700,color:'#f1f5f9'}}>Lançamentos Manuais</h1><p style={{fontSize:12,color:'#64748b',marginTop:3}}>Google Ads, despesas extras e outras entradas</p></div>
      <div style={{background:'#141320',border:'1px solid #1e1d2e',borderRadius:14,padding:18,marginBottom:14}}>
        <div style={{display:'flex',gap:10,flexWrap:'wrap' as const,alignItems:'flex-end'}}>
          <div style={{display:'flex',flexDirection:'column' as const,gap:5}}><label style={{fontSize:11,color:'#64748b'}}>Data</label><input type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))} style={{...inp,width:150}}/></div>
          <div style={{display:'flex',flexDirection:'column' as const,gap:5}}><label style={{fontSize:11,color:'#64748b'}}>Tipo</label>
            <select value={form.tipo} onChange={e=>setForm(p=>({...p,tipo:e.target.value}))} style={{...inp,width:160}}>
              {['Google Ads','TikTok Ads','Despesa Fixa','Despesa Variável','Outro'].map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <div style={{display:'flex',flexDirection:'column' as const,gap:5}}><label style={{fontSize:11,color:'#64748b'}}>Valor (R$)</label><input type="number" placeholder="0,00" value={form.valor} onChange={e=>setForm(p=>({...p,valor:e.target.value}))} style={{...inp,width:120}}/></div>
          <div style={{display:'flex',flexDirection:'column' as const,gap:5,flex:1,minWidth:160}}><label style={{fontSize:11,color:'#64748b'}}>Observação</label><input placeholder="Opcional..." value={form.obs} onChange={e=>setForm(p=>({...p,obs:e.target.value}))} style={inp}/></div>
          <button onClick={add} style={{padding:'9px 20px',borderRadius:8,background:'linear-gradient(135deg,#4338ca,#7c3aed)',border:'none',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>Adicionar</button>
        </div>
      </div>
      <div style={{background:'#141320',border:'1px solid #1e1d2e',borderRadius:14,overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse' as const}}>
          <thead><tr style={{background:'#0f0e17'}}>{['Data','Tipo','Valor','Observação',''].map(h=><th key={h} style={{fontSize:11,color:'#475569',fontWeight:600,textAlign:'left' as const,padding:'10px 14px',borderBottom:'1px solid #1e1d2e'}}>{h}</th>)}</tr></thead>
          <tbody>
            {entries.map(e=>(
              <tr key={e.id} style={{borderBottom:'1px solid #1a1929'}}>
                <td style={{padding:'11px 14px',fontSize:13,color:'#64748b'}}>{e.date}</td>
                <td style={{padding:'11px 14px'}}><span style={{fontSize:11,padding:'3px 8px',borderRadius:6,background:e.tipo.includes('Ads')?'rgba(251,191,36,0.12)':'rgba(99,102,241,0.12)',color:e.tipo.includes('Ads')?'#fbbf24':'#a5b4fc'}}>{e.tipo}</span></td>
                <td style={{padding:'11px 14px',fontSize:13,fontWeight:700,color:'#f87171'}}>{brl(e.valor)}</td>
                <td style={{padding:'11px 14px',fontSize:13,color:'#64748b'}}>{e.obs||'—'}</td>
                <td style={{padding:'11px 14px'}}><button onClick={()=>setEntries(p=>p.filter(x=>x.id!==e.id))} style={{padding:'3px 9px',borderRadius:6,background:'transparent',border:'1px solid #2d2d3d',color:'#f87171',fontSize:11,cursor:'pointer'}}>✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function IntegracoesPage({showToast}:{showToast:(m:string)=>void}) {
  const [shopifyConn,setShopifyConn]=useState(true)
  const [metaConn,setMetaConn]=useState(false)
  const [mlConn,setMlConn]=useState(false)
  const [shopeeConn,setShopeeConn]=useState(false)
  const [googleConn,setGoogleConn]=useState(false)

  const badge = (conn:boolean) => (
    <span style={{fontSize:11,padding:'4px 12px',borderRadius:20,fontWeight:600,whiteSpace:'nowrap' as const,background:conn?'rgba(52,211,153,0.15)':'rgba(248,113,113,0.15)',color:conn?'#34d399':'#f87171'}}>● {conn?'Conectado':'Desconectado'}</span>
  )
  const intCard = (icon:string,bg:string,title:string,desc:string,conn:boolean,badgeEl:React.ReactNode,footer:React.ReactNode) => (
    <div style={{background:'#141320',border:'1px solid #1e1d2e',borderRadius:14,padding:18,marginBottom:12}}>
      <div style={{display:'flex',alignItems:'center',gap:14,flexWrap:'wrap' as const}}>
        <div style={{width:48,height:48,borderRadius:12,background:bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>{icon}</div>
        <div style={{flex:1}}><h3 style={{fontSize:15,fontWeight:700,color:'#f1f5f9'}}>{title}</h3><p style={{fontSize:12,color:'#64748b',marginTop:2}}>{desc}</p></div>
        {badgeEl}
      </div>
      <div style={{marginTop:14,paddingTop:14,borderTop:'1px solid #1e1d2e',display:'flex',gap:10,flexWrap:'wrap' as const}}>{footer}</div>
    </div>
  )
  const btnConn = (label:string,grad:string,onClick:()=>void) => (
    <button onClick={onClick} style={{padding:'8px 18px',borderRadius:10,border:'none',color:'#fff',fontSize:13,fontWeight:600,background:grad,cursor:'pointer'}}>{label}</button>
  )
  const btnDisc = (onClick:()=>void) => (
    <button onClick={onClick} style={{padding:'8px 18px',borderRadius:10,background:'transparent',border:'1px solid #f87171',color:'#f87171',fontSize:13,fontWeight:600,cursor:'pointer'}}>Desconectar</button>
  )

  return (
    <div style={{padding:'18px 16px 60px'}}>
      <div style={{marginBottom:18}}><h1 style={{fontSize:20,fontWeight:700,color:'#f1f5f9'}}>Integrações</h1><p style={{fontSize:12,color:'#64748b',marginTop:3}}>Conecte suas plataformas</p></div>
      {intCard('🛒','rgba(149,191,71,0.15)','Shopify','Pedidos e faturamento em tempo real',shopifyConn,badge(shopifyConn),
        shopifyConn?btnDisc(()=>{setShopifyConn(false);showToast('Shopify desconectada')}):btnConn('Conectar com Shopify','linear-gradient(135deg,#4338ca,#7c3aed)',()=>{setShopifyConn(true);showToast('Shopify conectada!')})
      )}
      {intCard('📘','rgba(24,119,242,0.15)','Meta Ads','Gastos com anúncios automaticamente',metaConn,badge(metaConn),
        metaConn?btnDisc(()=>{setMetaConn(false);showToast('Meta Ads desconectado')}):btnConn('Conectar com Facebook','linear-gradient(135deg,#1877f2,#0d5abf)',()=>{window.location.href='/api/auth/meta'})
      )}
      {intCard('🟡','rgba(251,191,36,0.15)','Mercado Livre','Pedidos e faturamento do ML',mlConn,badge(mlConn),
        mlConn?btnDisc(()=>{setMlConn(false);showToast('Mercado Livre desconectado')}):btnConn('Conectar com Mercado Livre','linear-gradient(135deg,#f5a623,#e08e00)',()=>{setMlConn(true);showToast('Mercado Livre conectado!')})
      )}
      {intCard('🧡','rgba(249,115,22,0.15)','Shopee','Pedidos e faturamento da Shopee',shopeeConn,badge(shopeeConn),
        shopeeConn?btnDisc(()=>{setShopeeConn(false);showToast('Shopee desconectada')}):btnConn('Conectar com Shopee','linear-gradient(135deg,#f97316,#c2410c)',()=>{setShopeeConn(true);showToast('Shopee conectada!')})
      )}
      {intCard('🎯','rgba(251,191,36,0.15)','Google Ads','Gastos com anúncios automaticamente',googleConn,badge(googleConn),
        googleConn?btnDisc(()=>{setGoogleConn(false);showToast('Google Ads desconectado')}):btnConn('Conectar com Google Ads','linear-gradient(135deg,#ea4335,#c5221f)',()=>{setGoogleConn(true);showToast('Google Ads conectado!')})
      )}
    </div>
  )
}

function ConfiguracoesPage({user,store,metaGoal,setUser,setStore,setMetaGoal,showToast}:{user:string;store:string;metaGoal:number;setUser:(v:string)=>void;setStore:(v:string)=>void;setMetaGoal:(v:number)=>void;showToast:(m:string)=>void}) {
  const [cfg,setCfg]=useState({name:user,storeName:store,email:'lucas@pelospets.com.br',senha:'',meta:String(metaGoal),margem:'20',tz:'America/Sao_Paulo (Brasília)',currency:'BRL — Real Brasileiro'})
  const inp={background:'#0f0e17',color:'#e2e8f0',border:'1px solid #2d2d3d',borderRadius:8,padding:'8px 12px',fontSize:14,outline:'none',fontFamily:'inherit',width:'100%',boxSizing:'border-box' as const}
  const f = (label:string, children:React.ReactNode) => (
    <div style={{display:'flex',flexDirection:'column' as const,gap:5,marginBottom:14}}><label style={{fontSize:11,color:'#64748b'}}>{label}</label>{children}</div>
  )
  const handleSave = () => {
    setUser(cfg.name); setStore(cfg.storeName)
    const mv = parseFloat(cfg.meta); if (mv>0) setMetaGoal(mv)
    showToast('Configurações salvas!')
  }
  return (
    <div style={{padding:'18px 16px 60px'}}>
      <div style={{marginBottom:18}}><h1 style={{fontSize:20,fontWeight:700,color:'#f1f5f9'}}>Configurações</h1><p style={{fontSize:12,color:'#64748b',marginTop:3}}>Personalize sua conta</p></div>
      <div className="cfg-g2">
        <div style={{background:'#141320',border:'1px solid #1e1d2e',borderRadius:14,padding:20}}>
          <div style={{marginBottom:20}}>
            <h3 style={{fontSize:13,fontWeight:600,color:'#a5b4fc',marginBottom:14,paddingBottom:8,borderBottom:'1px solid #1e1d2e'}}>🏪 Sua Loja</h3>
            {f('Nome da loja',<input value={cfg.storeName} onChange={e=>setCfg(p=>({...p,storeName:e.target.value}))} style={inp}/>)}
            {f('Domínio Shopify',<input value="pelos-pets-9091.myshopify.com" readOnly style={{...inp,color:'#64748b'}}/>)}
          </div>
          <div>
            <h3 style={{fontSize:13,fontWeight:600,color:'#a5b4fc',marginBottom:14,paddingBottom:8,borderBottom:'1px solid #1e1d2e'}}>👤 Sua Conta</h3>
            {f('Seu nome',<input value={cfg.name} onChange={e=>setCfg(p=>({...p,name:e.target.value}))} style={inp}/>)}
            {f('Email',<input type="email" value={cfg.email} onChange={e=>setCfg(p=>({...p,email:e.target.value}))} style={inp}/>)}
            {f('Nova senha',<input type="password" value={cfg.senha} onChange={e=>setCfg(p=>({...p,senha:e.target.value}))} placeholder="Deixe em branco para manter" style={inp}/>)}
          </div>
        </div>
        <div style={{background:'#141320',border:'1px solid #1e1d2e',borderRadius:14,padding:20}}>
          <div style={{marginBottom:20}}>
            <h3 style={{fontSize:13,fontWeight:600,color:'#a5b4fc',marginBottom:14,paddingBottom:8,borderBottom:'1px solid #1e1d2e'}}>🎯 Metas</h3>
            {f('Meta de faturamento mensal (R$)',<input type="number" value={cfg.meta} onChange={e=>setCfg(p=>({...p,meta:e.target.value}))} style={inp}/>)}
            {f('Margem mínima desejada (%)',<input type="number" value={cfg.margem} onChange={e=>setCfg(p=>({...p,margem:e.target.value}))} style={inp}/>)}
          </div>
          <div>
            <h3 style={{fontSize:13,fontWeight:600,color:'#a5b4fc',marginBottom:14,paddingBottom:8,borderBottom:'1px solid #1e1d2e'}}>🌍 Preferências</h3>
            {f('Fuso horário',<select value={cfg.tz} onChange={e=>setCfg(p=>({...p,tz:e.target.value}))} style={inp}><option>America/Sao_Paulo (Brasília)</option><option>America/Manaus (AM)</option><option>America/Fortaleza (CE/RN/PB)</option></select>)}
            {f('Moeda',<select value={cfg.currency} onChange={e=>setCfg(p=>({...p,currency:e.target.value}))} style={inp}><option>BRL — Real Brasileiro</option><option>USD — Dólar Americano</option></select>)}
          </div>
        </div>
      </div>
      <div style={{textAlign:'right',marginTop:14}}>
        <button onClick={handleSave} style={{padding:'9px 24px',borderRadius:10,fontSize:13,fontWeight:700,border:'none',background:'linear-gradient(135deg,#4338ca,#7c3aed)',color:'#fff',cursor:'pointer'}}>Salvar Configurações</button>
      </div>
    </div>
  )
}

export default function App() {
  const [page,setPage]=useState<Page>('dashboard')
  const [menuOpen,setMenuOpen]=useState(false)
  const [user,setUser]=useState<string|null>(null)
  const [store,setStore]=useState('Pelos Pets')
  const [checkingAuth,setCheckingAuth]=useState(true)
  const [taxas,setTaxas]=useState<Taxas>(DEF_TAXAS)
  const [metaGoal,setMetaGoal]=useState(250000)
  const [toast,setToast]=useState<{msg:string;show:boolean}>({msg:'',show:false})

  const showToast = (msg:string) => {
    setToast({msg,show:true})
    setTimeout(()=>setToast(t=>({...t,show:false})),2500)
  }

  useEffect(()=>{
    const saved=localStorage.getItem('lucrodash_user')
    if(saved) setUser(saved)
    setCheckingAuth(false)
  },[])

  useEffect(()=>{
    if(!user) return
    fetch('/api/taxas').then(r=>r.json()).then(d=>{
      setTaxas({
        checkout_pct:d.checkout_pct??DEF_TAXAS.checkout_pct,
        checkout_fixo:d.checkout_fixo_mensal??DEF_TAXAS.checkout_fixo,
        gateway_pct:d.gateway_pct??DEF_TAXAS.gateway_pct,
        imposto_pct:d.imposto_pct??DEF_TAXAS.imposto_pct,
        imposto_meta_pct:d.imposto_meta_pct??DEF_TAXAS.imposto_meta_pct,
        frete_fixo:d.frete_fixo??DEF_TAXAS.frete_fixo,
        custo_produto:d.custo_produto??DEF_TAXAS.custo_produto,
        meta_ads:d.meta_ads_hoje??DEF_TAXAS.meta_ads,
        google_ads:d.google_ads_hoje??DEF_TAXAS.google_ads,
      })
    }).catch(()=>{})
  },[user])

  const handleLogout = () => { localStorage.removeItem('lucrodash_user'); setUser(null) }
  const goPage = (p:Page) => { setPage(p); setMenuOpen(false) }

  if (checkingAuth) return <div style={{minHeight:'100vh',background:'#0a0918'}}/>
  if (!user) return <LoginPage onLogin={setUser}/>

  const PAGES: Page[] = ['dashboard','produtos','taxas','lancamentos','integracoes','configuracoes']
  const ICONS: Record<Page,string> = {dashboard:'▣',produtos:'◈',taxas:'%',lancamentos:'⊕',integracoes:'⇄',configuracoes:'◎'}

  return (
    <div style={{background:'#0a0918',color:'#e2e8f0',fontFamily:'-apple-system,system-ui,sans-serif',minHeight:'100vh'}}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        .kpi-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:14px}
        @media(min-width:600px){.kpi-grid{grid-template-columns:repeat(3,1fr)}}
        @media(min-width:900px){.kpi-grid{grid-template-columns:repeat(5,1fr)}}
        .g3{display:grid;grid-template-columns:1fr;gap:12px;margin-bottom:14px}
        @media(min-width:700px){.g3{grid-template-columns:1fr 1fr 1fr}}
        .g2c{display:grid;grid-template-columns:1fr;gap:12px;margin-bottom:14px}
        @media(min-width:700px){.g2c{grid-template-columns:2fr 1fr}}
        .gb{display:grid;grid-template-columns:1fr;gap:12px}
        @media(min-width:700px){.gb{grid-template-columns:1fr 2fr}}
        .taxas-grid{display:grid;grid-template-columns:1fr;gap:14px}
        @media(min-width:600px){.taxas-grid{grid-template-columns:1fr 1fr}}
        @media(min-width:900px){.taxas-grid{grid-template-columns:repeat(4,1fr)}}
        .cfg-g2{display:grid;grid-template-columns:1fr;gap:14px}
        @media(min-width:700px){.cfg-g2{grid-template-columns:1fr 1fr}}
      `}</style>
      {/* Toast */}
      <div style={{position:'fixed',bottom:24,left:'50%',transform:`translateX(-50%) translateY(${toast.show?0:100}px)`,background:'#1e1d2e',border:'1px solid #34d399',borderRadius:10,padding:'10px 20px',fontSize:13,color:'#34d399',zIndex:200,transition:'transform 0.3s ease',whiteSpace:'nowrap' as const}}>✓ {toast.msg}</div>
      {/* Overlay */}
      {menuOpen&&<div onClick={()=>setMenuOpen(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:40}}/>}
      {/* Sidebar */}
      <aside style={{width:220,background:'#0f0e17',borderRight:'1px solid #1e1d2e',display:'flex',flexDirection:'column' as const,position:'fixed',top:0,left:0,height:'100vh',zIndex:50,transform:menuOpen?'translateX(0)':'translateX(-100%)',transition:'transform 0.25s ease'}}>
        <div style={{padding:'18px 16px',borderBottom:'1px solid #1e1d2e',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}><LogoSVG size={28} uid="sb"/><span style={{color:'#f1f5f9',fontWeight:700,fontSize:15}}>Holy Dash</span></div>
          <button onClick={()=>setMenuOpen(false)} style={{background:'transparent',border:'none',color:'#64748b',fontSize:18,cursor:'pointer',padding:4}}>✕</button>
        </div>
        <nav style={{flex:1,padding:'10px 0',overflowY:'auto' as const}}>
          {PAGES.map(p=>(
            <button key={p} onClick={()=>goPage(p)} style={{display:'flex',alignItems:'center',gap:10,width:'100%',padding:'10px 16px',background:page===p?'rgba(99,102,241,0.15)':'transparent',border:'none',borderLeft:page===p?'3px solid #6366f1':'3px solid transparent',color:page===p?'#a5b4fc':'#64748b',fontSize:13,fontWeight:page===p?600:400,cursor:'pointer',fontFamily:'inherit',textAlign:'left' as const}}>
              <span style={{display:'inline-block',width:16,textAlign:'center' as const,fontSize:14}}>{ICONS[p]}</span>
              {PAGE_LABELS[p]}
            </button>
          ))}
        </nav>
        <div style={{padding:'14px 16px',borderTop:'1px solid #1e1d2e'}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
            <div style={{width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,#4338ca,#7c3aed)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:'#fff',fontWeight:700,flexShrink:0}}>{user[0].toUpperCase()}</div>
            <div><div style={{color:'#e2e8f0',fontSize:12,fontWeight:600}}>{user}</div><div style={{color:'#64748b',fontSize:11}}>{store}</div></div>
          </div>
          <button onClick={handleLogout} style={{width:'100%',padding:6,borderRadius:8,background:'transparent',border:'1px solid #2d2d3d',color:'#f87171',fontSize:11,cursor:'pointer'}}>Sair</button>
        </div>
      </aside>
      {/* Main */}
      <div style={{display:'flex',flexDirection:'column' as const,minHeight:'100vh'}}>
        <div style={{position:'sticky',top:0,zIndex:30,background:'#0f0e17',borderBottom:'1px solid #1e1d2e',padding:'12px 16px',display:'flex',alignItems:'center',gap:12}}>
          <button onClick={()=>setMenuOpen(true)} style={{background:'transparent',border:'none',color:'#a5b4fc',fontSize:22,lineHeight:1,cursor:'pointer',padding:4}}>☰</button>
          <div style={{display:'flex',alignItems:'center',gap:8}}><LogoSVG size={22} uid="tb"/><span style={{color:'#e2e8f0',fontWeight:700,fontSize:14}}>Holy Dash</span></div>
          <span style={{fontSize:13,color:'#64748b',marginLeft:'auto'}}>{PAGE_LABELS[page]}</span>
        </div>
        <div style={{flex:1}}>
          {page==='dashboard'&&<DashPage taxas={taxas} metaGoal={metaGoal} setMetaGoal={setMetaGoal} showToast={showToast}/>}
          {page==='produtos'&&<ProdutosPage showToast={showToast}/>}
          {page==='taxas'&&<TaxasPage taxas={taxas} setTaxas={setTaxas} showToast={showToast}/>}
          {page==='lancamentos'&&<LancamentosPage showToast={showToast}/>}
          {page==='integracoes'&&<IntegracoesPage showToast={showToast}/>}
          {page==='configuracoes'&&<ConfiguracoesPage user={user} store={store} metaGoal={metaGoal} setUser={setUser} setStore={setStore} setMetaGoal={setMetaGoal} showToast={showToast}/>}
        </div>
      </div>
    </div>
  )
}
