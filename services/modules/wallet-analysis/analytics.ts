import type { CompressedTransaction, WalletAnalysisInput } from './types'
import { buildGraph, computeGraphStats } from './graph'
import {
  classifyAmount,
  classifyIntent,
  classifySolPattern,
  inferWalletType,
  mapProtocol,
} from './classifiers'

const RECENT_ACTIVITY_LIMIT = 5

export function buildWalletAnalysisInput(txs: CompressedTransaction[]): WalletAnalysisInput {
  let nftTransfers = 0
  let solTransfers = 0
  let tokenTransfers = 0
  let totalTransfers = 0
  let totalOutgoing = 0
  let totalIncoming = 0

  const actors = new Set<string>()
  const protocolCounts: Record<string, number> = {}
  const transferCounts: number[] = []

  for (const tx of txs) {
    if (tx.actor) actors.add(tx.actor)

    const protocol = mapProtocol(tx.protocol)
    protocolCounts[protocol] = (protocolCounts[protocol] ?? 0) + 1

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
        break
      case 'TOKEN_TRANSFER':
        tokenTransfers += 1
        break
      case 'UNKNOWN':
        break
    }
  }

  const sorted = [...txs].sort((a, b) => b.time - a.time)
  const newestTime = sorted[0]?.time ?? 0
  const oldestTime = sorted[sorted.length - 1]?.time ?? 0
  const timeSpan = sorted.length > 1 ? newestTime - oldestTime : 0
  const txPerMinute = timeSpan > 0 ? txs.length / (timeSpan / 60) : 0

  const avgTransfers = transferCounts.length
    ? transferCounts.reduce((sum, v) => sum + v, 0) / transferCounts.length
    : 0

  const transferVariance = transferCounts.length
    ? transferCounts.reduce((sum, v) => sum + Math.pow(v - avgTransfers, 2), 0) /
      transferCounts.length
    : 0

  const summaryWithoutWalletType = {
    total_tx: txs.length,
    nft_transfers: nftTransfers,
    sol_transfers: solTransfers,
    token_transfers: tokenTransfers,
    unique_actors: actors.size,
    avg_transfers_per_tx: solTransfers ? totalTransfers / solTransfers : 0,
  }

  const flowDirection =
    totalOutgoing > totalIncoming
      ? 'mostly_outgoing'
      : totalIncoming > totalOutgoing
        ? 'mostly_incoming'
        : ('balanced' as const)

  return {
    summary: {
      ...summaryWithoutWalletType,
      wallet_type: inferWalletType(summaryWithoutWalletType),
    },
    activity: {
      tx_per_minute: txPerMinute,
      consistency_score: avgTransfers ? 1 / (1 + transferVariance) : 0,
    },
    flow: { direction: flowDirection },
    protocols: protocolCounts,
    graph: computeGraphStats(buildGraph(txs)),
    recent_activity: buildRecentActivity(sorted),
  }
}

function buildRecentActivity(txs: CompressedTransaction[]): WalletAnalysisInput['recent_activity'] {
  return txs.slice(0, RECENT_ACTIVITY_LIMIT).map((tx) => {
    switch (tx.action.kind) {
      case 'NFT_TRANSFER':
        return { type: 'NFT_TRANSFER', protocol: mapProtocol(tx.protocol) }

      case 'SOL_TRANSFER':
        return {
          type: 'SOL_TRANSFER',
          protocol: mapProtocol(tx.protocol),
          pattern: classifySolPattern(tx.action.transfers),
          transfers: tx.action.transfers,
          totalAmount: tx.action.totalAmount,
          amount_category: classifyAmount(tx.action.totalAmount),
          intent: classifyIntent(tx),
        }

      case 'TOKEN_TRANSFER':
        return { type: 'TOKEN_TRANSFER', protocol: tx.protocol || 'other' }

      case 'UNKNOWN':
        return { type: tx.action.kind }
    }
  })
}
