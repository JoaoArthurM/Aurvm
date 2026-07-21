import type { FinancasData } from './types'

export const seedData: FinancasData = {
  version: 1,
  perfil: { nome: '', saldo_inicial: 0, economia_mensal: 0, valor_diario: 0 },
  tabela: { entradas: [], fixos: [], variaveis: [], assinaturas: [] },
  economias: [],
  emprestimos: { pessoas: [] },
  flux: {
    saldo_inicial: 0,
    valor_diario_planejado: 0,
    cartoes: [],
    temperatura: { limites: [-100, 0, 100, 300, 1000, 2000] },
    tags: [],
    lancamentos: [],
  },
  config: {
    tema: 'light',
    moeda: 'BRL',
    lembrete_mensal: true,
    tela_inicial: 'inicio',
    preferencias: { valores_ocultos: false, dashboard_assinaturas: 'grid', flux_aba: 'saldos', flux_filtro: 'total', flux_tags_ordenacao: 'valor', economia_ordenacao: 'valor' },
    navegacao: [
      { id:'inicio', visivel:true }, { id:'tabela', visivel:true }, { id:'economia', visivel:true },
      { id:'emprestimos', visivel:true }, { id:'flux', visivel:true }, { id:'config', visivel:true },
    ],
  },
}
