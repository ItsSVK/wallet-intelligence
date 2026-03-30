import type { CompressedTransaction, WalletAnalysisInput } from './types'

export function inferWalletType(
  summary: Omit<WalletAnalysisInput['summary'], 'wallet_type'>,
): string {
  if (summary.avg_transfers_per_tx > 10) return 'distributor'
  if (summary.nft_transfers > summary.sol_transfers) return 'nft_user'
  if (summary.sol_transfers > 0 && summary.avg_transfers_per_tx < 2) return 'regular_user'
  return 'unknown'
}

export function mapProtocol(protocol: string): string {
  if (protocol === 'SYSTEM_PROGRAM') return 'sol_transfer'
  if (protocol === 'BUBBLEGUM') return 'compressed_nft'
  return 'other'
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
  }

  if (tx.action.kind === 'NFT_TRANSFER') return 'nft_activity'

  return 'unknown'
}
