import type { CompressedTransaction, GraphEdge, WalletAnalysisInput } from './types'

export function buildGraph(txs: CompressedTransaction[]): GraphEdge[] {
  const edges: GraphEdge[] = []

  for (const tx of txs) {
    if (tx.action.kind !== 'SOL_TRANSFER') continue

    for (const recipient of tx.action.recipients) {
      edges.push({ from: tx.actor, to: recipient })
    }
  }

  return edges
}

export function computeGraphStats(edges: GraphEdge[]): WalletAnalysisInput['graph'] {
  if (edges.length === 0) {
    return { unique_connections: 0, total_edges: 0, concentration_score: 0, hub_score: 0 }
  }

  const frequencies: Record<string, number> = {}
  const uniqueAddresses = new Set<string>()

  for (const edge of edges) {
    uniqueAddresses.add(edge.to)
    frequencies[edge.to] = (frequencies[edge.to] ?? 0) + 1
  }

  const totalEdges = edges.length
  const maxFrequency = Math.max(...Object.values(frequencies))

  return {
    unique_connections: uniqueAddresses.size,
    total_edges: totalEdges,
    concentration_score: totalEdges ? maxFrequency / totalEdges : 0,
    hub_score: totalEdges / (uniqueAddresses.size || 1),
  }
}
