import { useQuery } from '@tanstack/react-query'

export const useSelic = () => useQuery({
  queryKey: ['selic'],
  queryFn: async () => {
    const response = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json')
    if (!response.ok) throw new Error('BCB indisponível')
    const result = await response.json() as { valor: string }[]
    return Number(result[0]?.valor?.replace(',', '.'))
  },
  staleTime: 1000 * 60 * 60 * 12,
  retry: 1,
})
