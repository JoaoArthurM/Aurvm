import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Economia, FinancasData, FluxTipo } from './types'

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

export type ProjectionPoint = { key: string; mes: string; entrou: number; acumulado: number; breakdown: { label: string; valor: number }[] }
export const projectSavings = (data: FinancasData, months = 24): ProjectionPoint[] => {
  let accumulated = data.perfil.saldo_inicial
  const now = new Date()
  return Array.from({ length: months }, (_, index) => {
    const key = monthKey(addMonths(now, index))
    const extras = data.economias.filter((item) => isEconomiaInMonth(item, key, index))
    const breakdown = [{ label: 'Economia mensal', valor: data.perfil.economia_mensal }, ...extras.map(({ label, valor }) => ({ label, valor }))]
    const entrou = breakdown.reduce((acc, item) => acc + item.valor, 0)
    accumulated += entrou
    return { key, mes: monthLabel(key), entrou, acumulado: accumulated, breakdown }
  })
}

const isEconomiaInMonth = (item: Economia, key: string, index: number) => {
  if (item.tipo === 'recorrente') return true
  if (item.tipo === 'parcelado') return index < (item.vezes ?? 0)
  return item.mes === key
}

export const fluxMeta: Record<FluxTipo, { label: string; icon: string; color: string }> = {
  entrada: { label: 'Entradas', icon: '↙', color: '#34D399' },
  saida: { label: 'Saídas', icon: '↗', color: '#FF6B35' },
  diario: { label: 'Diários', icon: 'D', color: '#F472B6' },
  economia: { label: 'Economia', icon: 'E', color: '#34D399' },
  cartao: { label: 'Cartão', icon: 'C', color: '#FF6A1A' },
}

export const saldoTemperature = (value: number) => value < 0 ? '#EF4444' : value < 500 ? '#FBBF24' : value < 2000 ? '#86EFAC' : '#34D399'
