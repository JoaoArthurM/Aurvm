import { useState } from 'react'
import { IconArrowRight, IconLoader2 } from '@tabler/icons-react'
import { useFinancas } from '../store/use-financas'

function GoogleMark(){
  return <svg aria-hidden="true" viewBox="0 0 48 48" className="h-[18px] w-[18px] shrink-0">
    <path fill="#FFC107" d="M43.61 20H42V20H24v8h11.3A12 12 0 0 1 12 24a12 12 0 0 1 19.38-9.47l5.66-5.66A20 20 0 0 0 4 24a20 20 0 0 0 39.61 4.77A19.7 19.7 0 0 0 44 24c0-1.36-.14-2.68-.39-4Z"/>
    <path fill="#FF3D00" d="m6.31 14.69 6.57 4.82A12 12 0 0 1 24 12c2.87 0 5.5 1.02 7.38 2.69l5.66-5.66A19.9 19.9 0 0 0 24 4 20 20 0 0 0 6.31 14.69Z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 9.86-1.99 13.41-5.23l-6.15-5.2A11.9 11.9 0 0 1 12.92 28.5l-6.52 5.02A20 20 0 0 0 24 44Z"/>
    <path fill="#1976D2" d="M43.61 20H24v8h11.3a12.1 12.1 0 0 1-4.04 5.57l6.15 5.2C37 39.14 44 34 44 24c0-1.36-.14-2.68-.39-4Z"/>
  </svg>
}

function GoogleWord(){
  return <span aria-label="Google" className="font-display font-semibold tracking-[-.35px]"><span className="text-[#4285F4]">G</span><span className="text-[#EA4335]">o</span><span className="text-[#FBBC05]">o</span><span className="text-[#4285F4]">g</span><span className="text-[#34A853]">l</span><span className="text-[#EA4335]">e</span></span>
}

function LoginTexture(){
  const rows=18
  const columns=13
  return <div className="login-dots" aria-hidden="true">{Array.from({length:rows},(_,row)=>{
    const progress=row/(rows-1)
    const size=18.5-(progress*16)
    return <div className="login-dot-row" key={row} style={{top:`${row*5.1}%`,opacity:.4-(progress*.2)}}>{Array.from({length:columns},(_,column)=><i key={column} style={{width:`${size}px`,height:`${size}px`,borderRadius:`${Math.max(1.2,size*.2)}px`}}/>)}</div>
  })}</div>
}

export function Login(){
  const loginDemo=useFinancas(s=>s.loginDemo)
  const [loading,setLoading]=useState(false)
  const signIn=async()=>{setLoading(true);await new Promise(resolve=>setTimeout(resolve,450));loginDemo()}
  return <div className="login-screen relative min-h-full overflow-hidden text-[#111116]"><LoginTexture/><div className="login-ambient"/><section className="absolute inset-x-0 bottom-[150px] z-10 px-6"><div className="mb-4 flex items-center gap-2.5"><span className="text-[14px] font-bold uppercase tracking-[2.5px] text-black/55">Aurvm</span><span className="app-mark-ring"><img src="/aurvm-icon.svg" alt="Ícone Aurvm" className="h-10 w-10 rounded-[12px] shadow-[0_7px_22px_rgba(17,17,22,.2)]"/></span></div><h1 className="max-w-[335px] text-[39px] font-medium leading-[1.08] tracking-[-2.4px] text-[#111116]">Sua vida financeira<br/>construída ao seu redor.</h1></section><button disabled={loading} onClick={signIn} className="login-cta group absolute inset-x-6 bottom-8 z-20 flex items-center justify-between border-t border-black/10 pt-5 text-left disabled:opacity-50"><span><b className="flex items-center gap-2 text-[14px] font-semibold"><GoogleMark/><span>Continuar com <GoogleWord/></span></b><small className="mt-1 block pl-[26px] text-[10px] text-black/35">Entrar no aplicativo</small></span><span className="login-arrow">{loading?<IconLoader2 size={19} className="animate-spin"/>:<IconArrowRight size={20}/>}</span></button></div>
}
