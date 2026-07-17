import type { NavigationPreference, Tab } from './types'

export const defaultNavigation: NavigationPreference[] = [
  { id:'inicio', visivel:true },
  { id:'tabela', visivel:true },
  { id:'economia', visivel:true },
  { id:'emprestimos', visivel:true },
  { id:'flux', visivel:true },
  { id:'config', visivel:true },
]

export const navigationLabels: Record<Tab,string> = {
  inicio:'Início', tabela:'Tabela', economia:'Economia', emprestimos:'Empréstimos', flux:'Flux', config:'Configurações',
}
