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
  today:    {fat:11534,bruto:12691,ped:126,ger:142,pend:16,ticket:91.54,cAp:68,cPend:1,bPago:0,bPend:0,pPago:58,pPend:15,hourly:[800,400,200,150,100,300,1200,2800,4200,5800,7200,8400,6800,7200,8000,9200,10400,9800,8600,7400,6200,4800,3200,1800],states:[{s:'SP',o:64,r:5824},{s:'RJ',o:23,r:2103},{s:'MG',o:17,r:1540},{s:'RS',o:11,r:980},{s:'PR',o:8,r:720}]},
  yesterday:{fat:9840,bruto:11200,ped:104,ger:121,pend:17,ticket:94.61,cAp:55,cPend:2,bPago:0,bPend:0,pPago:49,pPend:15,hourly:[400,200,100,80,60,200,900,2200,3800,5200,6400,7600,5800,6200,7000,8400,9200,8600,7800,6600,5400,4200,2800,1400],states:[{s:'SP',o:52,r:4920},{s:'RJ',o:19,r:1803},{s:'MG',o:14,r:1340},{s:'RS',o:9,r:780},{s:'PR',o:7,r:620}]},
  '7d':     {fat:78420,bruto:88500,ped:832,ger:950,pend:118,ticket:94.25,cAp:448,cPend:12,bPago:0,bPend:0,pPago:384,pPend:106,hourly:[5600,2800,1400,1050,700,2100,8400,19600,29400,40600,50400,58800,47600,50400,56000,64400,72800,68600,60200,51800,43400,33600,22400,12600],states:[{s:'SP',o:448,r:40780},{s:'RJ',o:161,r:14700},{s:'MG',o:119,r:10780},{s:'RS',o:77,r:6860},{s:'PR',o:56,r:5040}]},
  '30d':    {fat:336000,bruto:379200,ped:3570,ger:4080,pend:510,ticket:94.11,cAp:1920,cPend:52,bPago:0,bPend:0,pPago:1650,pPend:458,hourly:[24000,12000,6000,4500,3000,9000,36000,84000,126000,174000,216000,252000,204000,216000,240000,276000,312000,294000,258000,222000,186000,144000,96000,54000],states:[{s:'SP',o:1920,r:174720},{s:'RJ',o:693,r:63000},{s:'MG',o:513,r:46620},{s:'RS',o:330,r:30030},{s:'PR',o:242,r:22050}]},
  month:    {fat:198000,bruto:223400,ped:2100,ger:2400,pend:300,ticket:94.28,cAp:1130,cPend:31,bPago:0,bPend:0,pPago:970,pPend:269,hourly:[14000,7000,3500,2600,1750,5250,21000,49000,73500,101500,126000,147000,119000,126000,140000,161000,182000,171500,150500,129500,108500,84000,56000,31500],states:[{s:'SP',o:1130,r:102900},{s:'RJ',o:408,r:37100},{s:'MG',o:302,r:27440},{s:'RS',o:194,r:17640},{s:'PR',o:142,r:12950}]},
}
const CH: Record<Channel,{mult:number;label:string;icon:string}> = {
  ecom:{mult:1,label:'E-commerce',icon:'🛒'},
  ml:{mult:0.35,label:'Mercado Livre',icon:'🟡'},
  shopee:{mult:0.18,label:'Shopee',icon:'🧡'},
  geral:{mult:1.53,label:'Geral',icon:'📊'},
}
const DEF: Taxas = {checkout_pct:0.5,checkout_fixo:1500,gateway_pct:5,imposto_pct:16,imposto_meta_pct:13.65,frete_fixo:15,custo_produto:8,meta_ads:3352,google_ads:0}
const RANK=[{n:'🧴 Creme Anti-Age',s:'CAP-001',v:142,r:27974,l:9840,m:35.2},{n:'✨ Sérum Vitamina C',s:'SER-004',v:203,r:25781,l:11230,m:43.6},{n:'📦 Kit Emagrecimento',s:'KIT-003',v:67,r:19899,l:8120,m:40.8},{n:'💊 Suplemento Colágeno',s:'SUP-002',v:89,r:13261,l:5230,m:39.4}]
const PRODS=[{id:1,name:'Creme Anti-Age Premium',sku:'CAP-001',cost:28.5,price:197,img:'🧴'},{id:2,name:'Suplemento Colágeno 60 caps',sku:'SUP-002',cost:19.9,price:149,img:'💊'},{id:3,name:'Kit Emagrecimento 30 dias',sku:'KIT-003',cost:45,price:297,img:'📦'},{id:4,name:'Sérum Vitamina C',sku:'SER-004',cost:22,price:127,img:'✨'}]

const brl=(v:number)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v)
const num=(v:number)=>new Intl.NumberFormat('pt-BR').format(v)

function calc(fat:number,ped:number,t:Taxas){
  const tCo=fat*t.checkout_pct/100,tGw=fat*t.gateway_pct/100,tIm=fat*t.imposto_pct/100
  const tPr=ped*t.custo_produto,tFr=ped*t.frete_fixo,tMa=t.meta_ads,tGo=t.google_ads,tMi=tMa*t.imposto_meta_pct/100
  const total=tCo+tGw+tIm+tPr+tFr+tMa+tGo+tMi
  return {tCo,tGw,tIm,tPr,tFr,tMa,tGo,tMi,total,lucro:fat-total}
}
function getFake(f:string,ch:Channel):DashData{
  const b=FAKE[f]||FAKE.today,m=CH[ch].mult
  return {fat:Math.round(b.fat*m),bruto:Math.round(b.bruto*m),ped:Math.round(b.ped*m),ger:Math.round(b.ger*m),pend:Math.round(b.pend*m),ticket:b.ticket*(ch==='ml'?0.85:ch==='shopee'?0.75:1),cAp:Math.round(b.cAp*m),cPend:Math.round(b.cPend*m),bPago:Math.round(b.bPago*m),bPend:Math.round(b.bPend*m),pPago:Math.round(b.pPago*m),pPend:Math.round(b.pPend*m),hourly:b.hourly.map(v=>Math.round(v*m)),states:b.states.map(s=>({s:s.s,o:Math.round(s.o*m),r:Math.round(s.r*m)}))}
}
function normShopify(d:any):DashData{
  return {fat:d.faturamentoPago||0,bruto:d.faturamentoBruto||0,ped:d.pedidosPagos||0,ger:d.pedidosGerados||0,pend:d.pedidosPendentes||0,ticket:d.ticketMedio||0,cAp:d.cartaoAprovado||0,cPend:d.cartaoPendente||0,bPago:d.boletoPago||0,bPend:d.boletoPendente||0,pPago:d.pixPago||0,pPend:d.pixPendente||0,hourly:d.hourly||Array(24).fill(0),states:(d.states||[]).map((s:any)=>({s:s.state,o:s.orders,r:s.revenue}))}
}

