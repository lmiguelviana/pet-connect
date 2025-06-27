// Formatação de valores monetários
export function formatCurrency(value: number, currency = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

// Formatação de números
export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value)
}

// Formatação de datas
export function formatDate(date: Date | string, format: 'short' | 'long' | 'time' | 'datetime' = 'short'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(dateObj.getTime())) {
    return 'Data inválida'
  }

  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'America/Sao_Paulo'
  }

  switch (format) {
    case 'short':
      options.day = '2-digit'
      options.month = '2-digit'
      options.year = 'numeric'
      break
    case 'long':
      options.day = 'numeric'
      options.month = 'long'
      options.year = 'numeric'
      break
    case 'time':
      options.hour = '2-digit'
      options.minute = '2-digit'
      break
    case 'datetime':
      options.day = '2-digit'
      options.month = '2-digit'
      options.year = 'numeric'
      options.hour = '2-digit'
      options.minute = '2-digit'
      break
  }

  return new Intl.DateTimeFormat('pt-BR', options).format(dateObj)
}

// Formatação de duração em minutos
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}min`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (remainingMinutes === 0) {
    return `${hours}h`
  }
  
  return `${hours}h ${remainingMinutes}min`
}

// Formatação de telefone brasileiro
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  
  return phone
}

// Formatação de CPF
export function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '')
  
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }
  
  return cpf
}

// Formatação de peso
export function formatWeight(weight: number, unit = 'kg'): string {
  if (weight < 1) {
    return `${(weight * 1000).toFixed(0)}g`
  }
  return `${weight.toFixed(1)}${unit}`
}

// Formatação de idade
export function formatAge(age: number, type: 'years' | 'months' = 'years'): string {
  if (type === 'months') {
    if (age < 12) {
      return `${age} ${age === 1 ? 'mês' : 'meses'}`
    }
    const years = Math.floor(age / 12)
    const months = age % 12
    if (months === 0) {
      return `${years} ${years === 1 ? 'ano' : 'anos'}`
    }
    return `${years}a ${months}m`
  }
  
  return `${age} ${age === 1 ? 'ano' : 'anos'}`
}

// Formatação de texto para URL amigável
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
    .trim()
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens duplicados
}

// Formatação de nome próprio
export function formatProperName(name: string): string {
  return name
    .toLowerCase()
    .split(' ')
    .map(word => {
      // Preposições que não devem ser capitalizadas
      const prepositions = ['de', 'da', 'do', 'das', 'dos', 'e']
      if (prepositions.includes(word)) {
        return word
      }
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

// Formatação de tamanho de arquivo
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Formatação de porcentagem
export function formatPercentage(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}

// Formatação de tempo relativo (ex: "há 2 horas")
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return 'agora'
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `há ${diffInMinutes} ${diffInMinutes === 1 ? 'minuto' : 'minutos'}`
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `há ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`
  }
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) {
    return `há ${diffInDays} ${diffInDays === 1 ? 'dia' : 'dias'}`
  }
  
  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return `há ${diffInMonths} ${diffInMonths === 1 ? 'mês' : 'meses'}`
  }
  
  const diffInYears = Math.floor(diffInMonths / 12)
  return `há ${diffInYears} ${diffInYears === 1 ? 'ano' : 'anos'}`
}

// Formatação de status
export function formatStatus(status: string): { label: string; color: string } {
  const statusMap: Record<string, { label: string; color: string }> = {
    active: { label: 'Ativo', color: 'green' },
    inactive: { label: 'Inativo', color: 'gray' },
    pending: { label: 'Pendente', color: 'yellow' },
    cancelled: { label: 'Cancelado', color: 'red' },
    completed: { label: 'Concluído', color: 'blue' },
    scheduled: { label: 'Agendado', color: 'purple' },
    confirmed: { label: 'Confirmado', color: 'green' },
    no_show: { label: 'Não compareceu', color: 'orange' }
  }
  
  return statusMap[status] || { label: status, color: 'gray' }
}

// Formatação de espécie de pet
export function formatPetSpecies(species: string): string {
  const speciesMap: Record<string, string> = {
    dog: 'Cão',
    cat: 'Gato',
    bird: 'Ave',
    rabbit: 'Coelho',
    hamster: 'Hamster',
    fish: 'Peixe',
    reptile: 'Réptil',
    other: 'Outro'
  }
  
  return speciesMap[species] || species
}

// Formatação de plano
export function formatPlan(plan: string): { label: string; color: string } {
  const planMap: Record<string, { label: string; color: string }> = {
    free: { label: 'Gratuito', color: 'gray' },
    premium: { label: 'Premium', color: 'gold' },
    enterprise: { label: 'Enterprise', color: 'purple' }
  }
  
  return planMap[plan] || { label: plan, color: 'gray' }
}