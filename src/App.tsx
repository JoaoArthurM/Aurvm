import { useEffect } from 'react'
import { IconCurrencyDollar as DollarSign, IconHome as Home, IconDots as MoreHorizontal, IconTable as Table2, IconUsers as Users, IconBolt as Zap } from '@tabler/icons-react'
import { useFinancas } from './store/use-financas'
import type { Tab } from './lib/types'
import { Dashboard } from './pages/Dashboard'
import { Tabela } from './pages/Tabela'
import { EconomiaPage } from './pages/Economia'
import { Emprestimos } from './pages/Emprestimos'
import { Flux } from './pages/Flux'
import { Config } from './pages/Config'
import { Login } from './pages/Login'
import { cn } from './lib/utils'
import { defaultNavigation } from './lib/navigation'

const nav: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: 'inicio', label: 'Início', icon: Home }, { id: 'tabela', label: 'Tabela', icon: Table2 },
  { id: 'economia', label: 'Economia', icon: DollarSign }, { id: 'emprestimos', label: 'Emprést.', icon: Users },
  { id: 'flux', label: 'Flux', icon: Zap }, { id: 'config', label: 'Config.', icon: MoreHorizontal },
]

export default function App() {
  const { tab, setTab } = useFinancas()
  const theme = useFinancas(s => s.data.config.tema)
  const navigation = useFinancas(s => s.data.config.navegacao)
  const signedIn = useFinancas(s => s.signedIn)
  const restore = useFinancas(s => s.restore)
  useEffect(() => { document.documentElement.dataset.theme = theme }, [theme])
  useEffect(() => { void restore() }, [restore])
  const loginVisible = !signedIn
  const preferences = navigation ?? defaultNavigation
  const visibleNav = preferences.map(item=>nav.find(entry=>entry.id===item.id)).filter((item):item is (typeof nav)[number]=>Boolean(item)).filter(item=>item.id!=='config'&&preferences.find(pref=>pref.id===item.id)?.visivel!==false)
  const pages: Record<Tab, JSX.Element> = { inicio: <Dashboard />, tabela: <Tabela />, economia: <EconomiaPage />, emprestimos: <Emprestimos />, flux: <Flux />, config: loginVisible ? <Login /> : <Config /> }
  return <main className={cn('app-shell relative mx-auto h-[100dvh] w-full max-w-[390px] overflow-hidden bg-bg',loginVisible&&'login-shell')}>
    <span className="punch-hole" />
    {!loginVisible&&<BrandAura />}
    <StatusBar />
    <div className="app-scroll relative z-10 w-full overflow-x-hidden overflow-y-auto">{pages[tab]}</div>
    {!loginVisible&&<div className="pointer-events-none absolute bottom-0 left-0 right-0 z-30 h-[120px]" style={{background:'linear-gradient(to top, var(--bg) 0%, rgba(0,0,0,0) 100%)'}}/>}
    {!loginVisible&&<nav className="bottom-nav absolute z-40 flex px-2 pt-[9px]" style={{left:'50%',right:'auto',width:`min(calc(100% - 24px), ${24+visibleNav.length*57}px)`,transform:'translateX(-50%)'}}>
      {visibleNav.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setTab(id)} className={cn('relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-[14px] py-1 text-[9px] font-semibold transition duration-200 active:scale-95', tab === id ? (id === 'flux' ? 'bg-flux/10 text-flux' : 'bg-accent/10 text-accent') : 'text-t3')}>
        <Icon size={18} strokeWidth={2} /><span>{label}</span>
      </button>)}
    </nav>}
  </main>
}

function BrandAura() {
  const rows = 7
  const columns = 13
  return <div className="app-aura" aria-hidden="true">
    <div className="app-aura-dots">
      {Array.from({ length: rows }, (_, row) => {
        const progress = row / (rows - 1)
        const size = 16 - progress * 11
        return <div className="login-dot-row" key={row} style={{ top: `${row * 12}%`, opacity: 0.5 - progress * 0.32 }}>
          {Array.from({ length: columns }, (_, column) => <i key={column} style={{ width: `${size}px`, height: `${size}px`, borderRadius: `${Math.max(1, size * 0.2)}px` }} />)}
        </div>
      })}
    </div>
  </div>
}

function StatusBar() {
  return <div className="status-bar"><span>9:41</span><span className="flex items-center gap-[5px]"><span className="flex h-[10px] items-end gap-px"><i className="h-[7px] w-[3px] rounded-[1px] bg-t2"/><i className="h-[8px] w-[3px] rounded-[1px] bg-t2"/><i className="h-[9px] w-[3px] rounded-[1px] bg-t2"/><i className="h-[10px] w-[3px] rounded-[1px] bg-t1"/></span><span className="relative h-[11px] w-[20px] rounded-[3px] border border-t2"><i className="absolute inset-[1px] right-[3px] rounded-[2px] bg-t1"/></span></span></div>
}
