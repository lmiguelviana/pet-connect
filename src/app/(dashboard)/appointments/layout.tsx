import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Agendamentos | Pet Connect',
  description: 'Gerencie agendamentos e consultas do seu pet shop',
}

export default function AppointmentsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}