const CSS=`
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0a0918;color:#e2e8f0;font-family:-apple-system,system-ui,sans-serif;min-height:100vh}
input,select{background:#0f0e17;color:#e2e8f0;border:1px solid #2d2d3d;border-radius:8px;padding:8px 12px;font-size:14px;outline:none;width:100%}
input:focus,select:focus{border-color:#6366f1}
button{cursor:pointer;font-family:inherit}
.kpi-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:14px}
@media(min-width:600px){.kpi-grid{grid-template-columns:repeat(3,1fr)}}
@media(min-width:900px){.kpi-grid{grid-template-columns:repeat(5,1fr)}}
.kpi{background:#141320;border:1px solid #1e1d2e;border-radius:14px;padding:14px 16px;position:relative;overflow:hidden}
.kpi::before{content:'';position:absolute;top:0;left:0;right:0;height:2px}
.kpi.c1::before{background:linear-gradient(90deg,#6366f1,transparent)}
.kpi.c2::before{background:linear-gradient(90deg,#34d399,transparent)}
.kpi.c3::before{background:linear-gradient(90deg,#a78bfa,transparent)}
.kpi.c4::before{background:linear-gradient(90deg,#fbbf24,transparent)}
.kpi.c5::before{background:linear-gradient(90deg,#f87171,transparent)}
.kpi-label{font-size:10px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:6px}
.kpi-val{font-size:20px;font-weight:700;color:#f1f5f9}
.kpi-sub{font-size:11px;color:#64748b;margin-top:3px}
.g3{display:grid;grid-template-columns:1fr;gap:12px;margin-bottom:14px}
@media(min-width:700px){.g3{grid-template-columns:1fr 1fr 1fr}}
.g2c{display:grid;grid-template-columns:1fr;gap:12px;margin-bottom:14px}
@media(min-width:700px){.g2c{grid-template-columns:2fr 1fr}}
.g2{display:grid;grid-template-columns:1fr;gap:12px;margin-bottom:14px}
@media(min-width:700px){.g2{grid-template-columns:1fr 1fr}}
.gb{display:grid;grid-template-columns:1fr;gap:12px}
@media(min-width:700px){.gb{grid-template-columns:1fr 2fr}}
.card{background:#141320;border:1px solid #1e1d2e;border-radius:14px;padding:16px 18px}
.ct{font-size:10px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px}
.row{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #1a1929;font-size:12px}
.row:last-child{border-bottom:none}
.rl{color:#94a3b8}.rv{font-weight:600;color:#e2e8f0}
.g{color:#34d399!important}.y{color:#fbbf24!important}.r{color:#f87171!important}
.ch-tab{padding:7px 16px;border-radius:10px;font-size:13px;font-weight:600;border:1px solid #2d2d3d;background:transparent;color:#64748b;display:flex;align-items:center;gap:6px}
.ch-tab.active{border:1.5px solid #6366f1;background:rgba(99,102,241,0.15);color:#a5b4fc}
.fb{padding:5px 12px;border-radius:20px;font-size:12px;border:1px solid #2d2d3d;background:transparent;color:#64748b}
.fb.active{border:1.5px solid #6366f1;background:rgba(99,102,241,0.15);color:#a5b4fc}
.hour-bars{display:flex;align-items:flex-end;gap:2px;height:80px}
.bar{flex:1;border-radius:2px 2px 0 0;min-height:3px}
.chart-labels{display:flex;justify-content:space-between;margin-top:6px;font-size:10px;color:#475569}
.progress-bar{height:6px;background:#1e1d2e;border-radius:3px;overflow:hidden;margin:8px 0}
.progress-fill{height:100%;background:linear-gradient(90deg,#4338ca,#7c3aed);border-radius:3px}
.state-row{display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid #1a1929}
.state-row:last-child{border-bottom:none}
.rank-table{width:100%;border-collapse:collapse;display:block;overflow-x:auto}
.rank-table th{font-size:11px;color:#475569;font-weight:600;text-align:left;padding:0 10px 8px 0;border-bottom:1px solid #1e1d2e;white-space:nowrap}
.rank-table td{padding:10px 10px 10px 0;border-bottom:1px solid #1a1929;font-size:12px;white-space:nowrap}
.rn{width:20px;height:20px;border-radius:4px;display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:700}
.mbadge{font-size:11px;font-weight:600;padding:2px 7px;border-radius:5px}
.taxas-grid{display:grid;grid-template-columns:1fr;gap:14px}
@media(min-width:600px){.taxas-grid{grid-template-columns:1fr 1fr}}
@media(min-width:900px){.taxas-grid{grid-template-columns:repeat(4,1fr)}}
.taxas-card{background:#141320;border:1px solid #1e1d2e;border-radius:14px;padding:20px}
.taxas-title{font-size:12px;font-weight:700;margin-bottom:16px;padding-bottom:10px;border-bottom:1px solid #1e1d2e}
.field{margin-bottom:14px}
.field label{font-size:11px;color:#64748b;font-weight:500;display:block;margin-bottom:5px}
.field-row{display:flex;align-items:center;gap:8px}
.field-row input{width:100px;flex-shrink:0}
.field-hint{font-size:10px;color:#475569;margin-top:3px;display:block}
.config-section{margin-bottom:20px}
.config-section h3{font-size:13px;font-weight:600;color:#a5b4fc;margin-bottom:14px;padding-bottom:8px;border-bottom:1px solid #1e1d2e}
.config-field{display:flex;flex-direction:column;gap:5px;margin-bottom:14px}
.config-field label{font-size:11px;color:#64748b}
.int-card{background:#141320;border:1px solid #1e1d2e;border-radius:14px;padding:18px;margin-bottom:12px}
.int-header{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.int-icon{width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0}
.int-info{flex:1}
.int-info h3{font-size:15px;font-weight:700;color:#f1f5f9}
.int-info p{font-size:12px;color:#64748b;margin-top:2px}
.status-badge{font-size:11px;padding:4px 12px;border-radius:20px;font-weight:600;white-space:nowrap}
.connected{background:rgba(52,211,153,0.15);color:#34d399}
.disconnected{background:rgba(248,113,113,0.15);color:#f87171}
.int-footer{margin-top:14px;padding-top:14px;border-top:1px solid #1e1d2e;display:flex;gap:10px;flex-wrap:wrap}
.btn-connect{padding:8px 18px;border-radius:10px;border:none;color:#fff;font-size:13px;font-weight:600}
.btn-disconnect{padding:8px 18px;border-radius:10px;background:transparent;border:1px solid #f87171;color:#f87171;font-size:13px;font-weight:600}
.lanc-table{width:100%;border-collapse:collapse}
.lanc-table th{font-size:11px;color:#475569;font-weight:600;text-align:left;padding:10px 14px;border-bottom:1px solid #1e1d2e;background:#0f0e17}
.lanc-table td{padding:11px 14px;border-bottom:1px solid #1a1929;font-size:13px}
.tipo-badge{font-size:11px;padding:3px 8px;border-radius:6px}
.prod-table{width:100%;border-collapse:collapse}
.prod-table th{font-size:11px;color:#475569;font-weight:600;text-align:left;padding:10px 14px;border-bottom:1px solid #1e1d2e;background:#0f0e17}
.prod-table td{padding:12px 14px;border-bottom:1px solid #1a1929}
.loading-state{text-align:center;padding:40px;color:#64748b;font-size:14px}
.spinner{display:inline-block;width:20px;height:20px;border:2px solid #2d2d3d;border-top-color:#6366f1;border-radius:50%;animation:spin 0.7s linear infinite;margin-right:8px;vertical-align:middle}
@keyframes spin{to{transform:rotate(360deg)}}
.toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(100px);background:#1e1d2e;border:1px solid #2d2d3d;border-radius:10px;padding:10px 20px;font-size:13px;color:#f1f5f9;z-index:200;transition:transform 0.3s ease;white-space:nowrap}
.toast.show{transform:translateX(-50%) translateY(0)}
.toast.success{border-color:#34d399;color:#34d399}
.hd-sidebar{width:220px;background:#0f0e17;border-right:1px solid #1e1d2e;display:flex;flex-direction:column;position:fixed;top:0;left:0;height:100vh;z-index:50;transform:translateX(-100%);transition:transform 0.25s ease}
.hd-sidebar.open{transform:translateX(0)}
.nav-item{display:flex;align-items:center;gap:10px;padding:10px 16px;color:#64748b;font-size:13px;border:none;border-left:3px solid transparent;background:transparent;width:100%;text-align:left;font-family:inherit}
.nav-item.active{color:#a5b4fc;background:rgba(99,102,241,0.15);border-left-color:#6366f1;font-weight:600}
.modal-ov{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:100;align-items:center;justify-content:center;padding:20px}
.modal-ov.show{display:flex}
`

