import type { AnalyzeResponse, InsightCard } from '../types'
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

function buildAiInsights(
  ai: ParsedAiAnalysis | null,
  input: WalletAnalysisInput,
): AnalyzeResponse['aiInsights'] {
  const cards: InsightCard[] = []

  if (ai?.insight_cards && Array.isArray(ai.insight_cards)) {
    for (const c of ai.insight_cards) {
      const title = typeof c.title === 'string' ? c.title.trim() : ''
      const body = typeof c.body === 'string' ? c.body.trim() : ''
      if (!title || !body) continue
      cards.push({
        title,
        body,
        category: normalizeInsightCategory(c.category),
      })
    }
  }

  if (cards.length < 4) {
    const seen = new Set(cards.map((c) => c.title.toLowerCase()))
    for (const f of buildFallbackInsightCards(input)) {
      if (cards.length >= 8) break
      if (!seen.has(f.title.toLowerCase())) {
        cards.push(f)
        seen.add(f.title.toLowerCase())
      }
    }
  }

  const anomalies = Array.isArray(ai?.anomalies)
    ? ai.anomalies.filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
    : []

  const forecasts = Array.isArray(ai?.forecasts)
    ? ai.forecasts.filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
    : []

  return { cards: cards.slice(0, 10), anomalies, forecasts }
}
import {
  buildActivity,
  buildFallbackInsightCards,
  buildFlow,
  buildIntelligenceView,
  buildProtocols,
  buildTokenActivity,
  clampPercentage,
  humanizeFlowDirection,
  humanizeLabel,
  normalizeInsightCategory,
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
    behaviorSummary: buildBehaviorSummary(
      ai,
      result.input,
      flow,
      protocols,
      walletProfile,
      result.aiError,
    ),
    intelligence: buildIntelligenceView(result.input.intelligence),
    aiInsights: buildAiInsights(ai, result.input),
    signals: buildSignals(result.input, flow, graph, protocols, walletProfile),
    metrics: {
      txPerMinute: roundTo(result.input.activity.tx_per_minute, 2),
      consistencyScore: clampPercentage(result.input.activity.consistency_score * 100),
      avgFeeLamports: result.input.fees.avg_lamports,
      swapCount: result.input.summary.swap_count,
      dustTxCount: result.input.sol_stats.dust_tx_count,
    },
    graph,
    activity: buildActivity(result.compressedTransactions, result.input.recent_activity),
    flow,
    protocols,
    tokenActivity: buildTokenActivity(result.input.token_activity),
  }
}

// ─── Resolvers ───────────────────────────────────────────────────────────────

function resolveWalletProfile(ai: ParsedAiAnalysis | null, walletType: string): string {
  const profile = ai?.wallet_profile?.trim()
  if (profile) return profile

  const fallback: Record<string, string> = {
    dex_trader: 'DEX Trader',
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
  const feeSentence =
    input.fees.avg_lamports > 0
      ? `Average fee: ${input.fees.avg_lamports.toLocaleString()} lamports.`
      : ''
  const swapSentence =
    input.summary.swap_count > 0
      ? `${input.summary.swap_count} swap transaction${input.summary.swap_count === 1 ? '' : 's'} detected.`
      : ''
  const aiStatusSentence = aiError
    ? 'AI interpretation was unavailable for this run, so this summary is derived from transaction heuristics.'
    : ''

  return [
    `${walletProfile} behavior inferred from ${input.summary.total_tx} sampled transactions.`,
    `Flow is ${humanizeFlowDirection(input.flow.direction)} with ${flow.outgoing}% outgoing and ${flow.incoming}% incoming SOL transfer counts.`,
    `Observed activity averages ${roundTo(input.activity.tx_per_minute, 2)} tx/min with a ${clampPercentage(input.activity.consistency_score * 100)}% consistency score.`,
    protocolSentence,
    feeSentence,
    swapSentence,
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
  const signals: AnalyzeResponse['signals'] = []

  signals.push({
    title: 'Wallet Type Heuristic',
    description: `Structured heuristics classify this wallet as ${walletProfile.toLowerCase()} across ${input.summary.total_tx} sampled transactions.`,
  })

  signals.push({
    title: 'Flow Direction',
    description: `${humanizeFlowDirection(input.flow.direction)} transfer flow with ${flow.outgoing}% outgoing and ${flow.incoming}% incoming SOL movement (${input.flow.outgoing_count} out / ${input.flow.incoming_count} in).`,
  })

  signals.push({
    title: 'Graph Concentration',
    description: `The interaction graph spans ${graph.uniqueConnections} unique connections with ${graph.concentrationScore}% concentration and ${graph.hubScore}% hub intensity.`,
  })

  signals.push({
    title: topProtocol ? `${humanizeLabel(topProtocol.name)} Usage` : 'Protocol Usage',
    description: topProtocol
      ? `${humanizeLabel(topProtocol.name)} accounts for ${topProtocol.pct}% of the sampled transaction set.`
      : 'Protocol distribution is not available yet.',
  })

  // Fee signal
  if (input.fees.avg_lamports > 0) {
    const feeLabel =
      input.fees.avg_lamports > 10_000
        ? 'elevated (possible automation or complex programs)'
        : input.fees.avg_lamports > 5_000
          ? 'moderate'
          : 'low'
    signals.push({
      title: 'Fee Profile',
      description: `Average fee ${input.fees.avg_lamports.toLocaleString()} lamports (${feeLabel}), max ${input.fees.max_lamports.toLocaleString()} lamports across ${input.summary.total_tx} transactions.`,
    })
  }

  // Swap / DEX signal
  if (input.summary.swap_count > 0) {
    const swapPct = clampPercentage((input.summary.swap_count / input.summary.total_tx) * 100)
    signals.push({
      title: 'DEX Activity',
      description: `${input.summary.swap_count} swap transactions detected (${swapPct}% of all activity), indicating active DEX usage.`,
    })
  }

  // Dust signal
  if (input.sol_stats.dust_tx_count > 3) {
    const dustPct = clampPercentage(
      (input.sol_stats.dust_tx_count / Math.max(input.summary.sol_transfers, 1)) * 100,
    )
    signals.push({
      title: 'Dust Transfer Pattern',
      description: `${input.sol_stats.dust_tx_count} dust SOL transfers (< 0.001 SOL) found — ${dustPct}% of SOL transfers. May indicate airdrop distribution or spam activity.`,
    })
  }

  // Token activity signal
  if (input.token_activity.unique_mints > 0) {
    signals.push({
      title: 'Token Activity',
      description: `${input.token_activity.unique_mints} unique token mint${input.token_activity.unique_mints === 1 ? '' : 's'} interacted with across ${input.summary.token_transfers} token transfer transactions.`,
    })
  }

  return signals
}
