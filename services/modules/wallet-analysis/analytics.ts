import type { CompressedTransaction, GraphEdge, WalletAnalysisInput } from './types';

const RECENT_ACTIVITY_LIMIT = 5;

export function buildWalletAnalysisInput(
  txs: CompressedTransaction[],
): WalletAnalysisInput {
  let nftTransfers = 0;
  let solTransfers = 0;
  let tokenTransfers = 0;
  let totalTransfers = 0;
  let totalOutgoing = 0;
  let totalIncoming = 0;

  const actors = new Set<string>();
  const protocolCounts: Record<string, number> = {};
  const transferCounts: number[] = [];

  for (const tx of txs) {
    if (tx.actor) {
      actors.add(tx.actor);
    }

    const mappedProtocol = mapProtocol(tx.protocol);
    protocolCounts[mappedProtocol] = (protocolCounts[mappedProtocol] ?? 0) + 1;

    switch (tx.action.kind) {
      case 'NFT_TRANSFER':
        nftTransfers += 1;
        break;
      case 'SOL_TRANSFER':
        solTransfers += 1;
        totalTransfers += tx.action.transfers;
        totalOutgoing += tx.action.outgoingCount;
        totalIncoming += tx.action.incomingCount;
        transferCounts.push(tx.action.transfers);
        break;
      case 'TOKEN_TRANSFER':
        tokenTransfers += 1;
        break;
      case 'UNKNOWN':
        break;
    }
  }

  const sortedTransactions = [...txs].sort((left, right) => right.time - left.time);
  const newestTime = sortedTransactions[0]?.time ?? 0;
  const oldestTime = sortedTransactions[sortedTransactions.length - 1]?.time ?? 0;
  const timeSpan = sortedTransactions.length > 1 ? newestTime - oldestTime : 0;
  const txPerMinute = timeSpan > 0 ? txs.length / (timeSpan / 60) : 0;

  const averageTransfers = transferCounts.length
    ? transferCounts.reduce((sum, value) => sum + value, 0) / transferCounts.length
    : 0;

  const transferVariance = transferCounts.length
    ? transferCounts.reduce(
        (sum, value) => sum + Math.pow(value - averageTransfers, 2),
        0,
      ) / transferCounts.length
    : 0;

  const summaryWithoutWalletType = {
    total_tx: txs.length,
    nft_transfers: nftTransfers,
    sol_transfers: solTransfers,
    token_transfers: tokenTransfers,
    unique_actors: actors.size,
    avg_transfers_per_tx: solTransfers ? totalTransfers / solTransfers : 0,
  };

  const flowDirection =
    totalOutgoing > totalIncoming
      ? 'mostly_outgoing'
      : totalIncoming > totalOutgoing
        ? 'mostly_incoming'
        : 'balanced';

  const graph = computeGraphStats(buildGraph(txs));

  return {
    summary: {
      ...summaryWithoutWalletType,
      wallet_type: inferWalletType(summaryWithoutWalletType),
    },
    activity: {
      tx_per_minute: txPerMinute,
      consistency_score: averageTransfers ? 1 / (1 + transferVariance) : 0,
    },
    flow: {
      direction: flowDirection,
    },
    protocols: protocolCounts,
    graph,
    recent_activity: buildRecentActivity(sortedTransactions),
  };
}

function buildRecentActivity(
  txs: CompressedTransaction[],
): WalletAnalysisInput['recent_activity'] {
  return txs.slice(0, RECENT_ACTIVITY_LIMIT).map(tx => {
    switch (tx.action.kind) {
      case 'NFT_TRANSFER':
        return {
          type: 'NFT_TRANSFER',
          protocol: mapProtocol(tx.protocol),
        };
      case 'SOL_TRANSFER':
        return {
          type: 'SOL_TRANSFER',
          protocol: mapProtocol(tx.protocol),
          pattern: classifySolPattern(tx.action.transfers),
          transfers: tx.action.transfers,
          totalAmount: tx.action.totalAmount,
          amount_category: classifyAmount(tx.action.totalAmount),
          intent: classifyIntent(tx),
        };
      case 'TOKEN_TRANSFER':
        return {
          type: 'TOKEN_TRANSFER',
          protocol: tx.protocol || 'other',
        };
      case 'UNKNOWN':
        return {
          type: tx.action.kind,
        };
    }
  });
}

function buildGraph(txs: CompressedTransaction[]): GraphEdge[] {
  const edges: GraphEdge[] = [];

  for (const tx of txs) {
    if (tx.action.kind !== 'SOL_TRANSFER') {
      continue;
    }

    for (const recipient of tx.action.recipients) {
      edges.push({
        from: tx.actor,
        to: recipient,
      });
    }
  }

  return edges;
}

function computeGraphStats(
  edges: GraphEdge[],
): WalletAnalysisInput['graph'] {
  if (edges.length === 0) {
    return {
      unique_connections: 0,
      total_edges: 0,
      concentration_score: 0,
      hub_score: 0,
    };
  }

  const frequencies: Record<string, number> = {};
  const uniqueAddresses = new Set<string>();

  for (const edge of edges) {
    uniqueAddresses.add(edge.to);
    frequencies[edge.to] = (frequencies[edge.to] ?? 0) + 1;
  }

  const totalEdges = edges.length;
  const maxFrequency = Math.max(...Object.values(frequencies));

  return {
    unique_connections: uniqueAddresses.size,
    total_edges: totalEdges,
    concentration_score: totalEdges ? maxFrequency / totalEdges : 0,
    hub_score: totalEdges / (uniqueAddresses.size || 1),
  };
}

function classifySolPattern(transfers: number): string {
  if (transfers === 1) {
    return 'single';
  }

  if (transfers < 5) {
    return 'few';
  }

  return 'multi-recipient';
}

function classifyAmount(sol: number): string {
  if (sol < 0.001) {
    return 'dust';
  }

  if (sol < 0.1) {
    return 'small';
  }

  if (sol < 10) {
    return 'medium';
  }

  return 'large';
}

function mapProtocol(protocol: string): string {
  if (protocol === 'SYSTEM_PROGRAM') {
    return 'sol_transfer';
  }

  if (protocol === 'BUBBLEGUM') {
    return 'compressed_nft';
  }

  return 'other';
}

function classifyIntent(tx: CompressedTransaction): string {
  if (tx.action.kind === 'SOL_TRANSFER') {
    if (
      tx.action.transfers > 5 &&
      classifyAmount(tx.action.totalAmount) === 'dust'
    ) {
      return 'airdrop_distribution';
    }

    if (tx.action.transfers === 1) {
      return 'payment';
    }
  }

  if (tx.action.kind === 'NFT_TRANSFER') {
    return 'nft_activity';
  }

  return 'unknown';
}

function inferWalletType(
  summary: Omit<WalletAnalysisInput['summary'], 'wallet_type'>,
): string {
  if (summary.avg_transfers_per_tx > 10) {
    return 'distributor';
  }

  if (summary.nft_transfers > summary.sol_transfers) {
    return 'nft_user';
  }

  if (summary.sol_transfers > 0 && summary.avg_transfers_per_tx < 2) {
    return 'regular_user';
  }

  return 'unknown';
}
