import type {
  EnhancedNativeTransfer,
  EnhancedTokenTransfer,
  EnhancedTransaction,
  GetEnhancedTransactionsByAddressResponse,
} from 'helius-sdk/enhanced/types'

import type { CompressedTransaction, SwapSummary } from './types'

const LAMPORTS_PER_SOL = 1_000_000_000

interface CompressedNftEvent {
  oldLeafOwner?: string | null
  newLeafOwner?: string | null
  assetId?: string | null
}

export function compressTransaction(tx: EnhancedTransaction): CompressedTransaction {
  const baseTransaction = {
    signature: tx.signature,
    type: tx.type ?? 'UNKNOWN',
    protocol: tx.source ?? '',
    time: tx.timestamp ?? 0,
    fee: tx.fee ?? 0,
    actor: tx.feePayer ?? '',
  }

  if ((tx.type ?? '').includes('NFT')) {
    const event = extractCompressedNftEvent(tx)

    return {
      ...baseTransaction,
      action: {
        kind: 'NFT_TRANSFER',
        from: event?.oldLeafOwner ?? null,
        to: event?.newLeafOwner ?? null,
        asset: event?.assetId ?? null,
      },
    }
  }

  const nativeTransfers = tx.nativeTransfers ?? []
  const tokenTransfers = tx.tokenTransfers ?? []

  if (nativeTransfers.length > 0) {
    const totalLamports = nativeTransfers.reduce((sum, transfer) => sum + transfer.amount, 0)

    const result: CompressedTransaction = {
      ...baseTransaction,
      action: {
        kind: 'SOL_TRANSFER',
        transfers: nativeTransfers.length,
        totalAmount: totalLamports / LAMPORTS_PER_SOL,
        recipients: nativeTransfers.map(
          (transfer: EnhancedNativeTransfer) => transfer.toUserAccount,
        ),
        outgoingCount: nativeTransfers.filter(
          (transfer: EnhancedNativeTransfer) => transfer.fromUserAccount === baseTransaction.actor,
        ).length,
        incomingCount: nativeTransfers.filter(
          (transfer: EnhancedNativeTransfer) => transfer.toUserAccount === baseTransaction.actor,
        ).length,
      },
    }

    // For SWAP transactions, also extract the token legs (sold / bought)
    if ((tx.type ?? '').toUpperCase() === 'SWAP' && tokenTransfers.length > 0) {
      const swap = extractSwapLegs(tokenTransfers, baseTransaction.actor)
      if (swap) result.swap = swap
    }

    return result
  }

  if (tokenTransfers.length > 0) {
    return {
      ...baseTransaction,
      action: {
        kind: 'TOKEN_TRANSFER',
        tokens: tokenTransfers.map((transfer: EnhancedTokenTransfer) => ({
          mint: transfer.mint,
          amount: transfer.tokenAmount,
        })),
      },
    }
  }

  return {
    ...baseTransaction,
    action: {
      kind: 'UNKNOWN',
    },
  }
}

/**
 * Resolves the two primary legs of a DEX swap from Helius tokenTransfers.
 *
 * Strategy (handles complex multi-hop routing):
 *   - "Sold" = first transfer where fromUserAccount === actor (what the wallet sent)
 *   - "Bought" = last transfer where toUserAccount === actor AND mint ≠ soldMint
 *     (what the wallet received that isn't the same token it sold)
 *
 * Falls back to the last incoming transfer if every incoming mint matches the
 * sold mint (rare edge case in same-token arbitrage).
 */
function extractSwapLegs(
  transfers: EnhancedTokenTransfer[],
  actor: string,
): SwapSummary | undefined {
  const outgoing = transfers.filter((t) => t.fromUserAccount === actor)
  const incoming = transfers.filter((t) => t.toUserAccount === actor)

  if (outgoing.length === 0 || incoming.length === 0) return undefined

  const soldTransfer = outgoing[0]
  const soldMint = soldTransfer.mint
  const soldAmount = Number(soldTransfer.tokenAmount)

  // Prefer incoming from a different mint (the actual bought token)
  const boughtTransfer =
    [...incoming].reverse().find((t) => t.mint !== soldMint) ?? incoming[incoming.length - 1]

  const boughtMint = boughtTransfer.mint
  if (boughtMint === soldMint) return undefined // same-token — not a meaningful swap

  const boughtAmount = Number(boughtTransfer.tokenAmount)

  return { soldMint, soldAmount, boughtMint, boughtAmount }
}

export function compressTransactions(
  txs: GetEnhancedTransactionsByAddressResponse,
): CompressedTransaction[] {
  return txs.map(compressTransaction)
}

function extractCompressedNftEvent(tx: EnhancedTransaction): CompressedNftEvent | null {
  const events = tx.events as { compressed?: CompressedNftEvent[] } | undefined
  const compressedEvents = events?.compressed

  if (!Array.isArray(compressedEvents) || compressedEvents.length === 0) {
    return null
  }

  return compressedEvents[0] ?? null
}
