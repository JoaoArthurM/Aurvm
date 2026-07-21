import { useEffect } from 'react'
import { IconLayoutDashboard, IconPigMoney, IconReportMoney, IconSettings2, IconTableColumn, IconUserDollar } from '@tabler/icons-react'
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
import { syncSystemBars } from './services/system-bars'

const nav: { id: Tab; label: string; icon: typeof IconLayoutDashboard }[] = [
  { id: 'inicio', label: 'Início', icon: IconLayoutDashboard }, { id: 'tabela', label: 'Tabela', icon: IconReportMoney },
  { id: 'economia', label: 'Economia', icon: IconPigMoney }, { id: 'emprestimos', label: 'Emprést.', icon: IconUserDollar },
  { id: 'flux', label: 'Flux', icon: IconTableColumn }, { id: 'config', label: 'Config.', icon: IconSettings2 },
]

export default function App() {
  const { tab, setTab } = useFinancas()
  const theme = useFinancas(s => s.data.config.tema)
  const navigation = useFinancas(s => s.data.config.navegacao)
  const signedIn = useFinancas(s => s.signedIn)
  const restore = useFinancas(s => s.restore)
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='dark'?'#0C0C10':'#F7F4F1')
    syncSystemBars(theme)
  }, [theme])
  useEffect(() => { void restore() }, [restore])
  const loginVisible = !signedIn
  const preferences = navigation ?? defaultNavigation
  const visibleNav = preferences.map(item=>nav.find(entry=>entry.id===item.id)).filter((item):item is (typeof nav)[number]=>Boolean(item)).filter(item=>item.id!=='config'&&preferences.find(pref=>pref.id===item.id)?.visivel!==false)
  const pages: Record<Tab, JSX.Element> = { inicio: <Dashboard />, tabela: <Tabela />, economia: <EconomiaPage />, emprestimos: <Emprestimos />, flux: <Flux />, config: loginVisible ? <Login /> : <Config /> }
  return <main className={cn('app-shell relative mx-auto h-[100dvh] w-full max-w-[390px] overflow-hidden bg-bg',loginVisible&&'login-shell')}>
    <div className={cn('app-scroll w-full overflow-x-hidden overflow-y-auto',tab==='flux'&&'flux-scroll')}>{pages[tab]}</div>
    {!loginVisible&&<nav className="bottom-nav absolute z-40 flex px-2 pt-[9px]" style={{left:'50%',right:'auto',width:`min(calc(100% - 24px), ${24+visibleNav.length*57}px)`,transform:'translateX(-50%)'}}>
      {visibleNav.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setTab(id)} className="relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-[14px] border border-transparent py-1 text-[9px] font-semibold text-t3 transition duration-200 active:scale-95">
        <Icon size={18} strokeWidth={2} className={cn('transition-colors',tab===id&&(id==='flux'?'text-flux':'text-accent'))}/><span>{label}</span>
      </button>)}
    </nav>}
  </main>
}
