import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Adicione estas funções para lidar com dias úteis no Brasil
export function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6 // 0 = domingo, 6 = sábado
}

export function isBrazilianHoliday(date: Date): boolean {
  const year = date.getFullYear()
  const month = date.getMonth() // 0-11
  const day = date.getDate()

  // Feriados fixos
  const fixedHolidays = [
    { month: 0, day: 1 }, // Ano Novo (1º de janeiro)
    { month: 3, day: 21 }, // Tiradentes (21 de abril)
    { month: 4, day: 1 }, // Dia do Trabalho (1º de maio)
    { month: 8, day: 7 }, // Independência (7 de setembro)
    { month: 9, day: 12 }, // Nossa Senhora Aparecida (12 de outubro)
    { month: 10, day: 2 }, // Finados (2 de novembro)
    { month: 10, day: 15 }, // Proclamação da República (15 de novembro)
    { month: 11, day: 25 }, // Natal (25 de dezembro)
  ]

  // Verificar feriados fixos
  for (const holiday of fixedHolidays) {
    if (month === holiday.month && day === holiday.day) {
      return true
    }
  }

  // Feriados móveis (Carnaval, Sexta-feira Santa, Corpus Christi)
  // Estes dependem da data da Páscoa, que varia a cada ano
  // Para simplificar, não estamos calculando estes feriados móveis aqui

  return false
}

export function getNextBusinessDay(date: Date): Date {
  const nextDay = new Date(date)
  nextDay.setDate(nextDay.getDate() + 1)

  // Continua verificando até encontrar um dia útil
  while (isWeekend(nextDay) || isBrazilianHoliday(nextDay)) {
    nextDay.setDate(nextDay.getDate() + 1)
  }

  return nextDay
}

export function adjustToBusinessDay(date: Date): Date {
  // Se a data já for um dia útil, retorna a mesma data
  if (!isWeekend(date) && !isBrazilianHoliday(date)) {
    return date
  }

  // Caso contrário, encontra o próximo dia útil
  return getNextBusinessDay(date)
}
