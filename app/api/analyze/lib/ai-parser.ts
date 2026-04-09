import type { AnalyzeResponse } from '../types'
import type { WalletAnalysisInput } from '@/services/modules/wallet-analysis/types'

export interface AiInsightCard {
  title?: string
  body?: string
  category?: string
}

export interface ParsedAiAnalysis {
  wallet_profile?: string
  behavior_summary?: string
  /** Array of concise signal strings returned by the AI */
  key_signals?: string[]
  activity_pattern?: string
  flow_analysis?: string
  protocol_usage_insight?: string
  /** Rich cards — primary AI output for the UI */
  insight_cards?: AiInsightCard[]
  anomalies?: string[]
  forecasts?: string[]
  risk_level?: string
  confidence?: string | number
}

export function parseAiAnalysis(message: unknown): ParsedAiAnalysis | null {
  if (message && typeof message === 'object' && !Array.isArray(message)) {
    return normalizeAiShape(message as Record<string, unknown>)
  }

  if (typeof message !== 'string') {
    return null
  }

  const candidates = [message.trim()]
  const fencedMatch = message.match(/```(?:json)?\s*([\s\S]*?)```/i)

  if (fencedMatch?.[1]) {
    candidates.push(fencedMatch[1].trim())
  }

  const firstBrace = message.indexOf('{')
  const lastBrace = message.lastIndexOf('}')

  if (firstBrace !== -1 && lastBrace > firstBrace) {
    candidates.push(message.slice(firstBrace, lastBrace + 1).trim())
  }

  for (const candidate of candidates) {
    if (!candidate) continue

    try {
      const parsed = JSON.parse(candidate)

      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return normalizeAiShape(parsed as Record<string, unknown>)
      }
    } catch {
      continue
    }
  }

  return null
}

function normalizeAiShape(raw: Record<string, unknown>): ParsedAiAnalysis {
  const insight = raw.insight_cards ?? raw.insightCards
  const anomalies = raw.anomalies ?? raw.anomaly_list
  const forecasts = raw.forecasts ?? raw.behavioral_forecasts

  return {
    ...raw,
    insight_cards: Array.isArray(insight)
      ? (insight as ParsedAiAnalysis['insight_cards'])
      : undefined,
    anomalies: Array.isArray(anomalies) ? (anomalies as string[]) : undefined,
    forecasts: Array.isArray(forecasts) ? (forecasts as string[]) : undefined,
  } as ParsedAiAnalysis
}

export function normalizeConfidence(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return clampPercentage(value)
  }

  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim().toLowerCase()
  const mapped = ({ low: 55, medium: 75, high: 90 } as Record<string, number>)[normalized]

  if (mapped !== undefined) {
    return mapped
  }

  const numeric = Number.parseFloat(normalized)
  return Number.isFinite(numeric) ? clampPercentage(numeric) : null
}

export function normalizeRiskLevel(value: unknown): AnalyzeResponse['riskLevel'] | null {
  if (typeof value !== 'string') return null

  const normalized = value.trim().toLowerCase()

  if (normalized === 'low') return 'Low'
  if (normalized === 'medium') return 'Medium'
  if (normalized === 'high') return 'High'

  return null
}

export function resolveConfidence(ai: ParsedAiAnalysis | null, input: WalletAnalysisInput): number {
  const parsed = normalizeConfidence(ai?.confidence)
  if (parsed !== null) return parsed
  return clampPercentage(45 + Math.min(input.summary.total_tx, 20) * 2)
}

export function resolveRiskLevel(
  ai: ParsedAiAnalysis | null,
  input: WalletAnalysisInput,
): AnalyzeResponse['riskLevel'] {
  const parsed = normalizeRiskLevel(ai?.risk_level)
  if (parsed) return parsed

  const intel = input.intelligence
  const score =
    input.activity.tx_per_minute * 20 +
    input.graph.concentration_score * 50 +
    (input.flow.direction === 'mostly_outgoing' ? 10 : 0) +
    (input.summary.wallet_type === 'distributor' ? 15 : 0) +
    // Elevated fees + high consistency → possible bot
    (input.fees.avg_lamports > 5000 && input.activity.consistency_score > 0.8 ? 15 : 0) +
    // Many dust transfers → spam/airdrop pattern
    (input.sol_stats.dust_tx_count > 5 ? 10 : 0) +
    // High swap count relative to total → DEX bot risk
    (input.summary.swap_count / Math.max(input.summary.total_tx, 1) > 0.5 ? 10 : 0) +
    // Helius-derived: many heuristic flags
    (intel.anomaly_hints.length >= 3 ? 8 : intel.anomaly_hints.length >= 1 ? 3 : 0) +
    // Tight counterparty concentration with volume
    (intel.counterparty_entropy < 0.12 && intel.distinct_counterparties > 6 ? 6 : 0)

  if (score >= 80) return 'High'
  if (score >= 35) return 'Medium'
  return 'Low'
}

function clampPercentage(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}
