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
import { catColors } from './lib/utils'
import { defaultNavigation } from './lib/navigation'
import { syncSystemBars } from './services/system-bars'

const nav: { id: Tab; label: string; icon: typeof IconLayoutDashboard }[] = [
  { id: 'inicio', label: 'Início', icon: IconLayoutDashboard }, { id: 'tabela', label: 'Tabela', icon: IconReportMoney },
  { id: 'economia', label: 'Economia', icon: IconPigMoney }, { id: 'emprestimos', label: 'Emprést.', icon: IconUserDollar },
  { id: 'flux', label: 'Flux', icon: IconTableColumn }, { id: 'config', label: 'Config.', icon: IconSettings2 },
]
const activeNavColor = (id: Tab) => id === 'economia' ? catColors.economia : id === 'emprestimos' ? 'oklch(0.60 0.12 5)' : id === 'flux' ? 'var(--flux-orange)' : 'var(--accent)'

export default function App() {
  const { tab, setTab } = useFinancas()
  const theme = useFinancas(s => s.data.config.tema)
  const navigation = useFinancas(s => s.data.config.navegacao)
  const signedIn = useFinancas(s => s.signedIn)
  const restore = useFinancas(s => s.restore)
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='dark'?'#0e1a28':'#f4f7fa')
    syncSystemBars(theme)
  }, [theme])
  useEffect(() => { void restore() }, [restore])
  const loginRequired = import.meta.env.VITE_REQUIRE_GOOGLE_LOGIN === 'true'
  const loginVisible = loginRequired && !signedIn
  const preferences = navigation ?? defaultNavigation
  const visibleNav = preferences.map(item=>nav.find(entry=>entry.id===item.id)).filter((item):item is (typeof nav)[number]=>Boolean(item)).filter(item=>item.id!=='config'&&preferences.find(pref=>pref.id===item.id)?.visivel!==false)
  const pages: Record<Tab, JSX.Element> = { inicio: <Dashboard />, tabela: <Tabela />, economia: <EconomiaPage />, emprestimos: <Emprestimos />, flux: <Flux />, config: loginVisible ? <Login /> : <Config /> }
  return <main className={cn('app-shell relative mx-auto h-[100dvh] w-full max-w-[390px] overflow-hidden bg-bg',loginVisible&&'login-shell')}>
    <div className={cn('app-scroll w-full overflow-x-hidden overflow-y-auto',tab==='flux'&&'flux-scroll')}>{pages[tab]}</div>
    {!loginVisible&&<nav className="bottom-nav absolute z-40 flex items-center px-2 py-[7px]" style={{left:'50%',right:'auto',width:`min(calc(100% - 24px), ${24+visibleNav.length*57}px)`,transform:'translateX(-50%)'}}>
      {visibleNav.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setTab(id)} className={cn('relative flex h-[46px] min-w-0 flex-1 flex-col items-center justify-center gap-1 self-center rounded-[14px] border text-[9px] font-semibold transition duration-200 active:scale-95', tab===id?'border-border/40 shadow-[0_1px_5px_rgba(15,37,64,.09)]':'border-transparent text-t3')} style={tab===id?{color:activeNavColor(id),background:'var(--surface)'}:undefined}>
        <Icon size={18} strokeWidth={2}/><span>{label}</span>
      </button>)}
    </nav>}
  </main>
}
