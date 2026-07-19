import type { FinancasData } from './types'

export const seedData: FinancasData = {
  version: 1,
  perfil: { nome: 'João', saldo_inicial: 5000, economia_mensal: 800, valor_diario: 50 },
  tabela: {
    entradas: [{ id: 'e1', label: 'Bonfrigo PJ', valor: 4500 }, { id: 'e2', label: 'Freelance', valor: 800 }],
    fixos: [{ id: 'f1', label: 'Aluguel', valor: 1200 }, { id: 'f2', label: 'Condomínio', valor: 320 }, { id: 'f3', label: 'Internet', valor: 120 }],
    variaveis: [{ id: 'v1', label: 'Supermercado', valor: 700 }, { id: 'v2', label: 'Combustível', valor: 380 }, { id: 'v3', label: 'Lazer', valor: 280 }],
    assinaturas: [{ id: 'a1', label: 'Academia', valor: 120 }, { id: 'a2', label: 'Netflix', valor: 55, logo: { icon: 'logos:netflix-icon', file: 'logos/a2.svg' } }, { id: 'a3', label: 'Spotify', valor: 22, logo: { icon: 'logos:spotify-icon', file: 'logos/a3.svg' } }, { id: 'a4', label: 'iCloud', valor: 16 }],
  },
  economias: [
    { id: 'ec1', label: 'Consórcio', valor: 8000, tipo: 'pontual', vezes: null, mes: '2026-07' },
    { id: 'ec2', label: 'Bônus Bonfrigo', valor: 400, tipo: 'recorrente', vezes: null, mes: null },
    { id: 'ec3', label: '13º Salário', valor: 4500, tipo: 'pontual', vezes: null, mes: '2026-12' },
    { id: 'ec4', label: 'Reserva extra', valor: 500, tipo: 'parcelado', vezes: 6, mes: null },
  ],
  emprestimos: { pessoas: [
    { id: 'p1', nome: 'Pedro', cor: '#3B82F6', lancamentos: [{ id: 'l1', data: '2026-07-03', motivo: 'Passagens', valor: 500, pago: false }, { id: 'l2', data: '2026-06-18', motivo: 'Restaurante', valor: 200, pago: false }] },
    { id: 'p2', nome: 'Fernanda', cor: '#EC4899', lancamentos: [{ id: 'l3', data: '2026-07-12', motivo: 'Hospedagem', valor: 800, pago: false }] },
    { id: 'p3', nome: 'Carlos', cor: '#F59E0B', lancamentos: [{ id: 'l4', data: '2026-05-22', motivo: 'Ingresso', valor: 400, pago: false }] },
  ] },
  flux: {
    valor_diario_planejado: 50,
    cartoes: [{ id: 'c1', nome: 'Itaú', fechamento: 8, vencimento: 10 }],
    temperatura: { limites: [-100, 0, 100, 300, 1000, 2000] },
    tags: [{ id: 't1', label: 'Casa', cor: '#5E86B8' }, { id: 't2', label: 'Comida', cor: '#C65F63' }, { id: 't3', label: 'Transporte', cor: '#2E9E5B' }, { id: 't4', label: 'Lazer', cor: '#EDA30D' }],
    lancamentos: [
      { id: 'fl1', data: '2026-07-01', tipo: 'entrada', valor: 4500, descricao: 'Bonfrigo PJ', tag_id: null },
      { id: 'fl2', data: '2026-07-02', tipo: 'saida', valor: 1200, descricao: 'Aluguel', tag_id: 't1' },
      { id: 'fl3', data: '2026-07-03', tipo: 'diario', valor: 47, descricao: 'Almoço', tag_id: 't2' },
      { id: 'fl4', data: '2026-07-06', tipo: 'cartao', valor: 320, descricao: 'Fatura Inter', tag_id: null },
      { id: 'fl5', data: '2026-07-08', tipo: 'economia', valor: 800, descricao: 'Reserva mensal', tag_id: null },
      { id: 'fl6', data: '2026-07-11', tipo: 'diario', valor: 63, descricao: 'Cinema', tag_id: 't4' },
      { id: 'fl7', data: '2026-07-14', tipo: 'saida', valor: 210, descricao: 'Mercado', tag_id: 't2' },
      { id: 'fl8', data: '2026-07-17', tipo: 'diario', valor: 52, descricao: 'Café e almoço', tag_id: 't2' },
    ],
  },
  config: { tema: 'light', moeda: 'BRL', alertas_gasto: true, lembrete_mensal: true, dia_lembrete: 1, navegacao: [
    { id:'inicio', visivel:true }, { id:'tabela', visivel:true }, { id:'economia', visivel:true },
    { id:'emprestimos', visivel:true }, { id:'flux', visivel:true }, { id:'config', visivel:true },
  ] },
}
