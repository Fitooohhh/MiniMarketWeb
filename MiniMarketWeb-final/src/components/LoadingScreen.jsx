import { Loader2 } from 'lucide-react'

export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center">
        <Loader2 className="w-16 h-16 animate-spin text-primary-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          Mini Market
        </h2>
        <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
      </div>
    </div>
  )
}
