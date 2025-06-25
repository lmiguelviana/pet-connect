import Image from 'next/image'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex">
      {/* Lado esquerdo - Formulário */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">🐾</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Pet Connect</h1>
            <p className="text-gray-600 mt-2">Sistema de gestão para pet shops</p>
          </div>
          {children}
        </div>
      </div>

      {/* Lado direito - Imagem/Branding */}
      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-primary-700">
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-white">
              <div className="text-6xl mb-4">🐕🐱</div>
              <h2 className="text-3xl font-bold mb-4">Gerencie seu pet shop com facilidade</h2>
              <p className="text-xl opacity-90 max-w-md">
                Controle clientes, pets, agendamentos e finanças em um só lugar
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}