import { useState } from 'react'
import NumberFlow from '@number-flow/react'
import { IconChartBubble, IconLayoutGrid } from '@tabler/icons-react'
import { useFinancas } from '../store/use-financas'
import { brl, catColors, money, sum, totals } from '../lib/utils'
import { useSelic } from '../hooks/use-selic'
import { SubscriptionLogo } from '../components/SubscriptionLogo'
import { Greeting } from '../components/Greeting'
import { Currency, useAnimatedValue } from '../components/Currency'
import { SunriseHero } from '../components/SunriseHero'

function BrlStyled({value,numClass,symClass}:{value:number;numClass?:string;symClass?:string}){
  const hidden=useFinancas(s=>s.valuesHidden)
  const display=useAnimatedValue(value,hidden)
  const str=brl(value)
  const idx=str.search(/\s/)
  const sym=idx>-1?str.slice(0,idx):'R$'
  return <><span className={`font-extrabold opacity-50 ${symClass??''}`}>{sym}&nbsp;</span>{hidden?<span className={`tracking-[.1em] ${numClass??''}`}>••••</span>:<NumberFlow value={display} locales="pt-BR" format={{minimumFractionDigits:2,maximumFractionDigits:2}} className={numClass}/>}</>
}

function SvgCurrency({value,suffix}:{value:number;suffix?:string}){const hidden=useFinancas(s=>s.valuesHidden);return <><tspan fontSize=".7em" fontWeight="700" fillOpacity=".52">R$</tspan><tspan> {hidden?'••••':money(value)}{suffix}</tspan></>}

export function Dashboard(){
 const data=useFinancas(s=>s.data);const t=totals(data)
 return <div className="pb-4">
  <Greeting/>
  <HeroCard saldo={t.saldo} entradas={t.entradas} gastos={t.gastos} fontes={data.tabela.entradas.length}/>
  <DonutCard fixos={t.fixos} variaveis={t.variaveis} assinaturas={t.assinaturas} economia={data.perfil.economia_mensal} saldo={t.saldo}/>
  <SankeyCard data={data}/>
  <EconomyScale income={t.entradas} current={t.saldo}/>
  <Subscriptions/>
 </div>
}

function HeroCard({saldo,entradas,gastos,fontes}:{saldo:number;entradas:number;gastos:number;fontes:number}){
 const selic=useSelic()
 const selicValue=selic.isLoading?'···':selic.isError?'N/D':`${selic.data?.toFixed(2).replace('.',',')}%`
 const kpis=[
  {label:'Taxa Selic',value:selicValue,raw:null,sub:'a.a. · via BCB API',color:'text-accent'},
  {label:'Entradas',value:null,raw:entradas,sub:`${fontes} fontes`,color:'text-green'},
  {label:'Total gastos',value:null,raw:gastos,sub:`${entradas?(gastos/entradas*100).toFixed(1).replace('.',','):0}% da renda`,color:'text-red'},
 ]
 return <SunriseHero
  label="Saldo líquido"
  value={<BrlStyled value={saldo} symClass="text-[24px] text-[#5B382D]" numClass="text-[44px]"/>}
  caption={<><Currency value={entradas}/> entradas <span>–</span> <Currency value={gastos}/> gastos</>}
  kpis={kpis.map(({label,value,raw,sub,color})=>({label,sub,className:color,value:raw!=null?<BrlStyled value={raw} numClass="text-[13px]" symClass="text-[10px] opacity-55"/>:value}))}
 />
}

function DonutCard({fixos,variaveis,assinaturas,economia,saldo}:{fixos:number;variaveis:number;assinaturas:number;economia:number;saldo:number}){const s=Math.max(saldo,0);const e=Math.max(economia,0);const pieTotal=fixos+variaveis+assinaturas+e||1;const legTotal=pieTotal+s||1;const a=fixos/pieTotal*100,b=a+variaveis/pieTotal*100,c=b+assinaturas/pieTotal*100;const gastos=[['Fixos',fixos,catColors.fixos],['Variáveis',variaveis,catColors.variaveis],['Assinaturas',assinaturas,catColors.assinaturas],['Economia',e,catColors.economia]];return <section className="card-glow mx-4 mb-[10px] rounded-2xl border border-border bg-surface p-4"><p className="mb-3 flex items-center text-[10px] font-bold uppercase tracking-[1px] text-t3"><i className="mark-diamond"/>Distribuição dos gastos</p><div className="flex items-center gap-4"><div className="relative h-[108px] w-[108px] shrink-0 rounded-full" style={{background:`conic-gradient(${catColors.fixos} 0 ${a}%,${catColors.variaveis} ${a}% ${b}%,${catColors.assinaturas} ${b}% ${c}%,${catColors.economia} ${c}% 100%)`}}><div className="absolute inset-[22px] rounded-full bg-surface"/></div><div className="min-w-0 flex-1">{gastos.map(([label,value,color])=><div key={String(label)} className="mb-2 flex items-center gap-2"><i className="h-2 w-2 shrink-0 rounded-full" style={{background:String(color)}}/><span className="flex-1 text-xs text-t2">{label}</span><b className="number flex items-baseline gap-1 text-xs" style={{color:String(color)}}><BrlStyled value={Number(value)} numClass="text-xs" symClass="text-[10px] opacity-55"/><span className="opacity-25">|</span><small className="text-[10px] font-normal text-t3">{Math.round(Number(value)/legTotal*100)}%</small></b></div>)}<div className="mt-2 border-t border-border pt-2"><div className="flex items-center gap-2"><i className="h-2 w-2 shrink-0 rounded-full bg-t3"/><span className="flex-1 text-xs font-semibold text-t3">Saldo</span><b className="number flex items-baseline gap-1 text-xs text-t3"><BrlStyled value={s} numClass="text-xs text-t3" symClass="text-[10px] text-t3/60"/><span className="opacity-25">|</span><small className="text-[10px] font-semibold text-t3">100%</small></b></div></div></div></div></section>}

