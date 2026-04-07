'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Input, Text } from '@/components/ui'
import type { HubInput, DecisionOutput } from '@/lib/types'

// ─── Icons ────────────────────────────────────────────────────────────────────

const LogoutIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M5 2H2.5A1.5 1.5 0 0 0 1 3.5v7A1.5 1.5 0 0 0 2.5 12H5M9 4l3 3-3 3M12 7H5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// ─── Types ────────────────────────────────────────────────────────────────────

type FieldDef = { key: string; label: string; helper?: string }
type DimensionDef = { id: keyof HubInput; title: string; fields: FieldDef[] }

const DIMENSIONS: DimensionDef[] = [
  {
    id: 'rh',
    title: 'RH — Recursos Humanos',
    fields: [
      { key: 'turnover',    label: 'Turnover (%)',              helper: 'Taxa de rotatividade — quanto maior, pior' },
      { key: 'clima',       label: 'Clima Organizacional',      helper: 'Pesquisa de clima — 0 a 100' },
      { key: 'engajamento', label: 'Engajamento da Equipe',     helper: 'Nível de engajamento — 0 a 100' },
      { key: 'absenteismo', label: 'Absenteísmo (%)',           helper: 'Taxa de ausências — quanto maior, pior' },
    ],
  },
  {
    id: 'fin',
    title: 'FIN — Financeiro',
    fields: [
      { key: 'margem',        label: 'Margem (%)',              helper: 'Margem de lucro normalizada 0-100' },
      { key: 'caixa',         label: 'Saúde do Caixa',         helper: 'Disponibilidade de caixa — 0 a 100' },
      { key: 'crescimento',   label: 'Crescimento de Receita',  helper: 'Taxa de crescimento normalizada 0-100' },
      { key: 'endividamento', label: 'Endividamento (%)',       helper: 'Nível de endividamento — quanto maior, pior' },
    ],
  },
  {
    id: 'log',
    title: 'LOG — Logística & Operações',
    fields: [
      { key: 'produtividade', label: 'Produtividade',           helper: '0 a 100' },
      { key: 'capacidade',    label: 'Capacidade Operacional',  helper: '% de capacidade disponível' },
      { key: 'retrabalho',    label: 'Retrabalho (%)',          helper: 'Taxa de retrabalho — quanto maior, pior' },
      { key: 'tempoEntrega',  label: 'Tempo de Entrega',        helper: 'Score de prazo — 100 = sempre no prazo' },
    ],
  },
  {
    id: 'mkt',
    title: 'MKT — Marketing & Vendas',
    fields: [
      { key: 'leads',     label: 'Geração de Leads',            helper: 'Volume de leads normalizado 0-100' },
      { key: 'conversao', label: 'Taxa de Conversão',           helper: '% de leads convertidos normalizado' },
      { key: 'retencao',  label: 'Retenção de Clientes',        helper: '% de clientes retidos' },
      { key: 'cac',       label: 'CAC (Custo de Aquisição)',    helper: 'Custo normalizado — quanto maior, pior' },
    ],
  },
  {
    id: 'esg',
    title: 'ESG',
    fields: [
      { key: 'ambiental',  label: 'Ambiental',  helper: 'Score de práticas ambientais — 0 a 100' },
      { key: 'social',     label: 'Social',     helper: 'Score de impacto social — 0 a 100' },
      { key: 'governanca', label: 'Governança', helper: 'Score de governança corporativa — 0 a 100' },
    ],
  },
]

// ─── Default empty form state ─────────────────────────────────────────────────

type FormValues = Record<keyof HubInput, Record<string, string>>

function defaultForm(): FormValues {
  const out = {} as FormValues
  for (const dim of DIMENSIONS) {
    out[dim.id] = {}
    for (const f of dim.fields) {
      out[dim.id][f.key] = ''
    }
  }
  return out
}

// ─── Dimension Section ────────────────────────────────────────────────────────

