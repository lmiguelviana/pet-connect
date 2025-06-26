import { 
  CalendarIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import { format, isToday, isTomorrow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Appointment } from '@/types/appointments'

interface AppointmentStatsProps {
  appointments: Appointment[]
  loading: boolean
}

export function AppointmentStats({ appointments, loading }: AppointmentStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white overflow-hidden shadow rounded-lg animate-pulse">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const today = new Date()
  const todayAppointments = appointments.filter(apt => isToday(new Date(apt.date)))
  const tomorrowAppointments = appointments.filter(apt => isTomorrow(new Date(apt.date)))
  const completedAppointments = appointments.filter(apt => apt.status === 'completed')
  const cancelledAppointments = appointments.filter(apt => apt.status === 'cancelled')
  const totalRevenue = completedAppointments.reduce((sum, apt) => sum + (apt.total_amount || 0), 0)

  const stats = [
    {
      name: 'Hoje',
      value: todayAppointments.length,
      icon: CalendarIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: `${todayAppointments.filter(apt => apt.status === 'completed').length} concluídos`,
      changeType: 'positive',
    },
    {
      name: 'Amanhã',
      value: tomorrowAppointments.length,
      icon: ClockIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      change: `${tomorrowAppointments.filter(apt => apt.status === 'confirmed').length} confirmados`,
      changeType: 'neutral',
    },
    {
      name: 'Concluídos',
      value: completedAppointments.length,
      icon: CheckCircleIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: `${Math.round((completedAppointments.length / appointments.length) * 100) || 0}%`,
      changeType: 'positive',
    },
    {
      name: 'Cancelados',
      value: cancelledAppointments.length,
      icon: XCircleIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      change: `${Math.round((cancelledAppointments.length / appointments.length) * 100) || 0}%`,
      changeType: 'negative',
    },
    {
      name: 'Receita',
      value: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(totalRevenue),
      icon: CurrencyDollarIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: `${completedAppointments.length} serviços`,
      changeType: 'positive',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </div>
                    </dd>
                    <dd className="text-sm text-gray-500">
                      {stat.change}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}