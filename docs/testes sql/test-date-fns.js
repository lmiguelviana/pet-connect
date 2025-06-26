// Teste simples para verificar importações do date-fns
import { subDays, addDays, format } from 'date-fns'

const today = new Date()
console.log('Hoje:', format(today, 'dd/MM/yyyy'))
console.log('3 dias atrás:', format(subDays(today, 3), 'dd/MM/yyyy'))
console.log('3 dias à frente:', format(addDays(today, 3), 'dd/MM/yyyy'))

export default function testDateFns() {
  return {
    today,
    threeDaysAgo: subDays(today, 3),
    threeDaysAhead: addDays(today, 3)
  }
}