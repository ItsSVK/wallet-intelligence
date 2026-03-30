export interface BaseCompressedTransaction {
  signature: string;
  type: string;
  protocol: string;
  time: number;
  fee: number;
  actor: string;
}

export interface NftTransferAction {
  kind: 'NFT_TRANSFER';
  from: string | null;
  to: string | null;
  asset: string | null;
}

export interface SolTransferAction {
  kind: 'SOL_TRANSFER';
  transfers: number;
  totalAmount: number;
  recipients: string[];
  outgoingCount: number;
  incomingCount: number;
}

export interface TokenTransferAction {
  kind: 'TOKEN_TRANSFER';
  tokens: Array<{
    mint: string;
    amount: number | string;
  }>;
}

export interface UnknownAction {
  kind: 'UNKNOWN';
}

export type CompressedTransactionAction =
  | NftTransferAction
  | SolTransferAction
  | TokenTransferAction
  | UnknownAction;

export interface CompressedTransaction extends BaseCompressedTransaction {
  action: CompressedTransactionAction;
}

export interface GraphEdge {
  from: string;
  to: string;
}

export interface WalletAnalysisInput {
  summary: {
    total_tx: number;
    nft_transfers: number;
    sol_transfers: number;
    token_transfers: number;
    unique_actors: number;
    avg_transfers_per_tx: number;
    wallet_type: string;
  };
  activity: {
    tx_per_minute: number;
    consistency_score: number;
  };
  flow: {
    direction: 'mostly_outgoing' | 'mostly_incoming' | 'balanced';
  };
  protocols: Record<string, number>;
  graph: {
    unique_connections: number;
    total_edges: number;
    concentration_score: number;
    hub_score: number;
  };
  recent_activity: Array<
    | {
        type: 'NFT_TRANSFER';
        protocol: string;
      }
    | {
        type: 'SOL_TRANSFER';
        protocol: string;
        pattern: string;
        transfers: number;
        totalAmount: number;
        amount_category: string;
        intent: string;
      }
    | {
        type: 'TOKEN_TRANSFER';
        protocol: string;
      }
    | {
        type: string;
      }
  >;
}
