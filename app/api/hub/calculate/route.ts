import { auth } from '@/auth'
import { runScoringEngine } from '@/lib/scoring'
import { saveHubData } from '@/lib/hub'
import type { HubInput } from '@/lib/types'

export const runtime = 'nodejs'

function validateHubInput(body: unknown): body is HubInput {
  if (!body || typeof body !== 'object') return false
  const b = body as Record<string, unknown>

  const isNumberIn0to100 = (v: unknown) =>
    typeof v === 'number' && isFinite(v) && v >= 0 && v <= 100

  const dimensionKeys: Record<string, string[]> = {
    rh:  ['turnover', 'clima', 'engajamento', 'absenteismo'],
    fin: ['margem', 'caixa', 'crescimento', 'endividamento'],
    log: ['produtividade', 'capacidade', 'retrabalho', 'tempoEntrega'],
    mkt: ['leads', 'conversao', 'retencao', 'cac'],
    esg: ['ambiental', 'social', 'governanca'],
  }

  for (const [dim, fields] of Object.entries(dimensionKeys)) {
    const dimObj = b[dim]
    if (!dimObj || typeof dimObj !== 'object') return false
    const d = dimObj as Record<string, unknown>
    for (const field of fields) {
      if (!isNumberIn0to100(d[field])) return false
    }
  }

  return true
}

export async function POST(req: Request): Promise<Response> {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  if (!validateHubInput(body)) {
    return new Response(
      'Dados inválidos. Todos os campos devem ser números entre 0 e 100.',
      { status: 400 }
    )
  }

  try {
    const conversationId = (body as unknown as Record<string, unknown>).conversationId as string | undefined
    const output = runScoringEngine(body)
    const doc = await saveHubData(session.user.id, body, output, conversationId)
    return Response.json({ output, hubDataId: doc.id })
  } catch (err) {
    console.error('[hub/calculate]', err)
    return new Response('Internal server error', { status: 500 })
  }
}