function SankeyCard({data}:{data:ReturnType<typeof useFinancas.getState>['data']}){const t=totals(data);const sources=data.tabela.entradas;const sourceTotal=Math.max(t.entradas,1);const economia=Math.max(data.perfil.economia_mensal,0);const flows=[['Fixos',t.fixos,catColors.fixos],['Variáveis',t.variaveis,catColors.variaveis],['Assinaturas',t.assinaturas,catColors.assinaturas],['Economia',economia,catColors.economia]];const H=240;const srcH=flows.reduce((s,[,v])=>s+Number(v)/sourceTotal*H,0);const svgH=18+flows.reduce((acc,[,v])=>acc+Math.max(8,Number(v)/sourceTotal*H)+5,0)-5+8;let dy=18,ldy=0;return <section className="card-glow mx-4 mb-[10px] overflow-hidden rounded-2xl border border-border bg-surface px-3 pb-3 pt-[14px]"><p className="mb-[10px] flex items-center text-[10px] font-bold uppercase tracking-[1px] text-t3"><i className="mark-diamond"/>Fluxo · Entradas e Saídas</p><svg viewBox={`0 0 340 ${svgH}`} className="w-full"><g><rect x="60" y="18" width="14" height={srcH} rx="3" fill={catColors.entradas}/><text x="57" y={18+srcH/2-5} textAnchor="end" fontSize="10" fill="#6F6761" fontWeight="700">Entradas</text><text x="57" y={18+srcH/2+9} textAnchor="end" fontSize="9" fill={catColors.entradas}><SvgCurrency value={t.entradas}/></text></g>{flows.map(([label,value,color])=>{const num=Number(value);const lh=num/sourceTotal*H;const rh=Math.max(8,lh);const ly=18+ldy;const ry=dy;ldy+=lh;dy+=rh+5;return <g key={String(label)}><path d={`M74,${ly} C120,${ly} 212,${ry} 268,${ry} L268,${ry+rh} C212,${ry+rh} 120,${ly+lh} 74,${ly+lh} Z`} fill={String(color)} opacity=".22"/><rect x="268" y={ry} width="14" height={rh} rx="2" fill={String(color)}/><text x="284" y={ry+rh/2-2} fontSize="10" fill={String(color)} fontWeight="700">{label}</text><text x="284" y={ry+rh/2+10} fontSize="9" fill={String(color)}><SvgCurrency value={num}/></text></g>})}</svg></section>}

