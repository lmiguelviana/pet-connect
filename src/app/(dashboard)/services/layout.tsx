import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Serviços | Pet Connect',
  description: 'Gerencie os serviços do seu pet shop'
}

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}