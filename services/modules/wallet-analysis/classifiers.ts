import type { CompressedTransaction, WalletAnalysisInput } from './types'

export function inferWalletType(
  summary: Omit<WalletAnalysisInput['summary'], 'wallet_type'>,
): string {
  if (summary.swap_count > summary.sol_transfers && summary.swap_count > 0) return 'dex_trader'
  if (summary.avg_transfers_per_tx > 10) return 'distributor'
  if (summary.nft_transfers > summary.sol_transfers) return 'nft_user'
  if (summary.sol_transfers > 0 && summary.avg_transfers_per_tx < 2) return 'regular_user'
  return 'unknown'
}

/**
 * Normalize a raw Helius protocol string into a stable lowercase key
 * suitable for use as a protocol counter key.
 * Examples: "SYSTEM_PROGRAM" → "system_program", "OKX_DEX_ROUTER" → "okx_dex_router"
 */
export function normalizeProtocol(protocol: string): string {
  if (!protocol) return 'unknown'
  return protocol.trim().toLowerCase()
}

/**
 * Map a raw protocol string to a human-readable display label used in
 * recent_activity only. The full raw protocol name is now preserved in
 * the protocol count map via normalizeProtocol.
 */
export function mapProtocol(protocol: string): string {
  const lower = protocol?.trim().toLowerCase() ?? ''
  if (lower === 'system_program') return 'sol_transfer'
  if (lower === 'bubblegum') return 'compressed_nft'
  if (!lower || lower === 'unknown') return 'other'
  // Return the normalized protocol name as a readable label
  return lower.replace(/_/g, ' ')
}

export function classifySolPattern(transfers: number): string {
  if (transfers === 1) return 'single'
  if (transfers < 5) return 'few'
  return 'multi-recipient'
}

export function classifyAmount(sol: number): string {
  if (sol < 0.001) return 'dust'
  if (sol < 0.1) return 'small'
  if (sol < 10) return 'medium'
  return 'large'
}

export function classifyIntent(tx: CompressedTransaction): string {
  if (tx.action.kind === 'SOL_TRANSFER') {
    if (tx.action.transfers > 5 && classifyAmount(tx.action.totalAmount) === 'dust') {
      return 'airdrop_distribution'
    }
    if (tx.action.transfers === 1) return 'payment'
    if (tx.action.transfers > 1) return 'batch_transfer'
  }

  if (tx.action.kind === 'NFT_TRANSFER') return 'nft_activity'
  if (tx.action.kind === 'TOKEN_TRANSFER') return 'token_transfer'

  return 'unknown'
}
