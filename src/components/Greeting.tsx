import { IconSettings } from '@tabler/icons-react'
import { useFinancas } from '../store/use-financas'

export function Greeting(){
  const {data,accountName,setTab}=useFinancas()
  const hour=new Date().getHours()
  const morning=hour<12
  const afternoon=hour>=12&&hour<18
  const greeting=morning?'Bom dia':afternoon?'Boa tarde':'Boa noite'
  const name=(accountName||data.perfil.nome||'').trim().split(/\s+/)[0]
  return <section className="flex items-center justify-between px-5 pb-4 pt-2">
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[1px] text-t3">{new Intl.DateTimeFormat('pt-BR',{weekday:'long',day:'2-digit',month:'long'}).format(new Date())}</p>
      <h1 className="mt-1 font-display text-[20px] font-extrabold tracking-[-.5px] text-t1">{greeting}{name?`, ${name}`:''}</h1>
    </div>
    <button onClick={()=>setTab('config')} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-surface/75 text-t2 backdrop-blur-xl transition active:scale-95">
      <IconSettings size={17} strokeWidth={1.8}/>
    </button>
  </section>
}
