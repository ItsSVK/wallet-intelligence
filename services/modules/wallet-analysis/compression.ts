import type {
  EnhancedNativeTransfer,
  EnhancedTokenTransfer,
  EnhancedTransaction,
  GetEnhancedTransactionsByAddressResponse,
} from 'helius-sdk/enhanced/types'

import type { CompressedTransaction } from './types'

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
  if (nativeTransfers.length > 0) {
    const totalLamports = nativeTransfers.reduce((sum, transfer) => sum + transfer.amount, 0)

    return {
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
  }

  const tokenTransfers = tx.tokenTransfers ?? []
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
