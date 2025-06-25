import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/contexts/auth-context'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Pet Connect - Sistema de Gestão para Pet Shops',
  description: 'Sistema completo de gestão para pet shops. Gerencie clientes, pets, agendamentos e muito mais.',
  keywords: 'pet shop, gestão, sistema, pets, clientes, agendamentos',
  authors: [{ name: 'Pet Connect Team' }],
  openGraph: {
    title: 'Pet Connect - Transforme seu Pet Shop',
    description: 'Sistema completo de gestão para pet shops modernos',
    type: 'website',
    locale: 'pt_BR',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AuthProvider>
          <div id="root">{children}</div>
        </AuthProvider>
      </body>
    </html>
  )
}