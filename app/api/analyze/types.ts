export interface AnalyzeResponse {
  address: string
  walletProfile: string
  confidence: number
  riskLevel: 'Low' | 'Medium' | 'High'
  behaviorSummary: string
  signals: { title: string; description: string }[]
  metrics: { txPerMinute: number; consistencyScore: number }
  graph: { uniqueConnections: number; concentrationScore: number; hubScore: number }
  activity: { type: string; pattern: string; intent: string; timestamp: string }[]
  flow: {
    direction: 'mostly_outgoing' | 'mostly_incoming' | 'balanced'
    outgoing: number
    incoming: number
  }
  protocols: { name: string; count: number; pct: number }[]
}

export type AnalyzeStreamEvent =
  | { type: 'init'; steps: string[] }
  | { type: 'step'; index: number }
  | { type: 'done'; result: AnalyzeResponse }
