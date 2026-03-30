import type { AnalyzeResponse } from '../types'
import type { WalletAnalysisInput } from '@/services/modules/wallet-analysis/types'

export interface ParsedAiAnalysis {
  wallet_profile?: string
  behavior_summary?: string
  activity_pattern?: string
  flow_analysis?: string
  protocol_usage_insight?: string
  risk_level?: string
  confidence?: string | number
}

export function parseAiAnalysis(message: unknown): ParsedAiAnalysis | null {
  if (message && typeof message === 'object' && !Array.isArray(message)) {
    return message as ParsedAiAnalysis
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
        return parsed as ParsedAiAnalysis
      }
    } catch {
      continue
    }
  }

  return null
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

  const score =
    input.activity.tx_per_minute * 20 +
    input.graph.concentration_score * 50 +
    (input.flow.direction === 'mostly_outgoing' ? 10 : 0) +
    (input.summary.wallet_type === 'distributor' ? 15 : 0)

  if (score >= 80) return 'High'
  if (score >= 35) return 'Medium'
  return 'Low'
}

function clampPercentage(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}
