export type Item = { id: string; label: string; valor: number; emoji?: string | null; lembrete?: { data: string; observacao: string } | null }
export type Economia = { id: string; label: string; valor: number; tipo: 'recorrente' | 'parcelado' | 'pontual'; vezes: number | null; mes: string | null }
export type LancamentoPessoa = { id: string; data: string; motivo: string; valor: number; pago: boolean; lembrete?: { data: string; observacao: string } | null }
export type Pessoa = { id: string; nome: string; cor: string; lancamentos: LancamentoPessoa[] }
export type Tag = { id: string; label: string; cor: string; oculta?: boolean }
export type FluxTipo = 'entrada' | 'saida' | 'diario' | 'economia' | 'cartao'
// repete: recorrência mensal a partir de `data` — vezes = total de ocorrências (incluindo a primeira); null = sem definição (repete para sempre).
export type FluxLancamento = { id: string; data: string; tipo: FluxTipo; valor: number; descricao: string; tag_id: string | null; tag_ids?: string[]; repete?: { vezes: number | null; excluidas?: string[] } | null }
export type Cartao = { id: string; nome: string; fechamento: number; vencimento: number }
export type Tab = 'inicio' | 'tabela' | 'economia' | 'emprestimos' | 'flux' | 'config'
export type NavigationPreference = { id: Tab; visivel: boolean }
export type AppPreferences = {
  valores_ocultos?: boolean
  dashboard_assinaturas?: 'grid' | 'bubble'
  flux_aba?: 'saldos' | 'totais' | 'tags' | 'menu'
  flux_filtro?: 'total' | FluxTipo
  flux_tags_ordenacao?: 'valor' | 'nome'
}

export interface FinancasData {
  version: 1
  perfil: { nome?: string; saldo_inicial: number; economia_mensal: number; valor_diario: number }
  tabela: { entradas: Item[]; fixos: Item[]; variaveis: Item[]; assinaturas: Item[] }
  economias: Economia[]
  emprestimos: { pessoas: Pessoa[] }
  flux: { saldo_inicial?: number; valor_diario_planejado: number; tags: Tag[]; lancamentos: FluxLancamento[]; cartoes?: Cartao[]; temperatura?: { limites: number[] } }
  config: { tema: 'dark' | 'light'; moeda: 'BRL'; lembrete_mensal: boolean; navegacao?: NavigationPreference[]; tela_inicial?: Tab; preferencias?: AppPreferences }
}
