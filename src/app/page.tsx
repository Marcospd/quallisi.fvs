import Link from 'next/link'

/**
 * Página inicial — redireciona para o login do tenant ou painel sistema.
 */
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="text-center space-y-8">
        <div className="space-y-3">
          <h1 className="text-5xl font-bold tracking-tight text-white">
            Quallisy FVS
          </h1>
          <p className="text-lg text-slate-400 max-w-md">
            Plataforma de controle de qualidade para obras civis
          </p>
        </div>

        <div className="flex flex-col gap-4 justify-center items-center">
          <Link
            href="/register"
            className="inline-flex items-center justify-center px-8 py-3 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 transition-colors w-full sm:w-auto"
          >
            Cadastrar Empresa
          </Link>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-3 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
            >
              Acessar Painel
            </Link>
            <Link
              href="/system/login"
              className="inline-flex items-center justify-center px-8 py-3 text-sm font-medium text-slate-300 border border-slate-600 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Painel Sistema
            </Link>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          v0.1.0 — Ficha de Verificação de Serviço
        </p>
      </div>
    </main>
  )
}
