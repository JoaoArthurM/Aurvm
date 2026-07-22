import { describe, expect, it } from 'vitest'
import type { FluxLancamento } from './types'
import { localISO, monthKey, ocorreEm, quintoDiaUtil } from './utils'

const lancamento = (overrides: Partial<FluxLancamento> = {}): FluxLancamento => ({
  id: 'test',
  data: '2026-01-15',
  tipo: 'saida',
  valor: 100,
  descricao: 'Teste',
  tag_id: null,
  ...overrides,
})

describe('datas locais', () => {
  it('mantém a data local ao formatar ISO', () => {
    const date = new Date(2026, 6, 22, 23, 30)
    expect(localISO(date)).toBe('2026-07-22')
    expect(monthKey(date)).toBe('2026-07')
  })

  it('calcula o quinto dia útil sem contar sábado', () => {
    expect(quintoDiaUtil(new Date(2026, 6, 1))).toBe(7)
  })
})

describe('recorrências do fluxo', () => {
  it('repete mensalmente no dia original', () => {
    const item = lancamento({ repete: { vezes: null, frequencia: 'mensal', regra: 'data' } })
    expect(ocorreEm(item, '2026-02-15')).toBe(true)
    expect(ocorreEm(item, '2026-02-16')).toBe(false)
  })

  it('repete diariamente e semanalmente apenas nos intervalos válidos', () => {
    const diaria = lancamento({ data: '2026-07-20', repete: { vezes: null, frequencia: 'diaria', regra: 'data' } })
    const semanal = lancamento({ data: '2026-07-20', repete: { vezes: null, frequencia: 'semanal', regra: 'data' } })
    expect(ocorreEm(diaria, '2026-07-22')).toBe(true)
    expect(ocorreEm(semanal, '2026-07-27')).toBe(true)
    expect(ocorreEm(semanal, '2026-07-28')).toBe(false)
  })

  it('respeita quantidade e datas excluídas', () => {
    const item = lancamento({ repete: { vezes: 2, frequencia: 'mensal', regra: 'data', excluidas: ['2026-02-15'] } })
    expect(ocorreEm(item, '2026-02-15')).toBe(false)
    expect(ocorreEm(item, '2026-03-15')).toBe(false)
  })
})
