import type {
  RHInput,
  FINInput,
  LOGInput,
  MKTInput,
  ESGInput,
  HubInput,
  DimensionScores,
  DimensionWeights,
  StrategicIndices,
  ScenarioClassification,
  DecisionOutput,
  IRLLevel,
  IIHLevel,
  IULevel,
} from './types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value))
}

// ─── Dimension Calculations ───────────────────────────────────────────────────

export function calculateRH(input: RHInput): number {
  return clamp(
    (100 - input.turnover) * 0.30 +
    input.clima * 0.30 +
    input.engajamento * 0.25 +
    (100 - input.absenteismo) * 0.15
  )
}

export function calculateFIN(input: FINInput): number {
  return clamp(
    input.margem * 0.30 +
    input.caixa * 0.25 +
    input.crescimento * 0.25 +
    (100 - input.endividamento) * 0.20
  )
}

export function calculateLOG(input: LOGInput): number {
  return clamp(
    input.produtividade * 0.30 +
    input.capacidade * 0.25 +
    (100 - input.retrabalho) * 0.25 +
    input.tempoEntrega * 0.20
  )
}

export function calculateMKT(input: MKTInput): number {
  return clamp(
    input.leads * 0.25 +
    input.conversao * 0.30 +
    input.retencao * 0.25 +
    (100 - input.cac) * 0.20
  )
}

export function calculateESG(input: ESGInput): number {
  return clamp(
    input.ambiental * 0.30 +
    input.social * 0.35 +
    input.governanca * 0.35
  )
}

// ─── Interdependency Matrix ───────────────────────────────────────────────────
// Rules applied sequentially — each rule sees the state mutated by previous rules.
// ESG penalizes HUB_SCORE directly (handled in calculateHubScore).

export function applyInterdependencyMatrix(scores: DimensionScores): DimensionScores {
  const s = { ...scores }

  // Rule 1: RH fraco impacta operações
  if (s.rh < 50) {
    s.log = clamp(s.log - s.log * 0.15)
  }

  // Rule 2: LOG fraco impacta financeiro
  if (s.log < 50) {
    s.fin = clamp(s.fin - s.fin * 0.10)
  }

  // Rule 3: FIN fraco impacta marketing
  if (s.fin < 50) {
    s.mkt = clamp(s.mkt - s.mkt * 0.10)
  }

  // Rule 4: MKT forte com LOG fraco cria gargalo operacional
  if (s.mkt > 75 && s.log < 60) {
    s.log = clamp(s.log - s.log * 0.10)
  }

  return s
}

// ─── Dynamic Weights ─────────────────────────────────────────────────────────

export function calculateDynamicWeights(adjusted: DimensionScores): DimensionWeights {
  const weights = { rh: 0.20, fin: 0.25, log: 0.25, mkt: 0.15, esg: 0.15 }

  if (adjusted.fin < 50) weights.fin += 0.05
  if (adjusted.rh < 50)  weights.rh  += 0.05
  if (adjusted.log < 50) weights.log += 0.05

  const total = weights.rh + weights.fin + weights.log + weights.mkt + weights.esg

  return {
    rh:  weights.rh  / total,
    fin: weights.fin / total,
    log: weights.log / total,
    mkt: weights.mkt / total,
    esg: weights.esg / total,
  }
}

// ─── Hub Score ────────────────────────────────────────────────────────────────

export function calculateHubScore(
  adjusted: DimensionScores,
  weights: DimensionWeights
): number {
  let score =
    adjusted.rh  * weights.rh  +
    adjusted.fin * weights.fin +
    adjusted.log * weights.log +
    adjusted.mkt * weights.mkt +
    adjusted.esg * weights.esg

  // ESG penalty
  if (adjusted.esg < 50) {
    score = score - score * 0.10
  }

  return clamp(score)
}

// ─── Strategic Indices ────────────────────────────────────────────────────────

export function calculateIRL(adjusted: DimensionScores): number {
  // Weighted risk: how far each critical dimension is from perfect
  return clamp(
    (100 - adjusted.rh)  * 0.30 +
    (100 - adjusted.log) * 0.40 +
    (100 - adjusted.fin) * 0.30
  )
}