function DimensionSection({
  dim,
  values,
  errors,
  onChange,
}: {
  dim: DimensionDef
  values: Record<string, string>
  errors: Record<string, string>
  onChange: (key: string, value: string) => void
}) {
  return (
    <div
      className="rounded-[var(--radius-md)] border p-5 space-y-4"
      style={{ background: 'var(--surface-0)', borderColor: 'var(--steel-soft)' }}
    >
      <Text variant="subheading">{dim.title}</Text>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {dim.fields.map((f) => (
          <Input
            key={f.key}
            label={f.label}
            helperText={f.helper}
            type="number"
            min="0"
            max="100"
            step="1"
            value={values[f.key] ?? ''}
            error={errors[f.key]}
            onChange={(e) => onChange(f.key, e.target.value)}
            placeholder="0 – 100"
          />
        ))}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HubPage() {
  const { data: session } = useSession()
  const router = useRouter()

  const [form, setForm] = useState<FormValues>(defaultForm)
  const [fieldErrors, setFieldErrors] = useState<Record<string, Record<string, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleChange = (dimId: keyof HubInput, key: string, value: string) => {
    setForm((prev) => ({ ...prev, [dimId]: { ...prev[dimId], [key]: value } }))
    setFieldErrors((prev) => ({
      ...prev,
      [dimId]: { ...(prev[dimId] ?? {}), [key]: '' },
    }))
  }

  const validate = (): boolean => {
    const errs: Record<string, Record<string, string>> = {}
    let valid = true

    for (const dim of DIMENSIONS) {
      errs[dim.id] = {}
      for (const f of dim.fields) {
        const raw = form[dim.id][f.key]
        if (raw === '' || raw === undefined) {
          errs[dim.id][f.key] = 'Obrigatório'
          valid = false
          continue
        }
        const n = Number(raw)
        if (isNaN(n) || n < 0 || n > 100) {
          errs[dim.id][f.key] = 'Deve ser entre 0 e 100'
          valid = false
        }
      }
    }

    setFieldErrors(errs)
    return valid
  }

  const buildInput = (): HubInput => {
    const parse = (dimId: keyof HubInput, key: string) => Number(form[dimId][key])
    return {
      rh:  { turnover: parse('rh', 'turnover'), clima: parse('rh', 'clima'), engajamento: parse('rh', 'engajamento'), absenteismo: parse('rh', 'absenteismo') },
      fin: { margem: parse('fin', 'margem'), caixa: parse('fin', 'caixa'), crescimento: parse('fin', 'crescimento'), endividamento: parse('fin', 'endividamento') },
      log: { produtividade: parse('log', 'produtividade'), capacidade: parse('log', 'capacidade'), retrabalho: parse('log', 'retrabalho'), tempoEntrega: parse('log', 'tempoEntrega') },
      mkt: { leads: parse('mkt', 'leads'), conversao: parse('mkt', 'conversao'), retencao: parse('mkt', 'retencao'), cac: parse('mkt', 'cac') },
      esg: { ambiental: parse('esg', 'ambiental'), social: parse('esg', 'social'), governanca: parse('esg', 'governanca') },
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    setSubmitError(null)

    try {
      const res = await fetch('/api/hub/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildInput()),
      })

      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || `HTTP ${res.status}`)
      }

      const { output } = (await res.json()) as { output: DecisionOutput }
      sessionStorage.setItem('hub_result', JSON.stringify(output))
      router.push('/hub/result')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--canvas)' }}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-6 h-14 shrink-0 border-b"
        style={{ background: 'var(--surface-0)', borderColor: 'var(--steel-soft)' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-6 h-6 rounded-[var(--radius-sm)] flex items-center justify-center"
            style={{ background: 'var(--navy)' }}
          >
            <span style={{ color: 'var(--ink-inverse)', fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-geist-sans)' }}>V</span>
          </div>
          <Text variant="subheading" as="span" style={{ color: 'var(--navy)' }}>Velta</Text>
          <span style={{ color: 'var(--steel)', fontSize: 16, userSelect: 'none' }}>|</span>
          <Text variant="body-sm" color="secondary">Hub</Text>
          <span style={{ color: 'var(--steel)', fontSize: 16, userSelect: 'none' }}>|</span>
          <a href="/hub/history" style={{ textDecoration: 'none' }}>
            <Text variant="body-sm" color="tertiary">Histórico</Text>
          </a>
          <span style={{ color: 'var(--steel)', fontSize: 16, userSelect: 'none' }}>|</span>
          <a href="/chat" style={{ textDecoration: 'none' }}>
            <Text variant="body-sm" color="tertiary">Assistente</Text>
          </a>
        </div>
        <div className="flex items-center gap-4">
          {session?.user?.name && (
            <Text variant="body-sm" color="secondary">{session.user.name}</Text>
          )}
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-1.5 px-3 h-7 rounded-[var(--radius-sm)] border transition-colors duration-150"
            style={{ borderColor: 'var(--steel)', color: 'var(--ink-secondary)', background: 'transparent', fontSize: 12, cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-2)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            <LogoutIcon />
            Sair
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <Text variant="title">Análise Organizacional</Text>
            <Text variant="body-sm" color="secondary" className="mt-1">
              Insira os indicadores de cada dimensão. Todos os valores devem estar entre 0 e 100.
            </Text>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {DIMENSIONS.map((dim) => (
              <DimensionSection
                key={dim.id}
                dim={dim}
                values={form[dim.id]}
                errors={fieldErrors[dim.id] ?? {}}
                onChange={(key, value) => handleChange(dim.id, key, value)}
              />
            ))}

            {submitError && (
              <p className="text-sm text-center" style={{ color: 'var(--semantic-error)' }}>
                {submitError}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-11 rounded-[var(--radius-sm)] font-medium text-sm transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: submitting ? 'var(--azure-hover)' : 'var(--navy)',
                color: 'var(--ink-inverse)',
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.background = 'var(--azure)' }}
              onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.background = 'var(--navy)' }}
            >
              {submitting ? 'Calculando...' : 'Calcular Score'}
            </button>
          </form>

          <div className="mt-6 pb-8">
            <Text variant="caption" color="muted" className="text-center">
              Motor de Decisão Multidimensional · VELTA AI 5.0
            </Text>
          </div>
        </div>
      </main>
    </div>
  )
}
