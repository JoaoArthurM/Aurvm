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
export const localISO = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
export const monthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
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
    // A projeção representa os próximos meses; o mês em andamento não entra na tabela nem no acumulado.
    const key = monthKey(addMonths(now, index + 1))
    const extras = data.economias.flatMap((item) => {
      const occurrences = economiaOccurrencesInMonth(item, key, index)
      return occurrences > 0 ? [{ ...item, valor: item.valor * occurrences }] : []
    })
    const breakdown = [{ label: 'Economia mensal', valor: data.perfil.economia_mensal }, ...extras.map(({ label, valor }) => ({ label, valor }))]
    const entrou = breakdown.reduce((acc, item) => acc + item.valor, 0)
    accumulated += entrou
    return { key, mes: monthLabel(key), entrou, acumulado: accumulated, pontual: extras.some((item) => item.tipo === 'pontual'), breakdown }
  })
}

const daysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate()
const economiaOccurrencesInMonth = (item: Economia, key: string, index: number) => {
  const [year, month] = key.split('-').map(Number)
  if (item.tipo === 'pontual' || item.frequencia === 'nenhuma') return item.mes === key ? 1 : 0
  if (item.tipo === 'parcelado') return index < (item.vezes ?? 0) ? 1 : 0
  if (item.vezes != null && index >= item.vezes) return 0
  const frequency = item.frequencia ?? 'mensal'
  if (frequency === 'diaria') return daysInMonth(year, month)
  if (frequency === 'semanal') return Math.ceil(daysInMonth(year, month) / 7)
  return 1
}

const isEconomiaInMonth = (item: Economia, key: string, index: number) => economiaOccurrencesInMonth(item, key, index) > 0

export const quintoDiaUtil=(d:Date)=>{const total=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();let uteis=0;for(let day=1;day<=total;day++){const wd=new Date(d.getFullYear(),d.getMonth(),day).getDay();if(wd!==0){uteis++;if(uteis===5)return day}}return 0}
const monthDiff = (l: FluxLancamento, year: number, month: number) => {
  const [ly, lm] = l.data.split('-').map(Number)
  return (year - ly) * 12 + (month - lm)
}
const dayDiff = (from: string, to: string) => {
  const [fromYear, fromMonth, fromDay] = from.split('-').map(Number)
  const [toYear, toMonth, toDay] = to.split('-').map(Number)
  return Math.round((Date.UTC(toYear, toMonth - 1, toDay) - Date.UTC(fromYear, fromMonth - 1, fromDay)) / 86400000)
}
export const recurrenceOccurrenceIndex = (l: FluxLancamento, date: string) => {
  if (date === l.data) return 0
  const frequency = l.repete?.frequencia ?? 'mensal'
  if (frequency === 'diaria') return dayDiff(l.data, date)
  if (frequency === 'semanal') {
    const days = dayDiff(l.data, date)
    return days >= 0 && days % 7 === 0 ? days / 7 : -1
  }
  const [year, month] = date.split('-').map(Number)
  return monthDiff(l, year, month)
}
const ocorreNaData = (l: FluxLancamento, date: string) => {
  if (l.repete?.excluidas?.includes(date)) return false
  const [y, m, d] = date.split('-').map(Number)
  const month = `${y}-${String(m).padStart(2, '0')}`
  const cardAdjustment = l.tipo === 'cartao' ? l.cartao?.ajustes?.[month] : undefined
  if (cardAdjustment) {
    if (!l.repete) return l.data.slice(0, 7) === month && cardAdjustment === date
    const index = recurrenceOccurrenceIndex(l, date)
    if (index < 0 || (l.repete.vezes != null && index >= l.repete.vezes)) return false
    return cardAdjustment === date
  }
  if (l.data === date) return true
  if (!l.repete) return false
  const index = recurrenceOccurrenceIndex(l, date)
  if (index <= 0 || (l.repete.vezes != null && index >= l.repete.vezes)) return false
  if (l.repete.frequencia === 'diaria' || l.repete.frequencia === 'semanal') return true
  const dia = Number(l.data.slice(8, 10))
  const esperado = l.repete.regra === 'quinto_util' ? quintoDiaUtil(new Date(y,m-1,1)) : Math.min(dia, new Date(y, m, 0).getDate())
  return d === esperado
}
export const ocorreEm = (l: FluxLancamento, date: string) => ocorreNaData(l, date)
export const ocorreNoMes = (l: FluxLancamento, key: string) => {
  const [year, month] = key.split('-').map(Number)
  return Array.from({ length: daysInMonth(year, month) }, (_, index) => `${key}-${String(index + 1).padStart(2, '0')}`).some(date => ocorreNaData(l, date))
}

export const fluxMeta: Record<FluxTipo, { label: string; icon: string; color: string }> = {
  entrada: { label: 'Entradas', icon: '↙', color: 'oklch(0.66 0.10 165)' },
  saida: { label: 'Saídas', icon: '↗', color: 'oklch(0.64 0.12 30)' },
  diario: { label: 'Diários', icon: 'D', color: 'oklch(0.65 0.11 305)' },
  economia: { label: 'Economia', icon: 'E', color: 'oklch(0.73 0.09 195)' },
  cartao: { label: 'Cartão', icon: 'C', color: 'oklch(0.58 0.10 280)' },
}

// Escala de temperatura da planilha de saldos — 7 faixas com as cores da planilha do usuário (Google Sheets).
// As cores são fixas; os 6 limites entre faixas são editáveis em flux.temperatura.limites (base: salário da pessoa).
export type TemperaturaLimites = number[]
export const tempTiers = [
  { label: 'Muito Negativo', bg: '#B84530', fg: '#FFFFFF' },
  { label: 'Negativo', bg: '#F5CCCC', fg: '#A7200A' },
  { label: 'Cuidado', bg: '#FEF3CD', fg: '#C04A2A' },
  { label: 'Muita Atenção', bg: '#FEF3CD', fg: '#E6943E' },
  { label: 'Atenção', bg: '#FDE79C', fg: '#7E620B' },
  { label: 'Saudável', bg: '#D8EBD3', fg: '#307721' },
  { label: 'Muito Saudável', bg: '#307721', fg: '#FFFFFF' },
] as const
export const defaultLimites: TemperaturaLimites = [-100, 0, 100, 300, 1000, 2000]
export const getLimites = (t?: { limites?: number[] }): TemperaturaLimites => Array.isArray(t?.limites) && t.limites.length === tempTiers.length - 1 ? t.limites : defaultLimites
export const saldoTier = (value: number, limites: TemperaturaLimites = defaultLimites) => { if (value <= limites[0]) return 0; let tier = 1; for (let i = 1; i < limites.length; i++) if (value >= limites[i]) tier = i + 1; return tier }
export const saldoStyle = (value: number, limites?: TemperaturaLimites) => { const tier = tempTiers[saldoTier(value, limites)]; return { background: tier.bg, color: tier.fg } }

export const catColors = { entradas: 'oklch(0.66 0.10 165)', fixos: 'oklch(0.60 0.10 250)', variaveis: 'oklch(0.78 0.10 78)', assinaturas: 'oklch(0.65 0.11 305)', economia: 'oklch(0.73 0.09 195)' } as const
