import type { AnalyzeResponse } from '../types'
import type {
  CompressedTransaction,
  WalletAnalysisInput,
} from '@/services/modules/wallet-analysis/types'
import type { AnalyzeWalletResult } from '@/services/types'
import {
  parseAiAnalysis,
  resolveConfidence,
  resolveRiskLevel,
  type ParsedAiAnalysis,
} from './ai-parser'
import {
  buildActivity,
  buildFlow,
  buildProtocols,
  clampPercentage,
  humanizeFlowDirection,
  humanizeLabel,
  roundTo,
} from './data-builders'

export function adaptAnalyzeResult(
  result: AnalyzeWalletResult & { compressedTransactions: CompressedTransaction[] },
): AnalyzeResponse {
  const ai = parseAiAnalysis(result.responseMessage)
  const flow = buildFlow(result.compressedTransactions, result.input.flow.direction)
  const protocols = buildProtocols(result.input.protocols)
  const graph = {
    uniqueConnections: result.input.graph.unique_connections,
    concentrationScore: clampPercentage(result.input.graph.concentration_score * 100),
    hubScore: clampPercentage((1 - 1 / (1 + Math.max(0, result.input.graph.hub_score))) * 100),
  }
  const walletProfile = resolveWalletProfile(ai, result.input.summary.wallet_type)

  return {
    address: result.walletAddress,
    walletProfile,
    confidence: resolveConfidence(ai, result.input),
    riskLevel: resolveRiskLevel(ai, result.input),
    behaviorSummary: buildBehaviorSummary(ai, result.input, flow, protocols, walletProfile, result.aiError),
    signals: buildSignals(result.input, flow, graph, protocols, walletProfile),
    metrics: {
      txPerMinute: roundTo(result.input.activity.tx_per_minute, 2),
      consistencyScore: clampPercentage(result.input.activity.consistency_score * 100),
    },
    graph,
    activity: buildActivity(result.compressedTransactions, result.input.recent_activity),
    flow,
    protocols,
  }
}

// ─── Resolvers ───────────────────────────────────────────────────────────────

function resolveWalletProfile(ai: ParsedAiAnalysis | null, walletType: string): string {
  const profile = ai?.wallet_profile?.trim()
  if (profile) return profile

  const fallback: Record<string, string> = {
    distributor: 'Distributor Wallet',
    nft_user: 'NFT-Focused Wallet',
    regular_user: 'Regular User',
  }
  return fallback[walletType] ?? 'General Activity Wallet'
}

// ─── Narrative builders ───────────────────────────────────────────────────────

function buildBehaviorSummary(
  ai: ParsedAiAnalysis | null,
  input: WalletAnalysisInput,
  flow: AnalyzeResponse['flow'],
  protocols: AnalyzeResponse['protocols'],
  walletProfile: string,
  aiError: string | null,
): string {
  const aiParts = [
    ai?.behavior_summary?.trim(),
    ai?.activity_pattern?.trim(),
    ai?.flow_analysis?.trim(),
    ai?.protocol_usage_insight?.trim(),
  ].filter((v): v is string => Boolean(v))

  if (aiParts.length > 0) return aiParts.join(' ')

  const topProtocol = protocols[0]
  const protocolSentence = topProtocol
    ? `${humanizeLabel(topProtocol.name)} accounts for ${topProtocol.pct}% of the sampled activity.`
    : 'Protocol concentration is still being backfilled.'
  const aiStatusSentence = aiError
    ? 'AI interpretation was unavailable for this run, so this summary is derived from transaction heuristics.'
    : ''

  return [
    `${walletProfile} behavior inferred from ${input.summary.total_tx} sampled transactions.`,
    `Flow is ${humanizeFlowDirection(input.flow.direction)} with ${flow.outgoing}% outgoing and ${flow.incoming}% incoming SOL transfer counts.`,
    `Observed activity averages ${roundTo(input.activity.tx_per_minute, 2)} tx/min with a ${clampPercentage(input.activity.consistency_score * 100)}% consistency score.`,
    protocolSentence,
    aiStatusSentence,
  ]
    .filter(Boolean)
    .join(' ')
}

function buildSignals(
  input: WalletAnalysisInput,
  flow: AnalyzeResponse['flow'],
  graph: AnalyzeResponse['graph'],
  protocols: AnalyzeResponse['protocols'],
  walletProfile: string,
): AnalyzeResponse['signals'] {
  const topProtocol = protocols[0]

  return [
    {
      title: 'Wallet Type Heuristic',
      description: `Structured heuristics classify this wallet as ${walletProfile.toLowerCase()} across ${input.summary.total_tx} sampled transactions.`,
    },
    {
      title: 'Flow Direction',
      description: `${humanizeFlowDirection(input.flow.direction)} transfer flow with ${flow.outgoing}% outgoing and ${flow.incoming}% incoming SOL movement.`,
    },
    {
      title: 'Graph Concentration',
      description: `The interaction graph spans ${graph.uniqueConnections} unique connections with ${graph.concentrationScore}% concentration and ${graph.hubScore}% hub intensity.`,
    },
    {
      title: topProtocol ? `${humanizeLabel(topProtocol.name)} Usage` : 'Protocol Usage',
      description: topProtocol
        ? `${humanizeLabel(topProtocol.name)} accounts for ${topProtocol.pct}% of the sampled transaction set.`
        : 'Protocol distribution is not available yet.',
    },
  ]
}
