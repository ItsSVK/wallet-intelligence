export interface InsightCard {
  title: string
  body: string
  category: 'counterparty' | 'temporal' | 'risk' | 'behavior' | 'protocol' | 'fees' | 'other'
}

export interface NetworkNode {
  id: string
  kind: 'wallet' | 'counterparty' | 'aggregate'
  interactions: number
}

export interface IntelligenceView {
  counterpartyEntropy: number
  distinctCounterparties: number
  peakHourUtc: number
  activeHoursUtc: number
  activityByHour: number[]
  topCounterparties: Array<{ address: string; interactions: number }>
  network: {
    center: string
    nodes: NetworkNode[]
    edges: Array<{ from: string; to: string; weight: number }>
  }
  anomalyHints: string[]
}

export interface AnalyzeResponse {
  address: string
  walletProfile: string
  confidence: number
  riskLevel: 'Low' | 'Medium' | 'High'
  behaviorSummary: string
  /** Deterministic graph + temporal features */
  intelligence: IntelligenceView
  /** AI-generated insight cards (4–7) + soft forecasts */
  aiInsights: {
    cards: InsightCard[]
    anomalies: string[]
    forecasts: string[]
  }
  signals: { title: string; description: string }[]
  metrics: {
    txPerMinute: number
    consistencyScore: number
    avgFeeLamports: number
    swapCount: number
    dustTxCount: number
  }
  graph: { uniqueConnections: number; concentrationScore: number; hubScore: number }
  activity: {
    type: string
    pattern: string
    intent: string
    timestamp: string
    /** Full transaction signature — used for the Solscan deep-link */
    signature: string
    /** Optional human-readable transfer detail, e.g. "↑ 0.05 SOL" or "4xAB…cD12 → 9kLM…eF34" */
    detail?: string
  }[]
  flow: {
    direction: 'mostly_outgoing' | 'mostly_incoming' | 'balanced'
    outgoing: number
    incoming: number
  }
  protocols: { name: string; count: number; pct: number }[]
  tokenActivity: {
    uniqueMints: number
    topTokens: Array<{ mint: string; txCount: number }>
  }
}

export type AnalyzeStreamEvent =
  | { type: 'init'; steps: string[] }
  | { type: 'step'; index: number }
  | { type: 'done'; result: AnalyzeResponse }
