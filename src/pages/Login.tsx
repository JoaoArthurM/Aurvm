import { useState } from 'react'
import { IconArrowRight, IconLoader2, IconShieldCheck } from '@tabler/icons-react'
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

function LoginAtmosphere(){
  return <div className="login-atmosphere" aria-hidden="true">
    <span className="login-atmosphere-halo login-atmosphere-halo-one" />
    <span className="login-atmosphere-halo login-atmosphere-halo-two" />
    <span className="login-atmosphere-ring login-atmosphere-ring-one" />
    <span className="login-atmosphere-streak login-atmosphere-streak-one" />
    <span className="login-atmosphere-streak login-atmosphere-streak-two" />
    <svg className="login-atmosphere-crystal" viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="login-crystal-frost" x1="20" y1="10" x2="45" y2="54" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" stopOpacity=".96" />
          <stop offset=".5" stopColor="#F5FCFF" stopOpacity=".72" />
          <stop offset="1" stopColor="#D8F1FC" stopOpacity=".4" />
        </linearGradient>
      </defs>
      <path d="M32 10 46 23.5 41.5 46 32 54 22.5 46 18 23.5 32 10Z" fill="url(#login-crystal-frost)" />
      <path d="M32 10 40.5 23.5 32 31.5 23.5 23.5 32 10Z" fill="#FFFFFF" fillOpacity=".42" />
      <path d="m18 23.5 14 8 14-8M32 31.5V54M23.5 23.5 32 31.5l8.5-8M22.5 46 32 31.5 41.5 46" stroke="#FFFFFF" strokeOpacity=".78" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M32 14.5v11M26.8 21.2l5.2 4.3 5.2-4.3" stroke="#FFFFFF" strokeOpacity=".58" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  </div>
}

export function Login(){
  const connect=useFinancas(s=>s.connect)
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState('')
  const signIn=async()=>{setLoading(true);setError('');try{await connect()}catch(cause){setError(cause instanceof Error?cause.message:'Não foi possível entrar com o Google.')}finally{setLoading(false)}}
  return <div className="page flex h-full flex-col bg-bg px-4 pb-6 pt-1">
    <div className="login-sunrise login-sunrise-shadow relative min-h-0 flex-1 overflow-hidden rounded-[30px] border border-border">
      <LoginAtmosphere/>
      <div className="absolute inset-x-5 bottom-5 flex items-center gap-2.5">
        <img src="/aurvm-icon.svg" alt="Ícone Aurvm" className="h-10 w-10 rounded-[12px] shadow-[0_7px_22px_rgba(17,17,22,.25)]"/>
        <span className="text-[11px] font-bold uppercase tracking-[2.5px] text-[#244C70]/80">Aurvm</span>
      </div>
    </div>
    <section className="px-2 pb-6 pt-6">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-accent">Gestão financeira pessoal</p>
      <h1 className="font-display text-[30px] font-semibold leading-[1.08] tracking-[-1.4px] text-t1">Sua vida financeira<br/>construída ao seu redor.</h1>
    </section>
    <button disabled={loading} onClick={signIn} className="flex w-full shrink-0 items-center justify-between rounded-[18px] border border-border bg-surface py-2 pl-4 pr-2 text-left shadow-[0_10px_28px_rgba(55,35,20,.06)] transition active:scale-[.98] disabled:opacity-50">
      <span className="flex items-center gap-2.5 text-[13px] font-semibold text-t1"><GoogleMark/><span>Continuar com <GoogleWord/></span></span>
      <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[13px] bg-accent/10 text-accent">{loading?<IconLoader2 size={18} className="animate-spin"/>:<IconArrowRight size={18}/>}</span>
    </button>
    {error&&<p role="alert" className="mt-3 rounded-[12px] border border-red/20 bg-red/[.06] px-3 py-2 text-center text-[9px] font-semibold text-red">{error}</p>}
    <p className="mt-3 flex items-center justify-center gap-1.5 text-[9px] text-t3"><IconShieldCheck size={12} className="shrink-0 text-accent"/>Backup local imediato + cópia no seu Google Drive</p>
  </div>
}
