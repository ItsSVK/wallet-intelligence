import type { EnhancedTransaction } from 'helius-sdk/enhanced/types'

import type { IntelligencePayload } from './types'

const TOP_COUNTERPARTY_LIMIT = 16
const NETWORK_NODE_LIMIT = 9

/**
 * Builds counterparty distribution, temporal buckets, and a small network sketch
 * from raw Helius enhanced transactions. Used for graph UI + AI context.
 */
export function buildIntelligence(
  walletAddress: string,
  txs: EnhancedTransaction[],
): IntelligencePayload {
  if (txs.length === 0) {
    return emptyIntelligence(walletAddress)
  }

  const counterpartyCounts = new Map<string, number>()
  const hourly = new Array(24).fill(0)

  for (const tx of txs) {
    const ts = tx.timestamp ?? 0
    if (ts > 0) {
      hourly[new Date(ts * 1000).getUTCHours()] += 1
    }

    const fp = (tx.feePayer ?? walletAddress).trim()
    const others = new Set<string>()

    const addOther = (addr: string | undefined) => {
      const a = addr?.trim()
      if (!a || a === fp) return
      others.add(a)
    }

    for (const nt of tx.nativeTransfers ?? []) {
      if (nt.fromUserAccount === fp) addOther(nt.toUserAccount)
      else if (nt.toUserAccount === fp) addOther(nt.fromUserAccount)
    }
    for (const tt of tx.tokenTransfers ?? []) {
      if (tt.fromUserAccount === fp) addOther(tt.toUserAccount)
      else if (tt.toUserAccount === fp) addOther(tt.fromUserAccount)
    }

    for (const o of others) {
      counterpartyCounts.set(o, (counterpartyCounts.get(o) ?? 0) + 1)
    }
  }

  const sorted = [...counterpartyCounts.entries()].sort((a, b) => b[1] - a[1])
  const topCounterparties = sorted
    .slice(0, TOP_COUNTERPARTY_LIMIT)
    .map(([address, interactions]) => ({ address, interactions }))

  const totalCpInteractions = [...counterpartyCounts.values()].reduce((s, v) => s + v, 0)
  let entropyNorm = 0
  if (totalCpInteractions > 0 && counterpartyCounts.size > 1) {
    let h = 0
    for (const c of counterpartyCounts.values()) {
      const p = c / totalCpInteractions
      h -= p * Math.log2(p)
    }
    const maxH = Math.log2(counterpartyCounts.size)
    entropyNorm = maxH > 0 ? h / maxH : 0
  }

  const network = buildNetworkSketch(walletAddress, sorted, txs.length)

  const fees = txs.map((t) => t.fee ?? 0)
  const avgFee = fees.length ? fees.reduce((a, b) => a + b, 0) / fees.length : 0
  const maxFee = fees.length ? Math.max(...fees) : 0

  const peakHour = hourly.indexOf(Math.max(...hourly))
  const activeHours = hourly.filter((c) => c > 0).length

  const anomaly_hints: string[] = []
  if (entropyNorm < 0.12 && sorted.length > 4) {
    anomaly_hints.push('counterparty_concentration: most activity routes through few addresses')
  }
  if (entropyNorm > 0.88 && sorted.length > 12) {
    anomaly_hints.push('counterparty_dispersion: many distinct counterparties in the sample')
  }
  if (avgFee > 0 && maxFee > avgFee * 6) {
    anomaly_hints.push('fee_outlier: at least one transaction paid a much higher fee than average')
  }
  if (activeHours <= 3 && txs.length > 15) {
    anomaly_hints.push('time_concentration: activity clusters in a small number of UTC hours')
  }

  return {
    counterparty_entropy: Number(entropyNorm.toFixed(3)),
    distinct_counterparties: counterpartyCounts.size,
    total_counterparty_interactions: totalCpInteractions,
    top_counterparties: topCounterparties,
    activity_by_hour: hourly,
    peak_hour_utc: peakHour,
    active_hours_utc: activeHours,
    network,
    anomaly_hints,
    fee_stats: {
      avg_lamports: Math.round(avgFee),
      max_lamports: maxFee,
    },
  }
}

function buildNetworkSketch(
  walletAddress: string,
  sorted: [string, number][],
  totalTx: number,
): IntelligencePayload['network'] {
  const topSlice = sorted.slice(0, NETWORK_NODE_LIMIT)
  let otherWeight = 0
  for (let i = NETWORK_NODE_LIMIT; i < sorted.length; i++) otherWeight += sorted[i][1]

  const nodes: IntelligencePayload['network']['nodes'] = [
    { id: walletAddress, kind: 'wallet', interactions: totalTx },
  ]

  for (const [addr, w] of topSlice) {
    nodes.push({ id: addr, kind: 'counterparty', interactions: w })
  }

  if (otherWeight > 0) {
    nodes.push({ id: '__other__', kind: 'aggregate', interactions: otherWeight })
  }

  const edges: IntelligencePayload['network']['edges'] = topSlice.map(([addr, weight]) => ({
    from: walletAddress,
    to: addr,
    weight,
  }))
  if (otherWeight > 0) {
    edges.push({ from: walletAddress, to: '__other__', weight: otherWeight })
  }

  return { center: walletAddress, nodes, edges }
}

function emptyIntelligence(walletAddress: string): IntelligencePayload {
  return {
    counterparty_entropy: 0,
    distinct_counterparties: 0,
    total_counterparty_interactions: 0,
    top_counterparties: [],
    activity_by_hour: new Array(24).fill(0),
    peak_hour_utc: 0,
    active_hours_utc: 0,
    network: {
      center: walletAddress,
      nodes: [{ id: walletAddress, kind: 'wallet', interactions: 0 }],
      edges: [],
    },
    anomaly_hints: [],
    fee_stats: { avg_lamports: 0, max_lamports: 0 },
  }
}
