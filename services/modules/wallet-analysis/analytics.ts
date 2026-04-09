import type { EnhancedTransaction } from 'helius-sdk/enhanced/types'

import type { CompressedTransaction, WalletAnalysisInput } from './types'
import { buildGraph, computeGraphStats } from './graph'
import { buildIntelligence } from './intelligence'
import {
  classifyAmount,
  classifyIntent,
  classifySolPattern,
  inferWalletType,
  mapProtocol,
  normalizeProtocol,
} from './classifiers'

const RECENT_ACTIVITY_LIMIT = 15
const TOP_TOKEN_LIMIT = 10

export function buildWalletAnalysisInput(
  walletAddress: string,
  txs: CompressedTransaction[],
  rawTxs?: EnhancedTransaction[],
): WalletAnalysisInput {
  const intelligence = buildIntelligence(walletAddress, rawTxs ?? [])
  // ── Counters ──────────────────────────────────────────────────────────────
  let nftTransfers = 0
  let solTransfers = 0
  let tokenTransfers = 0
  let swapCount = 0
  let totalTransfers = 0
  let totalOutgoing = 0
  let totalIncoming = 0

  // ── Fee accumulators ──────────────────────────────────────────────────────
  let totalFees = 0
  let maxFee = 0

  // ── SOL amount accumulators ───────────────────────────────────────────────
  const solAmounts: number[] = []
  let dustTxCount = 0

  // ── Transfer variance (consistency) ───────────────────────────────────────
  const transferCounts: number[] = []

  // ── Protocol & type maps ──────────────────────────────────────────────────
  const actors = new Set<string>()
  const protocolCounts: Record<string, number> = {}
  const txTypeCounts: Record<string, number> = {}

  // ── Token mint tracking ───────────────────────────────────────────────────
  const tokenMintCounts: Record<string, number> = {}
  const tokenMintAmounts: Record<string, number> = {}

  for (const tx of txs) {
    if (tx.actor) actors.add(tx.actor)

    // Protocol — use normalized raw name, not collapsed label
    const proto = normalizeProtocol(tx.protocol)
    protocolCounts[proto] = (protocolCounts[proto] ?? 0) + 1

    // Tx type (SWAP, TRANSFER, etc.)
    const txType = (tx.type ?? 'UNKNOWN').toUpperCase()
    txTypeCounts[txType] = (txTypeCounts[txType] ?? 0) + 1
    if (txType === 'SWAP') swapCount++

    // Fee
    totalFees += tx.fee ?? 0
    if ((tx.fee ?? 0) > maxFee) maxFee = tx.fee ?? 0

    switch (tx.action.kind) {
      case 'NFT_TRANSFER':
        nftTransfers += 1
        break

      case 'SOL_TRANSFER':
        solTransfers += 1
        totalTransfers += tx.action.transfers
        totalOutgoing += tx.action.outgoingCount
        totalIncoming += tx.action.incomingCount
        transferCounts.push(tx.action.transfers)
        solAmounts.push(tx.action.totalAmount)
        if (tx.action.totalAmount < 0.001) dustTxCount++
        break

      case 'TOKEN_TRANSFER':
        tokenTransfers += 1
        for (const t of tx.action.tokens) {
          tokenMintCounts[t.mint] = (tokenMintCounts[t.mint] ?? 0) + 1
          const amt = typeof t.amount === 'number' ? t.amount : parseFloat(t.amount as string) || 0
          tokenMintAmounts[t.mint] = (tokenMintAmounts[t.mint] ?? 0) + amt
        }
        break

      case 'UNKNOWN':
        break
    }
  }

  // ── Derived: time / activity ───────────────────────────────────────────────
  const sorted = [...txs].sort((a, b) => b.time - a.time)
  const newestTime = sorted[0]?.time ?? 0
  const oldestTime = sorted[sorted.length - 1]?.time ?? 0
  const timeSpanSec = sorted.length > 1 ? newestTime - oldestTime : 0
  const txPerMinute = timeSpanSec > 0 ? txs.length / (timeSpanSec / 60) : 0

  // Burst score: stddev of inter-tx gaps in seconds
  let burstScore = 0
  if (sorted.length > 2) {
    const gaps: number[] = []
    for (let i = 0; i < sorted.length - 1; i++) {
      gaps.push(Math.abs(sorted[i].time - sorted[i + 1].time))
    }
    const avgGap = gaps.reduce((s, v) => s + v, 0) / gaps.length
    const variance = gaps.reduce((s, v) => s + Math.pow(v - avgGap, 2), 0) / gaps.length
    burstScore = Math.sqrt(variance)
  }

  // ── Derived: SOL stats ─────────────────────────────────────────────────────
  const totalSol = solAmounts.reduce((s, v) => s + v, 0)
  const avgSol = solAmounts.length ? totalSol / solAmounts.length : 0
  const maxSol = solAmounts.length ? Math.max(...solAmounts) : 0
  const minSol = solAmounts.length ? Math.min(...solAmounts) : 0

  // ── Derived: consistency score ─────────────────────────────────────────────
  const avgTransfers = transferCounts.length
    ? transferCounts.reduce((sum, v) => sum + v, 0) / transferCounts.length
    : 0
  const transferVariance = transferCounts.length
    ? transferCounts.reduce((sum, v) => sum + Math.pow(v - avgTransfers, 2), 0) /
      transferCounts.length
    : 0

  // ── Derived: top tokens ────────────────────────────────────────────────────
  const topTokens = Object.entries(tokenMintCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, TOP_TOKEN_LIMIT)
    .map(([mint, tx_count]) => ({
      mint,
      tx_count,
      total_amount: tokenMintAmounts[mint] ?? 0,
    }))

  // ── Derived: flow direction ────────────────────────────────────────────────
  const flowDirection: WalletAnalysisInput['flow']['direction'] =
    totalOutgoing > totalIncoming
      ? 'mostly_outgoing'
      : totalIncoming > totalOutgoing
        ? 'mostly_incoming'
        : 'balanced'

  // ── Assemble summary (without wallet_type first for inferWalletType) ────────
  const summaryWithoutWalletType = {
    total_tx: txs.length,
    nft_transfers: nftTransfers,
    sol_transfers: solTransfers,
    token_transfers: tokenTransfers,
    swap_count: swapCount,
    unique_actors: actors.size,
    avg_transfers_per_tx: solTransfers ? totalTransfers / solTransfers : 0,
  }

  return {
    intelligence,

    summary: {
      ...summaryWithoutWalletType,
      wallet_type: inferWalletType(summaryWithoutWalletType),
    },

    fees: {
      total_lamports: totalFees,
      avg_lamports: txs.length ? Math.round(totalFees / txs.length) : 0,
      max_lamports: maxFee,
    },

    sol_stats: {
      total_sol: totalSol,
      avg_sol: avgSol,
      max_sol: maxSol,
      min_sol: minSol,
      dust_tx_count: dustTxCount,
    },

    tx_types: txTypeCounts,

    temporal: {
      oldest_ts: oldestTime,
      newest_ts: newestTime,
      time_span_hours: timeSpanSec / 3600,
      burst_score: burstScore,
    },

    activity: {
      tx_per_minute: txPerMinute,
      consistency_score: avgTransfers ? 1 / (1 + transferVariance) : 0,
    },

    flow: {
      direction: flowDirection,
      outgoing_count: totalOutgoing,
      incoming_count: totalIncoming,
    },

    protocols: protocolCounts,

    token_activity: {
      unique_mints: Object.keys(tokenMintCounts).length,
      top_tokens: topTokens,
    },

    graph: computeGraphStats(buildGraph(txs)),

    recent_activity: buildRecentActivity(sorted),
  }
}