function EconomyScale({income,current}:{income:number;current:number}){
  const targets=[20,25,30]
  const pct=income?current/income*100:0
  const goal=income*.3
  const remaining=Math.max(0,goal-current)
  const progress=Math.max(0,Math.min(100,pct/30*100))
  const tone=pct<20?'#B65C5C':pct<25?'#B88624':'#238A5B'

  return <section className="card-glow mx-4 mb-[10px] overflow-hidden rounded-[22px] border border-border bg-surface">
    <div className="flex items-center px-4 pb-3 pt-4">
      <div><h2 className="flex items-center font-sans text-[10px] font-bold uppercase tracking-[1px] text-t3"><i className="mark-diamond"/>Escala de economia</h2><p className="mt-0.5 text-[11px] text-t3">Metas calculadas sobre a sua renda</p></div>
      <span className="ml-auto flex items-baseline gap-1 font-mono text-[9px] text-t3">base <Currency value={income}/></span>
    </div>

    <div className="grid grid-cols-3 gap-2 px-3 pb-3">
      {targets.map((target,index)=>{
        const value=income*target/100
        const achieved=current>=value
        const color=['#6E927A','#4D8064','#238A5B'][index]
        return <div key={target} className="rounded-[14px] border bg-el/55 px-2 py-3 text-center" style={{borderColor:achieved?color:'var(--border)'}}>
          <div className="mx-auto mb-2 grid h-7 w-7 place-items-center rounded-full text-[9px] font-bold" style={{color,background:`${color}16`}}>{index+1}</div>
          <p className="number text-[19px] font-bold tracking-[-.8px]" style={{color}}>{target}%</p>
          <Currency value={value} className="mt-1 font-mono text-[9px] font-bold text-t2"/>
          <p className="mt-1 flex items-baseline justify-center gap-1 truncate text-[8px]" style={{color:achieved?color:'var(--t3)'}}>{achieved?'Meta atingida':<>faltam <Currency value={value-current}/></>}</p>
        </div>
      })}
    </div>

    <div className="mx-3 mb-3 rounded-[16px] border border-border bg-bg/55 p-3.5">
      <div className="flex items-start justify-between">
        <div><p className="text-[9px] font-bold uppercase tracking-[.12em] text-t3">Situação atual</p><p className="number mt-1 text-[31px] font-bold leading-none tracking-[-1.5px]" style={{color:tone}}>{pct.toFixed(1).replace('.',',')}%</p></div>
        <div className="text-right"><Currency value={current} className="text-[18px] font-bold" style={{color:tone}}/><p className="mt-1 text-[8px] text-t3">disponível neste ciclo</p></div>
      </div>
      <div className="relative mt-4 h-2 rounded-full bg-el">
        <div className="h-full rounded-full transition-all" style={{width:`${progress}%`,background:tone}}/>
        {[20,25,30].map(mark=><i key={mark} className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-surface" style={{left:`${mark/30*100}%`}}/>)}
      </div>
      <div className="mt-2 flex justify-between text-[8px] text-t3"><span>0%</span><span>meta principal · 30%</span></div>
      <p className="mt-3 flex items-baseline gap-1 text-[10px] font-semibold" style={{color:tone}}>{pct>=30?'Todas as metas foram alcançadas':<>Faltam <Currency value={remaining}/> para alcançar 30%</>}</p>
    </div>
  </section>
}

function Subscriptions(){
  const items=useFinancas(s=>s.data.tabela.assinaturas)
  const [mode,setMode]=useState<'grid'|'bubble'>('grid')
  const total=sum(items)
  const colors=['#8B5CF6','#F43F5E','#10B981','#3B82F6']
  const summaries=[['Total/mês',total],['Trimestral',total*3],['Anual',total*12]] as const

  return <section className="card-glow mx-4 mb-3 rounded-[22px] border border-border bg-surface p-3">
    <div className="flex items-start justify-between px-1 pb-3 pt-1">
      <div><p className="flex items-center text-[10px] font-bold uppercase tracking-[1px] text-t3"><i className="mark-diamond"/>Assinaturas</p><p className="mt-0.5 text-[11px] text-t3">Distribuição dos serviços ativos</p></div>
      <span className="rounded-full bg-el px-2.5 py-1 font-mono text-[9px] font-bold text-t2">{items.length} ativas</span>
    </div>

    <div className="mb-3 flex rounded-[12px] bg-el p-[3px] text-[10px] font-semibold">
      <button onClick={()=>setMode('grid')} className={`flex h-8 flex-1 items-center justify-center gap-1.5 rounded-[9px] transition ${mode==='grid'?'bg-surface text-accent shadow-[0_2px_7px_rgba(45,31,23,.09)]':'text-t3'}`}><IconLayoutGrid size={14}/>Grade</button>
      <button onClick={()=>setMode('bubble')} className={`flex h-8 flex-1 items-center justify-center gap-1.5 rounded-[9px] transition ${mode==='bubble'?'bg-surface text-accent shadow-[0_2px_7px_rgba(45,31,23,.09)]':'text-t3'}`}><IconChartBubble size={14}/>Bolhas</button>
    </div>

    <div className="overflow-hidden rounded-[16px] bg-el/45">{mode==='grid'?<Treemap items={items} colors={colors}/>:<Bubbles items={items} colors={colors}/>}</div>

    <div className="mt-3 grid grid-cols-3 gap-2">{summaries.map(([label,value],index)=><div key={label} className="min-w-0 rounded-[13px] bg-el/60 px-2.5 py-3"><p className="truncate text-[8px] font-bold uppercase tracking-[.6px] text-t3">{label}</p><Currency value={value} className={`mt-1 text-[13px] font-bold ${index===2?'text-accent':'text-t1'}`}/></div>)}</div>
  </section>
}

function Treemap({items,colors}:{items:{id:string;label:string;valor:number;logo?:{icon:string;file:string}|null}[];colors:string[]}){
  const sorted=[...items].sort((a,b)=>b.valor-a.valor)
  const total=sum(sorted)||1
  const first=sorted[0]
  const primaryWidth=first?Math.max(150,Math.min(205,320*(first.valor/total))):160
  const secondary=sorted.slice(1)
  const secondaryTotal=sum(secondary)||1
  const rightWidth=320-primaryWidth
  const canvasHeight=Math.max(240,secondary.length*64+12)
  const minimumCell=58
  const flexibleHeight=Math.max(0,canvasHeight-secondary.length*minimumCell)
  const heights=secondary.map(item=>minimumCell+flexibleHeight*(item.valor/secondaryTotal))
  return <svg viewBox={`0 0 320 ${canvasHeight}`} className="block w-full">
    <defs><clipPath id="subscriptions-treemap"><rect width="320" height={canvasHeight} rx="16"/></clipPath></defs>
    <g clipPath="url(#subscriptions-treemap)">
      <rect width={primaryWidth} height={canvasHeight} fill={colors[0]}/>
      {first&&<><foreignObject x={primaryWidth/2-21} y={canvasHeight/2-52} width="42" height="42"><SubscriptionLogo item={first} size={42} frosted/></foreignObject><text x={primaryWidth/2} y={canvasHeight/2+13} textAnchor="middle" fill="white" fontSize="12" fontWeight="700">{first.label}</text><text x={primaryWidth/2} y={canvasHeight/2+30} textAnchor="middle" fill="white" fillOpacity=".8" fontSize="9"><SvgCurrency value={first.valor} suffix={` · ${Math.round(first.valor/total*100)}%`}/></text></>}
      {secondary.map((item,index)=>{const y=heights.slice(0,index).reduce((acc,height)=>acc+height,0);const height=heights[index];const centerX=primaryWidth+rightWidth/2;const iconSize=height>=78?28:24;return <g key={item.id}><rect x={primaryWidth} y={y} width={rightWidth} height={height} fill={colors[(index+1)%colors.length]} stroke="rgba(255,255,255,.34)" strokeWidth="1.5"/><foreignObject x={centerX-iconSize/2} y={y+height/2-25} width={iconSize} height={iconSize}><SubscriptionLogo item={item} size={iconSize} frosted/></foreignObject><text x={centerX} y={y+height/2+12} textAnchor="middle" fill="white" fontSize="9" fontWeight="700">{item.label}</text><text x={centerX} y={y+height/2+24} textAnchor="middle" fill="white" fillOpacity=".76" fontSize="7.5"><SvgCurrency value={item.valor} suffix={` · ${Math.round(item.valor/total*100)}%`}/></text></g>})}
    </g>
  </svg>
}

function Bubbles({items,colors}:{items:{id:string;label:string;valor:number;logo?:{icon:string;file:string}|null}[];colors:string[]}){
  const sorted=[...items].sort((a,b)=>b.valor-a.valor)
  const max=Math.max(...sorted.map(item=>item.valor),1)
  const radii=sorted.map(item=>28+Math.sqrt(item.valor/max)*26)
  const tangent=(base:{x:number;y:number},distance:number,degrees:number)=>{const radians=degrees*Math.PI/180;return{x:base.x+Math.cos(radians)*distance,y:base.y+Math.sin(radians)*distance}}
  const positions:{x:number;y:number}[]=[{x:102,y:132}]
  if(radii[1])positions[1]=tangent(positions[0],radii[0]+radii[1],-32)
  if(radii[2])positions[2]=tangent(positions[0],radii[0]+radii[2],50)
  if(radii[3])positions[3]=tangent(positions[1],radii[1]+radii[3],50)
  for(let index=4;index<radii.length;index++)positions[index]=tangent(positions[index-2],radii[index-2]+radii[index],index%2?35:-35)

  return <svg viewBox="0 0 320 270" className="block w-full">{sorted.map((item,index)=>{
    const radius=radii[index]
    const {x,y}=positions[index]
    const iconSize=Math.max(18,Math.min(30,radius*.52))
    return <g key={item.id}>
      <circle cx={x} cy={y} r={radius} fill={colors[index%colors.length]} stroke="rgba(255,255,255,.42)" strokeWidth="1"/>
      <foreignObject x={x-iconSize/2} y={y-radius*.52} width={iconSize} height={iconSize}><SubscriptionLogo item={item} size={iconSize} frosted/></foreignObject>
      <text x={x} y={y+radius*.27} textAnchor="middle" fill="white" fontSize={radius<40?8:9} fontWeight="700">{item.label}</text>
      <text x={x} y={y+radius*.52} textAnchor="middle" fill="white" fillOpacity=".78" fontSize="7.5"><SvgCurrency value={item.valor}/></text>
    </g>
  })}</svg>
}
