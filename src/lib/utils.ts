import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Economia, FinancasData, FluxLancamento, FluxTipo } from './types'

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))
const brlFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 })
const moneyFormatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const brl = (value: number) => brlFormatter.format(Number.isFinite(value) ? value : 0)
export const money = (value: number) => moneyFormatter.format(Number.isFinite(value) ? value : 0)
export const shortBrl = brl
export const uid = () => crypto.randomUUID()
export const sum = (values: { valor: number }[]) => values.reduce((acc, item) => acc + Number(item.valor || 0), 0)
export const monthKey = (date: Date) => date.toISOString().slice(0, 7)
export const addMonths = (date: Date, count: number) => new Date(date.getFullYear(), date.getMonth() + count, 1)
export const monthLabel = (key: string, long = false) => {
  const [year, month] = key.split('-').map(Number)
  return new Intl.DateTimeFormat('pt-BR', { month: long ? 'long' : 'short', year: long ? 'numeric' : '2-digit' }).format(new Date(year, month - 1, 1)).replace('.', '')
}
export const monthTableLabel = (key: string) => {
  const [year, month] = key.split('-').map(Number)
  const label = new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(new Date(year, month - 1, 1)).replace('.', '')
  return `${label.charAt(0).toUpperCase()}${label.slice(1)}/${year}`
}
export const totals = (data: FinancasData) => {
  const entradas = sum(data.tabela.entradas)
  const fixos = sum(data.tabela.fixos)
  const variaveis = sum(data.tabela.variaveis)
  const assinaturas = sum(data.tabela.assinaturas)
  const gastos = fixos + variaveis + assinaturas
  return { entradas, fixos, variaveis, assinaturas, gastos, saldo: entradas - gastos - data.perfil.economia_mensal }
}

export type ProjectionPoint = { key: string; mes: string; entrou: number; acumulado: number; pontual: boolean; breakdown: { label: string; valor: number }[] }
export const projectSavings = (data: FinancasData, months = 24): ProjectionPoint[] => {
  let accumulated = data.perfil.saldo_inicial
  const now = new Date()
  return Array.from({ length: months }, (_, index) => {
    const key = monthKey(addMonths(now, index))
    const extras = data.economias.filter((item) => isEconomiaInMonth(item, key, index))
    const breakdown = [{ label: 'Economia mensal', valor: data.perfil.economia_mensal }, ...extras.map(({ label, valor }) => ({ label, valor }))]
    const entrou = breakdown.reduce((acc, item) => acc + item.valor, 0)
    accumulated += entrou
    return { key, mes: monthLabel(key), entrou, acumulado: accumulated, pontual: extras.some((item) => item.tipo === 'pontual'), breakdown }
  })
}

const isEconomiaInMonth = (item: Economia, key: string, index: number) => {
  if (item.tipo === 'recorrente') return true
  if (item.tipo === 'parcelado') return index < (item.vezes ?? 0)
  return item.mes === key
}

// Recorrência de lançamentos do Flux: repetem mensalmente no mesmo dia (limitado ao último dia do mês).
// diff em meses desde a data original; vezes = total de ocorrências, null = sem fim.
const monthDiff = (l: FluxLancamento, year: number, month: number) => {
  const [ly, lm] = l.data.split('-').map(Number)
  return (year - ly) * 12 + (month - lm)
}
export const ocorreNoMes = (l: FluxLancamento, key: string) => {
  const [y, m] = key.split('-').map(Number)
  const diff = monthDiff(l, y, m)
  if (l.repete?.excluidas?.some(date => date.startsWith(`${key}-`))) return false
  if (diff === 0) return true
  if (!l.repete || diff < 0) return false
  return l.repete.vezes == null || diff < l.repete.vezes
}
export const ocorreEm = (l: FluxLancamento, date: string) => {
  if (l.repete?.excluidas?.includes(date)) return false
  if (l.data === date) return true
  if (!l.repete) return false
  const [y, m, d] = date.split('-').map(Number)
  if (!ocorreNoMes(l, date.slice(0, 7)) || monthDiff(l, y, m) <= 0) return false
  const dia = Number(l.data.slice(8, 10))
  return d === Math.min(dia, new Date(y, m, 0).getDate())
}

export const fluxMeta: Record<FluxTipo, { label: string; icon: string; color: string }> = {
  entrada: { label: 'Entradas', icon: '↙', color: '#2E9E5B' },
  saida: { label: 'Saídas', icon: '↗', color: '#E14D4D' },
  diario: { label: 'Diários', icon: 'D', color: '#E8618C' },
  economia: { label: 'Economia', icon: 'E', color: '#2E9E5B' },
  cartao: { label: 'Cartão', icon: 'C', color: '#8A78B5' },
}

// Escala de temperatura da planilha de saldos — 7 faixas com as cores da planilha do usuário (Google Sheets).
// As cores são fixas; os 6 limites entre faixas são editáveis em flux.temperatura.limites (base: salário da pessoa).
export type TemperaturaLimites = number[]
export const tempTiers = [
  { label: 'Muito Negativo', bg: '#B7432D', fg: '#FFFFFF' },
  { label: 'Negativo', bg: '#F4CCCC', fg: '#A61C00' },
  { label: 'Cuidado', bg: '#FFF2CC', fg: '#B45F06' },
  { label: 'Muita Atenção', bg: '#FFF2CC', fg: '#E69138' },
  { label: 'Atenção', bg: '#FFE599', fg: '#7F6000' },
  { label: 'Saudável', bg: '#D9EAD3', fg: '#38761D' },
  { label: 'Muito Saudável', bg: '#38761D', fg: '#FFFFFF' },
] as const
export const defaultLimites: TemperaturaLimites = [-100, 0, 100, 300, 1000, 2000]
export const getLimites = (t?: { limites?: number[] }): TemperaturaLimites => Array.isArray(t?.limites) && t.limites.length === tempTiers.length - 1 ? t.limites : defaultLimites
export const saldoTier = (value: number, limites: TemperaturaLimites = defaultLimites) => { if (value <= limites[0]) return 0; let tier = 1; for (let i = 1; i < limites.length; i++) if (value >= limites[i]) tier = i + 1; return tier }
export const saldoStyle = (value: number, limites?: TemperaturaLimites) => { const tier = tempTiers[saldoTier(value, limites)]; return { background: tier.bg, color: tier.fg } }

// Paleta única das categorias de orçamento — aquecida para conviver com o laranja da marca (que é exclusivo de ações/navegação).
export const catColors = { entradas: '#2E9E5B', fixos: '#E14D4D', variaveis: '#EDA30D', assinaturas: '#8A78B5', economia: '#2E9E5B' } as const
