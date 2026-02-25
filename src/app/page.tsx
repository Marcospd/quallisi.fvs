import Link from 'next/link'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { plans } from '@/lib/db/schema'
import {
  Building2,
  ClipboardCheck,
  Smartphone,
  FolderKanban,
  PiggyBank,
  Check,
  ArrowRight,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

const benefits = [
  {
    icon: Smartphone,
    title: 'Mobilidade',
    description: 'Acesse suas FVS de qualquer lugar, direto pelo celular ou tablet.',
  },
  {
    icon: FolderKanban,
    title: 'Organização',
    description: 'Todas as suas obras, inspeções e pendências em um só lugar.',
  },
  {
    icon: PiggyBank,
    title: 'Economia',
    description: 'Elimine papel e retrabalho. Reduza custos com controle digital.',
  },
  {
    icon: ClipboardCheck,
    title: 'FVS Digital',
    description: 'Fichas de Verificação de Serviço 100% digitais com histórico completo.',
  },
]

function formatPrice(price: string) {
  return Number(price).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function formatLimit(value: number) {
  return value === -1 ? 'Ilimitado' : String(value)
}

export default async function HomePage() {
  let activePlans: {
    id: string
    name: string
    priceBrl: string
    maxProjects: number
    maxUsers: number
    maxFvsMonth: number
  }[] = []

  try {
    activePlans = await db
      .select({
        id: plans.id,
        name: plans.name,
        priceBrl: plans.priceBrl,
        maxProjects: plans.maxProjects,
        maxUsers: plans.maxUsers,
        maxFvsMonth: plans.maxFvsMonth,
      })
      .from(plans)
      .where(eq(plans.active, true))
  } catch {
    // DB unavailable — pricing section will be hidden
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-900/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-emerald-400" />
            <span className="text-lg font-bold">Quallisy FVS</span>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
          >
            Acessar Sistema
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-4xl px-4 py-24 text-center sm:py-32">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
          Controle suas obras{' '}
          <span className="text-emerald-400">na palma da mão</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
          Plataforma completa de controle de qualidade para obras civis.
          Fichas de Verificação de Serviço 100% digitais, inspeções em tempo real
          e relatórios automatizados.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="#planos"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-8 py-3.5 text-base font-semibold text-white transition-colors hover:bg-emerald-500"
          >
            Ver Planos
            <ArrowRight className="h-4 w-4" />
          </a>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg border border-slate-600 px-8 py-3.5 text-base font-medium text-slate-300 transition-colors hover:bg-slate-800"
          >
            Já tenho conta
          </Link>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="border-t border-white/10 bg-slate-800/50 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-4 text-center text-3xl font-bold">
            Por que escolher a Quallisy?
          </h2>
          <p className="mx-auto mb-12 max-w-xl text-center text-slate-400">
            Tudo o que você precisa para gerenciar a qualidade das suas obras em uma única plataforma.
          </p>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((b) => (
              <div
                key={b.title}
                className="rounded-xl border border-white/10 bg-slate-800/80 p-6 text-center transition-colors hover:border-emerald-500/40"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-600/20">
                  <b.icon className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{b.title}</h3>
                <p className="text-sm text-slate-400">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      {activePlans.length > 0 ? (
      <section id="planos" className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-4 text-center text-3xl font-bold">
            Planos e Preços
          </h2>
          <p className="mx-auto mb-12 max-w-xl text-center text-slate-400">
            Escolha o plano ideal para o tamanho da sua operação.
          </p>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {activePlans.map((plan, i) => {
              const isPopular = i === 1
              const slug = plan.name.toLowerCase().replace(/\s+/g, '-')

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-2xl border p-8 transition-colors ${
                    isPopular
                      ? 'border-emerald-500 bg-slate-800/80 shadow-lg shadow-emerald-500/10'
                      : 'border-white/10 bg-slate-800/50 hover:border-white/20'
                  }`}
                >
                  {isPopular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-4 py-1 text-xs font-semibold uppercase tracking-wide">
                      Mais Popular
                    </span>
                  )}
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold">
                      {formatPrice(plan.priceBrl)}
                    </span>
                    <span className="text-slate-400">/mês</span>
                  </div>
                  <ul className="mt-8 flex-1 space-y-3">
                    <li className="flex items-center gap-3 text-sm text-slate-300">
                      <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                      Até {formatLimit(plan.maxProjects)} {plan.maxProjects === 1 ? 'obra' : 'obras'}
                    </li>
                    <li className="flex items-center gap-3 text-sm text-slate-300">
                      <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                      Até {formatLimit(plan.maxUsers)} usuários
                    </li>
                    <li className="flex items-center gap-3 text-sm text-slate-300">
                      <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                      {formatLimit(plan.maxFvsMonth)} FVS/mês
                    </li>
                    <li className="flex items-center gap-3 text-sm text-slate-300">
                      <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                      Relatórios em PDF
                    </li>
                    <li className="flex items-center gap-3 text-sm text-slate-300">
                      <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                      Suporte por e-mail
                    </li>
                  </ul>
                  <Link
                    href={`/register?plano=${slug}`}
                    className={`mt-8 inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-colors ${
                      isPopular
                        ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                        : 'border border-emerald-600 text-emerald-400 hover:bg-emerald-600/10'
                    }`}
                  >
                    Assinar Agora
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </section>
      ) : null}

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-sm text-slate-500">
        <p>© {new Date().getFullYear()} Quallisy FVS — Controle de Qualidade para Obras Civis</p>
      </footer>
    </main>
  )
}
