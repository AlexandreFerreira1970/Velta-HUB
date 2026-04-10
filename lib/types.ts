export interface VeltaUser {
  id: string; // Google OAuth sub
  email: string;
  name: string;
  image?: string | null;
  provider: "google";
  companyName?: string;
  businessType?: string;
  hubAnalysisDone?: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string;
  lastLoginAt: string;
}

// ─── Hub Scoring Engine ───────────────────────────────────────────────────────

export interface RHInput {
  turnover: number; // 0-100 (quanto maior, pior)
  clima: number; // 0-100 (quanto maior, melhor)
  engajamento: number; // 0-100 (quanto maior, melhor)
  absenteismo: number; // 0-100 (quanto maior, pior)
}

export interface FINInput {
  margem: number; // 0-100
  caixa: number; // 0-100
  crescimento: number; // 0-100
  endividamento: number; // 0-100 (quanto maior, pior)
}

export interface LOGInput {
  produtividade: number; // 0-100
  capacidade: number; // 0-100
  retrabalho: number; // 0-100 (quanto maior, pior)
  tempoEntrega: number; // 0-100
}

export interface MKTInput {
  leads: number; // 0-100
  conversao: number; // 0-100
  retencao: number; // 0-100
  cac: number; // 0-100 (quanto maior, pior)
}

export interface ESGInput {
  ambiental: number; // 0-100
  social: number; // 0-100
  governanca: number; // 0-100
}

export interface HubInput {
  acoes: string[];
  rh: RHInput;
  fin: FINInput;
  log: LOGInput;
  mkt: MKTInput;
  esg: ESGInput;
}

export interface DimensionScores {
  rh: number;
  fin: number;
  log: number;
  mkt: number;
  esg: number;
}

export interface DimensionWeights {
  rh: number;
  fin: number;
  log: number;
  mkt: number;
  esg: number;
}

export type ScenarioClassification =
  | "bloqueio_automatico"
  | "prioridade_critica"
  | "aprovacao_obrigatoria"
  | "execucao_assistida"
  | "execucao_automatica";

export type IULevel = "Baixa" | "Média" | "Alta" | "Crítica";
export type IRLLevel = "Baixo" | "Médio" | "Alto";
export type IIHLevel = "Baixo" | "Médio" | "Alto";

export interface StrategicIndices {
  irl: number;
  irlLevel: IRLLevel;
  iih: number;
  iihLevel: IIHLevel;
  iu: number;
  iuLevel: IULevel;
}

export interface DecisionOutput {
  hubScore: number;
  rawDimensions: DimensionScores;
  adjustedDimensions: DimensionScores;
  dynamicWeights: DimensionWeights;
  strategicIndices: StrategicIndices;
  scenario: ScenarioClassification;
  actions: string[];
  computedAt: string;
}

export interface HubDataDoc {
  id: string;
  userId: string;
  conversationId?: string;
  input: HubInput;
  output: DecisionOutput;
  createdAt: string;
}

export interface DecisionRecord {
  id: string;
  userId: string;
  scenario: ScenarioClassification;
  actions: string[];
  hubScore: number;
  expectedResult: string;
  obtainedResult?: string;
  effectiveness?: number;
  createdAt: string;
  resolvedAt?: string;
}