function Logo({size=28,uid='a'}:{size?:number;uid?:string}){
  return(
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

function LoginPage({onLogin}:{onLogin:(nome:string)=>void}){
  const [email,setEmail]=useState(''),[senha,setSenha]=useState(''),[erro,setErro]=useState(''),[loading,setLoading]=useState(false),[showPass,setShowPass]=useState(false)
  const doLogin=async()=>{
    setLoading(true);setErro('')
    try{
      const res=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,senha})})
      const data=await res.json()
      if(data.success){localStorage.setItem('lucrodash_user',data.nome);onLogin(data.nome)}
      else setErro('Email ou senha incorretos')
    }catch{setErro('Erro de conexão')}
    setLoading(false)
  }
  const startDemo=()=>{localStorage.setItem('lucrodash_user','Lucas');onLogin('Lucas')}
  return(
    <div style={{minHeight:'100vh',background:'#0a0918',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{width:'100%',maxWidth:380}}>
        <div style={{textAlign:'center',marginBottom:28}}>
          <Logo size={56} uid="ln"/>
          <h1 style={{fontSize:22,fontWeight:700,color:'#f1f5f9',marginTop:12}}>Holy Dash</h1>
          <p style={{fontSize:13,color:'#64748b',marginTop:4}}>Ferramentas para quem constrói com propósito</p>
        </div>
        <div style={{background:'#141320',border:'1px solid #1e1d2e',borderRadius:16,padding:28}}>
          <div style={{marginBottom:16}}>
            <label style={{fontSize:12,color:'#64748b',display:'block',marginBottom:6}}>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com" onKeyDown={e=>e.key==='Enter'&&doLogin()} style={{padding:'10px 14px',borderRadius:10}}/>
          </div>
          <div style={{marginBottom:16}}>
            <label style={{fontSize:12,color:'#64748b',display:'block',marginBottom:6}}>Senha</label>
            <div style={{position:'relative'}}>
              <input type={showPass?'text':'password'} value={senha} onChange={e=>setSenha(e.target.value)} placeholder="••••••••" onKeyDown={e=>e.key==='Enter'&&doLogin()} style={{padding:'10px 44px 10px 14px',borderRadius:10}}/>
              <button onClick={()=>setShowPass(!showPass)} style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'transparent',border:'none',color:'#64748b',fontSize:16,padding:0}}>{showPass?'🙈':'👁️'}</button>
            </div>
          </div>
          {erro&&<div style={{fontSize:12,color:'#f87171',textAlign:'center',marginBottom:12}}>{erro}</div>}
          <button onClick={doLogin} disabled={loading} style={{width:'100%',padding:12,borderRadius:10,background:'linear-gradient(135deg,#4338ca,#7c3aed)',border:'none',color:'#fff',fontSize:14,fontWeight:700,marginBottom:8,opacity:loading?0.7:1}}>{loading?'Entrando...':'Entrar'}</button>
          <button onClick={startDemo} style={{width:'100%',padding:10,borderRadius:10,background:'transparent',border:'1px solid #2d2d3d',color:'#64748b',fontSize:13}}>Entrar sem senha (demo)</button>
        </div>
      </div>
    </div>
  )
}

