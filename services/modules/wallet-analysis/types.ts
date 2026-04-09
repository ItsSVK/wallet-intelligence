export interface BaseCompressedTransaction {
  signature: string
  type: string
  protocol: string
  time: number
  fee: number
  actor: string
}

export interface NftTransferAction {
  kind: 'NFT_TRANSFER'
  from: string | null
  to: string | null
  asset: string | null
}

export interface SolTransferAction {
  kind: 'SOL_TRANSFER'
  transfers: number
  totalAmount: number
  recipients: string[]
  outgoingCount: number
  incomingCount: number
}

export interface TokenTransferAction {
  kind: 'TOKEN_TRANSFER'
  tokens: Array<{
    mint: string
    amount: number | string
  }>
}

export interface UnknownAction {
  kind: 'UNKNOWN'
}

export type CompressedTransactionAction =
  | NftTransferAction
  | SolTransferAction
  | TokenTransferAction
  | UnknownAction

/** The two primary legs of a DEX swap — what was sold and what was received. */
export interface SwapSummary {
  soldMint: string
  soldAmount: number
  boughtMint: string
  boughtAmount: number
}

export interface CompressedTransaction extends BaseCompressedTransaction {
  action: CompressedTransactionAction
  /** Only present when tx.type === 'SWAP' and token legs could be resolved. */
  swap?: SwapSummary
}

export interface GraphEdge {
  from: string
  to: string
}

/** Deterministic features derived from raw Helius txs (counterparties, time, network sketch). */
export interface IntelligencePayload {
  /** Normalized Shannon entropy of the counterparty frequency distribution (0–1). */
  counterparty_entropy: number
  distinct_counterparties: number
  total_counterparty_interactions: number
  top_counterparties: Array<{ address: string; interactions: number }>
  /** Transaction counts per UTC hour (length 24). */
  activity_by_hour: number[]
  peak_hour_utc: number
  /** Number of UTC hours with at least one tx. */
  active_hours_utc: number
  network: {
    center: string
    nodes: Array<{ id: string; kind: 'wallet' | 'counterparty' | 'aggregate'; interactions: number }>
    edges: Array<{ from: string; to: string; weight: number }>
  }
  /** Deterministic hints for the model to interpret (not end-user labels). */
  anomaly_hints: string[]
  fee_stats: {
    avg_lamports: number
    max_lamports: number
  }
}

export interface WalletAnalysisInput {
  /** Rich graph + temporal context; always present (may be empty). */
  intelligence: IntelligencePayload

  summary: {
    total_tx: number
    nft_transfers: number
    sol_transfers: number
    token_transfers: number
    /** Count of txs whose raw type field is "SWAP" */
    swap_count: number
    unique_actors: number
    avg_transfers_per_tx: number
    wallet_type: string
  }

  fees: {
    total_lamports: number
    avg_lamports: number
    max_lamports: number
  }

  sol_stats: {
    total_sol: number
    avg_sol: number
    max_sol: number
    min_sol: number
    /** Number of SOL-transfer txs where totalAmount < 0.001 SOL */
    dust_tx_count: number
  }

  /** Raw tx.type counts, e.g. { SWAP: 42, TRANSFER: 18, UNKNOWN: 5 } */
  tx_types: Record<string, number>

  temporal: {
    oldest_ts: number
    newest_ts: number
    time_span_hours: number
    /**
     * Standard deviation of inter-transaction gaps (seconds).
     * High value = irregular/human, near-zero = highly regular/bot.
     */
    burst_score: number
  }

  activity: {
    tx_per_minute: number
    consistency_score: number
  }

  flow: {
    direction: 'mostly_outgoing' | 'mostly_incoming' | 'balanced'
    outgoing_count: number
    incoming_count: number
  }

  protocols: Record<string, number>

  token_activity: {
    unique_mints: number
    top_tokens: Array<{ mint: string; tx_count: number; total_amount: number }>
  }

  graph: {
    unique_connections: number
    total_edges: number
    concentration_score: number
    hub_score: number
  }

  recent_activity: Array<
    | {
        kind: 'NFT_TRANSFER'
        signature: string
        time: number
        protocol: string
        asset: string | null
      }
    | {
        kind: 'SOL_TRANSFER'
        signature: string
        time: number
        protocol: string
        pattern: string
        transfers: number
        totalAmount: number
        amount_category: string
        intent: string
      }
    | {
        kind: 'TOKEN_TRANSFER'
        signature: string
        time: number
        protocol: string
        tokens: Array<{ mint: string; amount: number | string }>
      }
    | {
        kind: 'UNKNOWN'
        signature: string
        time: number
        type: string
      }
  >
}
