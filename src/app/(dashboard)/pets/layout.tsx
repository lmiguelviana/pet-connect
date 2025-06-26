import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pets | Pet Connect',
  description: 'Gestão de pets do seu pet shop',
}

export default function PetsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="space-y-6">
      {children}
    </div>
  )
}