function DashPage({taxas,metaGoal,setMetaGoal,store,showToast}:{taxas:Taxas;metaGoal:number;setMetaGoal:(v:number)=>void;store:string;showToast:(m:string)=>void}){
  const [filter,setFilter]=useState('today'),[channel,setChannel]=useState<Channel>('ecom')
  const [showCustom,setShowCustom]=useState(false),[customStart,setCustomStart]=useState(''),[customEnd,setCustomEnd]=useState('')
  const [data,setData]=useState<DashData|null>(null),[loading,setLoading]=useState(false),[error,setError]=useState('')
  const [showMetaModal,setShowMetaModal]=useState(false),[metaInput,setMetaInput]=useState(''),[rankSort,setRankSort]=useState(0)

  const load=(f:string,ch:Channel)=>{
    if(ch==='ecom'){
      setLoading(true);setError('')
      fetch(`/api/shopify/orders?filter=${f}`).then(r=>r.json()).then(d=>{setData(normShopify(d));setLoading(false)}).catch(e=>{setError(e.message);setLoading(false)})
    }else{
      setData(getFake(f,ch))
    }
  }
  useEffect(()=>{load(filter,channel)},[filter,channel])

  const d=data||FAKE.today
  const c=calc(d.fat,d.ped,taxas)
  const mg=d.fat>0?c.lucro/d.fat*100:0
  const pct=Math.min(d.fat/metaGoal*100,100)
  const proj=(d.fat/new Date().getDate())*new Date(new Date().getFullYear(),new Date().getMonth()+1,0).getDate()
  const cpa=d.ped>0?(taxas.meta_ads+taxas.google_ads)/d.ped:0
  const roas=(taxas.meta_ads+taxas.google_ads)>0?d.fat/(taxas.meta_ads+taxas.google_ads):0
  const maxH=Math.max(...d.hourly,1),nowH=new Date().getHours(),maxRev=d.states[0]?.r||1

  const doFilter=(f:string)=>{setFilter(f);setShowCustom(false)}
  const applyCustom=()=>{if(customStart&&customEnd)setFilter(`custom:${customStart}:${customEnd}`)}

  return(
    <div style={{padding:'18px 16px 60px'}}>
      {/* Meta Modal */}
      <div className={`modal-ov${showMetaModal?' show':''}`}>
        <div style={{background:'#141320',border:'1px solid #1e1d2e',borderRadius:16,padding:24,width:'100%',maxWidth:360}}>
          <h2 style={{fontSize:16,fontWeight:700,color:'#f1f5f9',marginBottom:6}}>🎯 Definir Meta do Mês</h2>
          <p style={{fontSize:12,color:'#64748b',marginBottom:16}}>Quanto você quer faturar este mês?</p>
          <input type="number" value={metaInput} onChange={e=>setMetaInput(e.target.value)} placeholder="Ex: 250000" style={{marginBottom:14}}/>
          <div style={{display:'flex',gap:10}}>
            <button onClick={()=>{const v=parseFloat(metaInput);if(v>0){setMetaGoal(v);setShowMetaModal(false);showToast('Meta atualizada!')}}} style={{flex:1,padding:10,borderRadius:10,background:'linear-gradient(135deg,#4338ca,#7c3aed)',border:'none',color:'#fff',fontSize:13,fontWeight:700}}>Salvar</button>
            <button onClick={()=>setShowMetaModal(false)} style={{padding:'10px 16px',borderRadius:10,background:'transparent',border:'1px solid #2d2d3d',color:'#64748b',fontSize:13}}>Cancelar</button>
          </div>
        </div>
      </div>

      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:18,flexWrap:'wrap' as const,gap:10}}>
        <div><h1 style={{fontSize:20,fontWeight:700,color:'#f1f5f9'}}>Dashboard</h1><p style={{fontSize:12,color:'#64748b',marginTop:3}}>{store} · Visão geral da operação</p></div>
        <div>
          <div style={{display:'flex',gap:5,flexWrap:'wrap' as const}}>
            {([['today','Hoje'],['yesterday','Ontem'],['7d','7 dias'],['30d','30 dias'],['month','Este mês']] as [string,string][]).map(([v,l])=>(
              <button key={v} onClick={()=>doFilter(v)} className={`fb${filter===v&&!showCustom?' active':''}`}>{l}</button>
            ))}
            <button onClick={()=>setShowCustom(!showCustom)} className={`fb${showCustom?' active':''}`}>📅 Período</button>
          </div>
          {showCustom&&(
            <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap' as const,marginTop:8}}>
              <input type="date" value={customStart} onChange={e=>setCustomStart(e.target.value)} style={{width:'auto',padding:'4px 8px',fontSize:12}}/>
              <span style={{color:'#64748b',fontSize:12}}>até</span>
              <input type="date" value={customEnd} onChange={e=>setCustomEnd(e.target.value)} style={{width:'auto',padding:'4px 8px',fontSize:12}}/>
              <button onClick={applyCustom} style={{padding:'5px 14px',borderRadius:20,fontSize:12,background:'linear-gradient(135deg,#4338ca,#7c3aed)',border:'none',color:'#fff'}}>Buscar</button>
            </div>
          )}
        </div>
      </div>

      {loading&&<div className="loading-state"><span className="spinner"/>Carregando dados...</div>}
      {error&&<div style={{textAlign:'center',padding:40,color:'#f87171',fontSize:13}}>❌ {error}</div>}

      {/* Channel tabs */}
      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap' as const}}>
        {(['ecom','ml','shopee','geral'] as Channel[]).map(ch=>(
          <button key={ch} onClick={()=>setChannel(ch)} className={`ch-tab${channel===ch?' active':''}`}>{CH[ch].icon} {CH[ch].label}</button>
        ))}
      </div>

      {!loading&&(
        <>
          {/* KPIs */}
          <div className="kpi-grid">
            <div className="kpi c1"><div className="kpi-label">Faturamento Pago</div><div className="kpi-val">{brl(d.fat)}</div><div className="kpi-sub">Bruto: {brl(d.bruto)}</div></div>
            <div className="kpi c2"><div className="kpi-label">Lucro Líquido</div><div className="kpi-val" style={{color:c.lucro>0?'#34d399':'#f87171'}}>{brl(c.lucro)}</div><div className="kpi-sub">Margem: {mg.toFixed(1)}%</div></div>
            <div className="kpi c3"><div className="kpi-label">Pedidos Pagos</div><div className="kpi-val">{num(d.ped)}</div><div className="kpi-sub">de {num(d.ger)} gerados</div></div>
            <div className="kpi c4"><div className="kpi-label">Ticket Médio</div><div className="kpi-val">{brl(d.ticket)}</div></div>
            <div className="kpi c5"><div className="kpi-label">Total Custos</div><div className="kpi-val" style={{color:'#f87171'}}>{brl(c.total)}</div></div>
            <div className="kpi c1"><div className="kpi-label">CPA</div><div className="kpi-val">{brl(cpa)}</div><div className="kpi-sub">Custo por pedido pago</div></div>
            <div className="kpi c2"><div className="kpi-label">ROAS</div><div className="kpi-val" style={{color:roas>=3?'#34d399':roas>=2?'#fbbf24':'#f87171'}}>{roas.toFixed(2)}x</div><div className="kpi-sub">Retorno sobre ads</div></div>
          </div>

          {/* Middle 3 cols */}
          <div className="g3">
            <div className="card">
              <div className="ct">Composição do Lucro</div>
              {([['Faturamento pago',d.fat,true],[`Taxa checkout (${taxas.checkout_pct}%)`,c.tCo,false],[`Taxa gateway (${taxas.gateway_pct}%)`,c.tGw,false],[`Impostos (${taxas.imposto_pct}%)`,c.tIm,false],[`Custo produto (${d.ped}x R$${taxas.custo_produto})`,c.tPr,false],[`Frete (${d.ped}x R$${taxas.frete_fixo})`,c.tFr,false],['Meta Ads',c.tMa,false],[`Imposto Meta (${taxas.imposto_meta_pct}%)`,c.tMi,false],['Google Ads',c.tGo,false]] as [string,number,boolean][]).map(([l,v,pos])=>(
                <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid #1a1929',fontSize:12}}>
                  <span style={{color:'#94a3b8'}}>{l}</span>
                  <span style={{fontWeight:600,color:pos?'#34d399':'#f87171'}}>{pos?'+':'-'} {brl(Math.abs(v))}</span>
                </div>
              ))}
              <div style={{display:'flex',justifyContent:'space-between',padding:'10px 0 4px',borderTop:'1px solid #2d2d3d',marginTop:6}}>
                <span style={{fontSize:13,fontWeight:700,color:'#f1f5f9'}}>Lucro líquido</span>
                <div style={{textAlign:'right'}}><div style={{fontSize:14,fontWeight:700,color:c.lucro>0?'#34d399':'#f87171'}}>{brl(c.lucro)}</div><div style={{fontSize:11,color:'#64748b'}}>Margem: {mg.toFixed(1)}%</div></div>
              </div>
            </div>
            <div className="card">
              <div className="ct">Pedidos</div>
              {([['Gerados',d.ger,''],['Pendentes',d.pend,''],['Cartão aprovado',d.cAp,'g'],['Cartão pendente',d.cPend,''],['Boleto pago',d.bPago,'g'],['Boleto pendente',d.bPend,''],['PIX pago',d.pPago,'g'],['PIX pendente',d.pPend,'']] as [string,number,string][]).map(([l,v,cl])=>(
                <div key={l} className="row"><span className="rl">{l}</span><span className={`rv ${cl}`}>{num(v)}</span></div>
              ))}
            </div>
            <div className="card">
              <div className="ct">Pedidos por Método</div>
              {([['Cartão aprovado',d.cAp,'y'],['PIX pago',d.pPago,'y'],['Boleto pago',d.bPago,'y'],['Cartão pendente',d.cPend,''],['Boleto pendente',d.bPend,''],['PIX pendente',d.pPend,'']] as [string,number,string][]).map(([l,v,cl])=>(
                <div key={l} className="row"><span className="rl">{l}</span><span className={`rv ${cl}`}>{num(v)}</span></div>
              ))}
            </div>
          </div>

          {/* Chart 2fr/1fr */}
          <div className="g2c">
            <div className="card">
              <div className="ct">Vendas por Hora</div>
              <div className="hour-bars">
                {d.hourly.map((v,i)=>(
                  <div key={i} className="bar" title={`${i}h: ${brl(v)}`} style={{height:`${Math.max(v/maxH*100,3)}%`,background:i===nowH?'#6366f1':`rgba(99,102,241,${(0.15+v/maxH*0.5).toFixed(2)})`}}/>
                ))}
              </div>
              <div className="chart-labels"><span>00h</span><span>12h</span><span>23h</span></div>
            </div>
            <div className="card">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                <span className="ct" style={{marginBottom:0}}>Meta do Mês</span>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:12,color:'#a5b4fc',fontWeight:600}}>{pct.toFixed(1)}%</span>
                  <button onClick={()=>{setMetaInput(String(metaGoal));setShowMetaModal(true)}} style={{background:'transparent',border:'1px solid #2d2d3d',borderRadius:6,color:'#64748b',fontSize:10,padding:'2px 7px'}}>Editar</button>
                </div>
              </div>
              <div style={{fontSize:20,fontWeight:700,color:'#f1f5f9'}}>{brl(d.fat)}</div>
              <div style={{fontSize:12,color:'#64748b',marginBottom:2}}>de {brl(metaGoal)}</div>
              <div className="progress-bar"><div className="progress-fill" style={{width:`${pct}%`}}/></div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:11}}>
                <div style={{color:'#64748b'}}>Projeção<div style={{fontSize:13,fontWeight:600,color:proj>=metaGoal?'#34d399':'#fbbf24'}}>{brl(proj)}</div></div>
                <div style={{textAlign:'right',color:'#64748b'}}>Faltam<div style={{fontSize:13,fontWeight:600,color:'#94a3b8'}}>{brl(metaGoal-d.fat)}</div></div>
              </div>
            </div>
          </div>

          {/* Bottom 1fr/2fr */}
          <div className="gb">
            <div className="card">
              <div className="ct">Vendas por Estado</div>
              {d.states.map((s,i)=>(
                <div key={i} className="state-row">
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <span style={{fontSize:12,fontWeight:700,color:'#a5b4fc',minWidth:28}}>{s.s}</span>
                    <div style={{height:3,width:`${s.r/maxRev*60}px`,background:'linear-gradient(90deg,#4338ca,#7c3aed)',borderRadius:2}}/>
                  </div>
                  <div style={{textAlign:'right'}}><div style={{fontSize:12,fontWeight:600,color:'#e2e8f0'}}>{brl(s.r)}</div><div style={{fontSize:10,color:'#64748b'}}>{s.o} pedidos</div></div>
                </div>
              ))}
            </div>
            <div className="card">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14,flexWrap:'wrap' as const,gap:8}}>
                <span className="ct" style={{marginBottom:0}}>Ranking de Produtos</span>
                <div style={{display:'flex',gap:4,flexWrap:'wrap' as const}}>
                  {['Fat.','Lucro','Qtd','Margem','CPA'].map((l,i)=>(
                    <button key={l} onClick={()=>setRankSort(i)} className="mbadge" style={{padding:'3px 9px',border:rankSort===i?'1px solid #6366f1':'1px solid #2d2d3d',background:rankSort===i?'rgba(99,102,241,0.2)':'transparent',color:rankSort===i?'#a5b4fc':'#64748b',borderRadius:6}}>{l}</button>
                  ))}
                </div>
              </div>
              <table className="rank-table">
                <thead><tr><th>#</th><th>Produto</th><th>Vendas</th><th>Faturamento</th><th>Lucro</th><th>Margem</th></tr></thead>
                <tbody>
                  {RANK.map((p,i)=>(
                    <tr key={i}>
                      <td><div className="rn" style={{background:i===0?'rgba(251,191,36,0.15)':'rgba(99,102,241,0.1)',color:i===0?'#fbbf24':'#6366f1'}}>{i+1}</div></td>
                      <td><div style={{fontSize:12,fontWeight:600,color:'#e2e8f0'}}>{p.n}</div><div style={{fontSize:10,color:'#475569',fontFamily:'monospace'}}>{p.s}</div></td>
                      <td style={{color:'#94a3b8'}}>{p.v}</td>
                      <td style={{fontWeight:600}}>{brl(p.r)}</td>
                      <td style={{color:'#34d399',fontWeight:700}}>{brl(p.l)}</td>
                      <td><span className="mbadge" style={{background:'rgba(52,211,153,0.15)',color:'#34d399'}}>{p.m}%</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function ProdutosPage({showToast}:{showToast:(m:string)=>void}){
  const [prods,setProds]=useState(PRODS.map(p=>({...p,editing:false,nc:''})))
  return(
    <div style={{padding:'18px 16px 60px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:18,flexWrap:'wrap' as const,gap:10}}>
        <div><h1 style={{fontSize:20,fontWeight:700,color:'#f1f5f9'}}>Produtos</h1><p style={{fontSize:12,color:'#64748b',marginTop:3}}>Gerencie custos por SKU</p></div>
        <button onClick={()=>showToast('Em breve: adicionar produto!')} style={{padding:'8px 18px',borderRadius:8,background:'linear-gradient(135deg,#4338ca,#7c3aed)',border:'none',color:'#fff',fontSize:13,fontWeight:600}}>+ Novo</button>
      </div>
      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <table className="prod-table">
          <thead><tr>{['Produto','SKU','Custo','Preço','Margem',''].map(h=><th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {prods.map(p=>{
              const m=(((p.price-p.cost)/p.price)*100).toFixed(1)
              return(
                <tr key={p.id}>
                  <td><div style={{display:'flex',alignItems:'center',gap:8}}><span style={{fontSize:18}}>{p.img}</span><span style={{fontSize:13,fontWeight:600,color:'#e2e8f0'}}>{p.name}</span></div></td>
                  <td style={{fontSize:11,color:'#6366f1',fontFamily:'monospace',fontWeight:600}}>{p.sku}</td>
                  <td>
                    {p.editing
                      ?<div style={{display:'flex',gap:6,alignItems:'center'}}>
                        <input value={p.nc} onChange={e=>setProds(ps=>ps.map(x=>x.id===p.id?{...x,nc:e.target.value}:x))} style={{width:80,padding:'4px 8px'}} autoFocus/>
                        <button onClick={()=>{setProds(ps=>ps.map(x=>x.id===p.id?{...x,cost:parseFloat(x.nc)||x.cost,editing:false}:x));showToast('Custo atualizado!')}} style={{padding:'4px 8px',borderRadius:6,background:'#4338ca',border:'none',color:'#fff',fontSize:12}}>✓</button>
                        <button onClick={()=>setProds(ps=>ps.map(x=>x.id===p.id?{...x,editing:false}:x))} style={{padding:'4px 8px',borderRadius:6,background:'transparent',border:'1px solid #2d2d3d',color:'#64748b',fontSize:12}}>✕</button>
                      </div>
                      :<span style={{fontSize:13,fontWeight:700,color:'#f87171'}}>{brl(p.cost)}</span>
                    }
                  </td>
                  <td style={{fontSize:13,fontWeight:600,color:'#34d399'}}>{brl(p.price)}</td>
                  <td><span className="mbadge" style={{background:parseFloat(m)>70?'rgba(52,211,153,0.15)':'rgba(251,191,36,0.15)',color:parseFloat(m)>70?'#34d399':'#fbbf24'}}>{m}%</span></td>
                  <td><button onClick={()=>setProds(ps=>ps.map(x=>x.id===p.id?{...x,editing:true,nc:String(x.cost)}:x))} style={{padding:'4px 10px',borderRadius:6,background:'transparent',border:'1px solid #2d2d3d',color:'#a5b4fc',fontSize:11}}>✎ Editar</button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TaxasPage({taxas,setTaxas,showToast}:{taxas:Taxas;setTaxas:(t:Taxas)=>void;showToast:(m:string)=>void}){
  const [t,setT]=useState(taxas),[saving,setSaving]=useState(false)
  const handleSave=async()=>{
    setSaving(true)
    await fetch('/api/taxas',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({checkout_pct:t.checkout_pct,checkout_fixo_mensal:t.checkout_fixo,gateway_pct:t.gateway_pct,imposto_pct:t.imposto_pct,imposto_meta_pct:t.imposto_meta_pct,frete_fixo:t.frete_fixo,custo_produto:t.custo_produto,meta_ads_hoje:t.meta_ads,google_ads_hoje:t.google_ads})})
    setTaxas(t);setSaving(false);showToast('Taxas salvas com sucesso!')
  }
  const tf=(label:string,k:keyof Taxas,suf:string,hint:string)=>(
    <div key={k} className="field">
      <label>{label}</label>
      <div className="field-row"><input type="number" step="0.01" value={t[k]} onChange={e=>setT(p=>({...p,[k]:parseFloat(e.target.value)||0}))}/><span style={{fontSize:12,color:'#64748b'}}>{suf}</span></div>
      <span className="field-hint">{hint}</span>
    </div>
  )
  return(
    <div style={{padding:'18px 16px 60px'}}>
      <div style={{marginBottom:18}}><h1 style={{fontSize:20,fontWeight:700,color:'#f1f5f9'}}>Taxas & Tarifas</h1><p style={{fontSize:12,color:'#64748b',marginTop:3}}>Configure tudo que impacta seu lucro</p></div>
      <div className="taxas-grid">
        <div className="taxas-card"><div className="taxas-title" style={{color:'#a5b4fc'}}>Taxas de Pagamento</div>{tf('Taxa checkout %','checkout_pct','%','Percentual por venda')}{tf('Checkout fixo mensal','checkout_fixo','R$','Mensalidade fixa')}{tf('Taxa gateway','gateway_pct','%','Sobre valor aprovado')}</div>
        <div className="taxas-card"><div className="taxas-title" style={{color:'#fbbf24'}}>Custos Fixos</div>{tf('Custo por produto','custo_produto','R$','Por unidade vendida')}{tf('Frete por pedido','frete_fixo','R$','Custo médio de envio')}</div>
        <div className="taxas-card"><div className="taxas-title" style={{color:'#f87171'}}>Impostos</div>{tf('Imposto s/ faturamento','imposto_pct','%','Sobre receita paga')}{tf('Imposto s/ Meta Ads','imposto_meta_pct','%','IOF + ISS sobre ads')}</div>
        <div className="taxas-card"><div className="taxas-title" style={{color:'#34d399'}}>Ads de Hoje</div>{tf('Meta Ads hoje','meta_ads','R$','Gasto do dia')}{tf('Google Ads hoje','google_ads','R$','Gasto do dia')}</div>
      </div>
      <div style={{textAlign:'right',marginTop:14}}>
        <button onClick={handleSave} disabled={saving} style={{padding:'9px 24px',borderRadius:10,fontSize:13,fontWeight:700,border:'none',background:'linear-gradient(135deg,#4338ca,#7c3aed)',color:'#fff',opacity:saving?0.7:1}}>{saving?'Salvando...':'Salvar Configurações'}</button>
      </div>
    </div>
  )
}

function LancamentosPage({showToast}:{showToast:(m:string)=>void}){
  const [entries,setEntries]=useState([{id:1,date:'2026-04-15',tipo:'Google Ads',valor:380,obs:'Campanha search'},{id:2,date:'2026-04-14',tipo:'Despesa Fixa',valor:500,obs:'Shopify'}])
  const [form,setForm]=useState({date:new Date().toISOString().split('T')[0],tipo:'Google Ads',valor:'',obs:''})
  const add=()=>{
    if(form.valor){setEntries(p=>[{...form,id:Date.now(),valor:parseFloat(form.valor)},...p]);setForm(p=>({...p,valor:'',obs:''}));showToast('Lançamento adicionado!')}
  }
  return(
    <div style={{padding:'18px 16px 60px'}}>
      <div style={{marginBottom:18}}><h1 style={{fontSize:20,fontWeight:700,color:'#f1f5f9'}}>Lançamentos Manuais</h1><p style={{fontSize:12,color:'#64748b',marginTop:3}}>Google Ads, despesas extras e outras entradas</p></div>
      <div className="card" style={{marginBottom:14}}>
        <div style={{display:'flex',gap:10,flexWrap:'wrap' as const,alignItems:'flex-end'}}>
          <div style={{display:'flex',flexDirection:'column' as const,gap:5}}><label style={{fontSize:11,color:'#64748b'}}>Data</label><input type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))} style={{width:150}}/></div>
          <div style={{display:'flex',flexDirection:'column' as const,gap:5}}><label style={{fontSize:11,color:'#64748b'}}>Tipo</label>
            <select value={form.tipo} onChange={e=>setForm(p=>({...p,tipo:e.target.value}))} style={{width:160}}>
              {['Google Ads','TikTok Ads','Despesa Fixa','Despesa Variável','Outro'].map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <div style={{display:'flex',flexDirection:'column' as const,gap:5}}><label style={{fontSize:11,color:'#64748b'}}>Valor (R$)</label><input type="number" placeholder="0,00" value={form.valor} onChange={e=>setForm(p=>({...p,valor:e.target.value}))} style={{width:120}}/></div>
          <div style={{display:'flex',flexDirection:'column' as const,gap:5,flex:1,minWidth:160}}><label style={{fontSize:11,color:'#64748b'}}>Observação</label><input placeholder="Opcional..." value={form.obs} onChange={e=>setForm(p=>({...p,obs:e.target.value}))}/></div>
          <button onClick={add} style={{padding:'9px 20px',borderRadius:8,background:'linear-gradient(135deg,#4338ca,#7c3aed)',border:'none',color:'#fff',fontSize:13,fontWeight:700}}>Adicionar</button>
        </div>
      </div>
      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <table className="lanc-table">
          <thead><tr><th>Data</th><th>Tipo</th><th>Valor</th><th>Observação</th><th></th></tr></thead>
          <tbody>
            {entries.map(e=>(
              <tr key={e.id}>
                <td style={{color:'#64748b'}}>{e.date}</td>
                <td><span className="tipo-badge" style={{background:e.tipo.includes('Ads')?'rgba(251,191,36,0.12)':'rgba(99,102,241,0.12)',color:e.tipo.includes('Ads')?'#fbbf24':'#a5b4fc'}}>{e.tipo}</span></td>
                <td style={{fontWeight:700,color:'#f87171'}}>{brl(e.valor)}</td>
                <td style={{color:'#64748b'}}>{e.obs||'—'}</td>
                <td><button onClick={()=>setEntries(p=>p.filter(x=>x.id!==e.id))} style={{padding:'3px 9px',borderRadius:6,background:'transparent',border:'1px solid #2d2d3d',color:'#f87171',fontSize:11}}>✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function IntegracoesPage({showToast}:{showToast:(m:string)=>void}){
  const [shopify,setShopify]=useState(true),[meta,setMeta]=useState(false),[ml,setMl]=useState(false),[shopee,setShopee]=useState(false),[google,setGoogle]=useState(false)
  const badge=(c:boolean)=><span className={`status-badge ${c?'connected':'disconnected'}`}>● {c?'Conectado':'Desconectado'}</span>
  const ic=(icon:string,bg:string,title:string,desc:string,conn:boolean,footer:React.ReactNode)=>(
    <div className="int-card">
      <div className="int-header">
        <div className="int-icon" style={{background:bg}}>{icon}</div>
        <div className="int-info"><h3>{title}</h3><p>{desc}</p></div>
        {badge(conn)}
      </div>
      <div className="int-footer">{footer}</div>
    </div>
  )
  return(
    <div style={{padding:'18px 16px 60px'}}>
      <div style={{marginBottom:18}}><h1 style={{fontSize:20,fontWeight:700,color:'#f1f5f9'}}>Integrações</h1><p style={{fontSize:12,color:'#64748b',marginTop:3}}>Conecte suas plataformas</p></div>
      {ic('🛒','rgba(149,191,71,0.15)','Shopify','Pedidos e faturamento em tempo real',shopify,
        shopify?<button className="btn-disconnect" onClick={()=>{setShopify(false);showToast('Shopify desconectada')}}>Desconectar</button>
               :<button className="btn-connect" style={{background:'linear-gradient(135deg,#4338ca,#7c3aed)'}} onClick={()=>{setShopify(true);showToast('Shopify conectada!')}}>Conectar com Shopify</button>
      )}
      {ic('📘','rgba(24,119,242,0.15)','Meta Ads','Gastos com anúncios automaticamente',meta,
        meta?<button className="btn-disconnect" onClick={()=>{setMeta(false);showToast('Meta Ads desconectado')}}>Desconectar</button>
            :<button className="btn-connect" style={{background:'linear-gradient(135deg,#1877f2,#0d5abf)'}} onClick={()=>window.location.href='/api/auth/meta'}>Conectar com Facebook</button>
      )}
      {ic('🟡','rgba(251,191,36,0.15)','Mercado Livre','Pedidos e faturamento do ML',ml,
        ml?<button className="btn-disconnect" onClick={()=>{setMl(false);showToast('Mercado Livre desconectado')}}>Desconectar</button>
          :<button className="btn-connect" style={{background:'linear-gradient(135deg,#f5a623,#e08e00)'}} onClick={()=>{setMl(true);showToast('Mercado Livre conectado!')}}>Conectar com Mercado Livre</button>
      )}
      {ic('🧡','rgba(249,115,22,0.15)','Shopee','Pedidos e faturamento da Shopee',shopee,
        shopee?<button className="btn-disconnect" onClick={()=>{setShopee(false);showToast('Shopee desconectada')}}>Desconectar</button>
              :<button className="btn-connect" style={{background:'linear-gradient(135deg,#f97316,#c2410c)'}} onClick={()=>{setShopee(true);showToast('Shopee conectada!')}}>Conectar com Shopee</button>
      )}
      {ic('🎯','rgba(251,191,36,0.15)','Google Ads','Gastos com anúncios automaticamente',google,
        google?<button className="btn-disconnect" onClick={()=>{setGoogle(false);showToast('Google Ads desconectado')}}>Desconectar</button>
              :<button className="btn-connect" style={{background:'linear-gradient(135deg,#ea4335,#c5221f)'}} onClick={()=>{setGoogle(true);showToast('Google Ads conectado!')}}>Conectar com Google Ads</button>
      )}
    </div>
  )
}

function ConfiguracoesPage({user,store,metaGoal,setUser,setStore,setMetaGoal,showToast}:{user:string;store:string;metaGoal:number;setUser:(v:string)=>void;setStore:(v:string)=>void;setMetaGoal:(v:number)=>void;showToast:(m:string)=>void}){
  const [cfg,setCfg]=useState({name:user,storeName:store,email:'lucas@pelospets.com.br',senha:'',meta:String(metaGoal),margem:'20',tz:'America/Sao_Paulo (Brasília)',currency:'BRL — Real Brasileiro'})
  const handleSave=()=>{setUser(cfg.name);setStore(cfg.storeName);const mv=parseFloat(cfg.meta);if(mv>0)setMetaGoal(mv);showToast('Configurações salvas!')}
  return(
    <div style={{padding:'18px 16px 60px'}}>
      <div style={{marginBottom:18}}><h1 style={{fontSize:20,fontWeight:700,color:'#f1f5f9'}}>Configurações</h1><p style={{fontSize:12,color:'#64748b',marginTop:3}}>Personalize sua conta</p></div>
      <div className="g2">
        <div className="card">
          <div className="config-section">
            <h3>🏪 Sua Loja</h3>
            <div className="config-field"><label>Nome da loja</label><input value={cfg.storeName} onChange={e=>setCfg(p=>({...p,storeName:e.target.value}))}/></div>
            <div className="config-field"><label>Domínio Shopify</label><input value="pelos-pets-9091.myshopify.com" readOnly style={{color:'#64748b'}}/></div>
          </div>
          <div className="config-section">
            <h3>👤 Sua Conta</h3>
            <div className="config-field"><label>Seu nome</label><input value={cfg.name} onChange={e=>setCfg(p=>({...p,name:e.target.value}))}/></div>
            <div className="config-field"><label>Email</label><input type="email" value={cfg.email} onChange={e=>setCfg(p=>({...p,email:e.target.value}))}/></div>
            <div className="config-field"><label>Nova senha</label><input type="password" value={cfg.senha} onChange={e=>setCfg(p=>({...p,senha:e.target.value}))} placeholder="Deixe em branco para manter"/></div>
          </div>
        </div>
        <div className="card">
          <div className="config-section">
            <h3>🎯 Metas</h3>
            <div className="config-field"><label>Meta de faturamento mensal (R$)</label><input type="number" value={cfg.meta} onChange={e=>setCfg(p=>({...p,meta:e.target.value}))}/></div>
            <div className="config-field"><label>Margem mínima desejada (%)</label><input type="number" value={cfg.margem} onChange={e=>setCfg(p=>({...p,margem:e.target.value}))}/></div>
          </div>
          <div className="config-section">
            <h3>🌍 Preferências</h3>
            <div className="config-field"><label>Fuso horário</label>
              <select value={cfg.tz} onChange={e=>setCfg(p=>({...p,tz:e.target.value}))}>
                <option>America/Sao_Paulo (Brasília)</option><option>America/Manaus (AM)</option><option>America/Fortaleza (CE/RN/PB)</option>
              </select>
            </div>
            <div className="config-field"><label>Moeda</label>
              <select value={cfg.currency} onChange={e=>setCfg(p=>({...p,currency:e.target.value}))}>
                <option>BRL — Real Brasileiro</option><option>USD — Dólar Americano</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      <div style={{textAlign:'right',marginTop:4}}>
        <button onClick={handleSave} style={{padding:'9px 24px',borderRadius:10,fontSize:13,fontWeight:700,border:'none',background:'linear-gradient(135deg,#4338ca,#7c3aed)',color:'#fff'}}>Salvar Configurações</button>
      </div>
    </div>
  )
}

const PAGE_NAMES:Record<Page,string>={dashboard:'Dashboard',produtos:'Produtos',taxas:'Taxas & Tarifas',lancamentos:'Lançamentos Manuais',integracoes:'Integrações',configuracoes:'Configurações'}
const NAV:[Page,string,string][]=[['dashboard','▣','Dashboard'],['produtos','◈','Produtos'],['taxas','%','Taxas & Tarifas'],['lancamentos','⊕','Lançamentos Manuais'],['integracoes','⇄','Integrações'],['configuracoes','◎','Configurações']]

export default function App(){
  const [page,setPage]=useState<Page>('dashboard')
  const [menuOpen,setMenuOpen]=useState(false)
  const [user,setUser]=useState<string|null>(null)
  const [store,setStore]=useState('Pelos Pets')
  const [checkingAuth,setCheckingAuth]=useState(true)
  const [taxas,setTaxas]=useState<Taxas>(DEF)
  const [metaGoal,setMetaGoal]=useState(250000)
  const [toast,setToast]=useState({msg:'',show:false})

  const showToast=(msg:string)=>{setToast({msg,show:true});setTimeout(()=>setToast(t=>({...t,show:false})),2500)}

  useEffect(()=>{
    const saved=localStorage.getItem('lucrodash_user')
    if(saved)setUser(saved)
    setCheckingAuth(false)
  },[])

  useEffect(()=>{
    if(!user)return
    fetch('/api/taxas').then(r=>r.json()).then(d=>{
      setTaxas({checkout_pct:d.checkout_pct??DEF.checkout_pct,checkout_fixo:d.checkout_fixo_mensal??DEF.checkout_fixo,gateway_pct:d.gateway_pct??DEF.gateway_pct,imposto_pct:d.imposto_pct??DEF.imposto_pct,imposto_meta_pct:d.imposto_meta_pct??DEF.imposto_meta_pct,frete_fixo:d.frete_fixo??DEF.frete_fixo,custo_produto:d.custo_produto??DEF.custo_produto,meta_ads:d.meta_ads_hoje??DEF.meta_ads,google_ads:d.google_ads_hoje??DEF.google_ads})
    }).catch(()=>{})
  },[user])

  const handleLogout=()=>{localStorage.removeItem('lucrodash_user');setUser(null)}
  const goPage=(p:Page)=>{setPage(p);setMenuOpen(false)}

  if(checkingAuth)return <div style={{minHeight:'100vh',background:'#0a0918'}}/>
  if(!user)return <LoginPage onLogin={setUser}/>

  return(
    <div style={{background:'#0a0918',color:'#e2e8f0',fontFamily:'-apple-system,system-ui,sans-serif',minHeight:'100vh'}}>
      <style>{CSS}</style>

      {/* Toast */}
      <div className={`toast${toast.show?' show success':''}`}>✓ {toast.msg}</div>

      {/* Overlay */}
      {menuOpen&&<div onClick={()=>setMenuOpen(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:40}}/>}

      {/* Sidebar */}
      <div className={`hd-sidebar${menuOpen?' open':''}`}>
        <div style={{padding:'18px 16px',borderBottom:'1px solid #1e1d2e',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}><Logo size={28} uid="sb"/><span style={{color:'#f1f5f9',fontWeight:700,fontSize:15}}>Holy Dash</span></div>
          <button onClick={()=>setMenuOpen(false)} style={{background:'transparent',border:'none',color:'#64748b',fontSize:18,padding:4}}>✕</button>
        </div>
        <nav style={{flex:1,padding:'10px 0',overflowY:'auto' as const}}>
          {NAV.map(([p,icon,label])=>(
            <button key={p} onClick={()=>goPage(p)} className={`nav-item${page===p?' active':''}`}>
              <span style={{display:'inline-block',width:16,textAlign:'center' as const,fontSize:14}}>{icon}</span>{label}
            </button>
          ))}
        </nav>
        <div style={{padding:'14px 16px',borderTop:'1px solid #1e1d2e'}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
            <div style={{width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,#4338ca,#7c3aed)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:'#fff',fontWeight:700,flexShrink:0}}>{user[0].toUpperCase()}</div>
            <div><div style={{color:'#e2e8f0',fontSize:12,fontWeight:600}}>{user}</div><div style={{color:'#64748b',fontSize:11}}>{store}</div></div>
          </div>
          <button onClick={handleLogout} style={{width:'100%',padding:6,borderRadius:8,background:'transparent',border:'1px solid #2d2d3d',color:'#f87171',fontSize:11}}>Sair</button>
        </div>
      </div>

      {/* Main */}
      <div style={{display:'flex',flexDirection:'column' as const,minHeight:'100vh'}}>
        <div style={{position:'sticky',top:0,zIndex:30,background:'#0f0e17',borderBottom:'1px solid #1e1d2e',padding:'12px 16px',display:'flex',alignItems:'center',gap:12}}>
          <button onClick={()=>setMenuOpen(true)} style={{background:'transparent',border:'none',color:'#a5b4fc',fontSize:22,lineHeight:1,padding:4}}>☰</button>
          <div style={{display:'flex',alignItems:'center',gap:8}}><Logo size={22} uid="tb"/><span style={{color:'#e2e8f0',fontWeight:700,fontSize:14}}>Holy Dash</span></div>
          <span style={{fontSize:13,color:'#64748b',marginLeft:'auto'}}>{PAGE_NAMES[page]}</span>
        </div>
        <div style={{flex:1}}>
          {page==='dashboard'&&<DashPage taxas={taxas} metaGoal={metaGoal} setMetaGoal={setMetaGoal} store={store} showToast={showToast}/>}
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