export function classifyIRL(irl: number): IRLLevel {
  if (irl <= 30) return 'Baixo'
  if (irl <= 60) return 'Médio'
  return 'Alto'
}

export function calculateIIH(input: RHInput): number {
  return clamp(
    (100 - input.clima) * 0.40 +
    input.turnover * 0.30 +
    input.absenteismo * 0.30
  )
}

export function classifyIIH(iih: number): IIHLevel {
  if (iih <= 30) return 'Baixo'
  if (iih <= 60) return 'Médio'
  return 'Alto'
}

export function calculateIU(irl: number, iih: number, hubScore: number): number {
  return clamp(
    irl * 0.50 +
    iih * 0.30 +
    (100 - hubScore) * 0.20
  )
}

export function classifyIU(iu: number): IULevel {
  if (iu <= 30) return 'Baixa'
  if (iu <= 60) return 'Média'
  if (iu <= 80) return 'Alta'
  return 'Crítica'
}

// ─── Decision Engine ─────────────────────────────────────────────────────────
// Priority order — first match wins.

export function classifyScenario(
  iih: number,
  iu: number,
  irl: number
): ScenarioClassification {
  if (iih > 70)             return 'bloqueio_automatico'
  if (iu  > 80)             return 'prioridade_critica'
  if (irl > 60)             return 'aprovacao_obrigatoria'
  if (iu  >= 40)            return 'execucao_assistida'
  return 'execucao_automatica'
}

// ─── Action Generation ────────────────────────────────────────────────────────

export function generateActions(adjusted: DimensionScores): string[] {
  const actions: string[] = []

  if (adjusted.rh < 50 && adjusted.log < 60) {
    actions.push(
      'Reunião com equipe de liderança',
      'Revisão de carga de trabalho',
      'Ajuste de metas operacionais'
    )
  }

  if (adjusted.mkt > 75 && adjusted.log < 60) {
    actions.push(
      'Redução de campanhas ativas',
      'Ajuste de capacidade operacional'
    )
  }

  if (adjusted.fin < 50) {
    actions.push(
      'Revisão de estrutura de custos',
      'Controle de despesas',
      'Replanejamento financeiro'
    )
  }

  if (actions.length === 0) {
    actions.push('Manter monitoramento contínuo dos indicadores')
  }

  // Deduplicate while preserving order
  return [...new Set(actions)]
}

// ─── Effectiveness ────────────────────────────────────────────────────────────

export function calculateEffectiveness(obtained: number, expected: number): number {
  if (expected === 0) return 0
  return clamp((obtained / expected) * 100, 0, Infinity)
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

export function runScoringEngine(input: HubInput): DecisionOutput {
  const rawDimensions: DimensionScores = {
    rh:  calculateRH(input.rh),
    fin: calculateFIN(input.fin),
    log: calculateLOG(input.log),
    mkt: calculateMKT(input.mkt),
    esg: calculateESG(input.esg),
  }

  const adjustedDimensions = applyInterdependencyMatrix(rawDimensions)
  const dynamicWeights      = calculateDynamicWeights(adjustedDimensions)
  const hubScore            = calculateHubScore(adjustedDimensions, dynamicWeights)

  const irl = calculateIRL(adjustedDimensions)
  const iih = calculateIIH(input.rh)
  const iu  = calculateIU(irl, iih, hubScore)

  const strategicIndices: StrategicIndices = {
    irl,
    irlLevel: classifyIRL(irl),
    iih,
    iihLevel: classifyIIH(iih),
    iu,
    iuLevel:  classifyIU(iu),
  }

  const scenario = classifyScenario(iih, iu, irl)
  const actions  = generateActions(adjustedDimensions)

  return {
    hubScore,
    rawDimensions,
    adjustedDimensions,
    dynamicWeights,
    strategicIndices,
    scenario,
    actions,
    computedAt: new Date().toISOString(),
  }
}