function buildRecentActivity(txs: CompressedTransaction[]): WalletAnalysisInput['recent_activity'] {
  return txs.slice(0, RECENT_ACTIVITY_LIMIT).map((tx) => {
    switch (tx.action.kind) {
      case 'NFT_TRANSFER':
        return {
          kind: 'NFT_TRANSFER' as const,
          signature: tx.signature,
          time: tx.time,
          protocol: mapProtocol(tx.protocol),
          asset: tx.action.asset,
        }

      case 'SOL_TRANSFER':
        return {
          kind: 'SOL_TRANSFER' as const,
          signature: tx.signature,
          time: tx.time,
          protocol: mapProtocol(tx.protocol),
          pattern: classifySolPattern(tx.action.transfers),
          transfers: tx.action.transfers,
          totalAmount: tx.action.totalAmount,
          amount_category: classifyAmount(tx.action.totalAmount),
          intent: classifyIntent(tx),
        }

      case 'TOKEN_TRANSFER':
        return {
          kind: 'TOKEN_TRANSFER' as const,
          signature: tx.signature,
          time: tx.time,
          protocol: mapProtocol(tx.protocol),
          tokens: tx.action.tokens.map((t) => ({ mint: t.mint, amount: t.amount })),
        }

      case 'UNKNOWN':
        return {
          kind: 'UNKNOWN' as const,
          signature: tx.signature,
          time: tx.time,
          type: tx.type,
        }
    }
  })
}
