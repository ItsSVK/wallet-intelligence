import type { AnalyzeResponse } from '../types'
import type {
  CompressedTransaction,
  WalletAnalysisInput,
} from '@/services/modules/wallet-analysis/types'

type FlowDirection = AnalyzeResponse['flow']['direction']
type RecentActivityItem = WalletAnalysisInput['recent_activity'][number]

const relativeTimeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

// ─── Flow ────────────────────────────────────────────────────────────────────

export function buildFlow(
  transactions: CompressedTransaction[],
  direction: FlowDirection,
): AnalyzeResponse['flow'] {
  let outgoing = 0
  let incoming = 0

  for (const tx of transactions) {
    if (tx.action.kind !== 'SOL_TRANSFER') continue
    outgoing += tx.action.outgoingCount
    incoming += tx.action.incomingCount
  }

  const total = outgoing + incoming

  if (total === 0) {
    if (direction === 'mostly_outgoing') return { direction, outgoing: 65, incoming: 35 }
    if (direction === 'mostly_incoming') return { direction, outgoing: 35, incoming: 65 }
    return { direction, outgoing: 50, incoming: 50 }
  }

  const outgoingPct = clampPercentage((outgoing / total) * 100)
  return { direction, outgoing: outgoingPct, incoming: 100 - outgoingPct }
}

// ─── Protocols ───────────────────────────────────────────────────────────────

export function buildProtocols(
  protocolCounts: WalletAnalysisInput['protocols'],
): AnalyzeResponse['protocols'] {
  const entries = Object.entries(protocolCounts).sort(([, a], [, b]) => b - a)
  const total = entries.reduce((sum, [, count]) => sum + count, 0)

  if (entries.length === 0) return [{ name: 'other', count: 0, pct: 0 }]

  return entries.map(([name, count]) => ({
    name,
    count,
    pct: total > 0 ? clampPercentage((count / total) * 100) : 0,
  }))
}

// ─── Activity ────────────────────────────────────────────────────────────────

export function buildActivity(
  transactions: CompressedTransaction[],
  recentActivity: WalletAnalysisInput['recent_activity'],
): AnalyzeResponse['activity'] {
  const sorted = [...transactions].sort((a, b) => b.time - a.time).slice(0, 5)

  if (sorted.length === 0) {
    return [
      {
        type: 'UNKNOWN',
        pattern: 'no recent activity',
        intent: 'unavailable',
        timestamp: 'recent',
      },
    ]
  }

  return sorted.map((tx, i) => {
    const derived = recentActivity[i]

    if (tx.action.kind === 'SOL_TRANSFER') {
      return {
        type: tx.action.kind,
        pattern: isSolTransferActivity(derived)
          ? derived.pattern
          : inferTransferPattern(tx.action.transfers),
        intent: isSolTransferActivity(derived)
          ? derived.intent
          : tx.action.transfers > 1
            ? 'distribution'
            : 'payment',
        timestamp: formatRelativeTimestamp(tx.time),
      }
    }

    if (tx.action.kind === 'NFT_TRANSFER') {
      return {
        type: tx.action.kind,
        pattern: isNftTransferActivity(derived)
          ? humanizeLabel(derived.protocol).toLowerCase()
          : 'nft transfer',
        intent: 'nft_activity',
        timestamp: formatRelativeTimestamp(tx.time),
      }
    }

    if (tx.action.kind === 'TOKEN_TRANSFER') {
      return {
        type: tx.action.kind,
        pattern: isTokenTransferActivity(derived)
          ? humanizeLabel(derived.protocol).toLowerCase()
          : 'token transfer',
        intent: 'token_transfer',
        timestamp: formatRelativeTimestamp(tx.time),
      }
    }

    return {
      type: tx.action.kind,
      pattern: 'unknown',
      intent: 'unknown',
      timestamp: formatRelativeTimestamp(tx.time),
    }
  })
}

// ─── Type guards ─────────────────────────────────────────────────────────────

function isSolTransferActivity(
  value: RecentActivityItem | undefined,
): value is Extract<RecentActivityItem, { type: 'SOL_TRANSFER' }> {
  return Boolean(value && value.type === 'SOL_TRANSFER' && 'pattern' in value && 'intent' in value)
}

function isNftTransferActivity(
  value: RecentActivityItem | undefined,
): value is Extract<RecentActivityItem, { type: 'NFT_TRANSFER' }> {
  return Boolean(value && value.type === 'NFT_TRANSFER' && 'protocol' in value)
}

function isTokenTransferActivity(
  value: RecentActivityItem | undefined,
): value is Extract<RecentActivityItem, { type: 'TOKEN_TRANSFER' }> {
  return Boolean(value && value.type === 'TOKEN_TRANSFER' && 'protocol' in value)
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

export function humanizeLabel(value: string) {
  return value
    .split('_')
    .map((part) =>
      part.length <= 3
        ? part.toUpperCase()
        : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase(),
    )
    .join(' ')
}

export function humanizeFlowDirection(direction: FlowDirection) {
  return direction.replace(/_/g, ' ')
}

export function roundTo(value: number, digits: number) {
  return Number(value.toFixed(digits))
}

export function clampPercentage(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function inferTransferPattern(transfers: number) {
  if (transfers === 1) return 'single'
  if (transfers < 5) return 'few'
  return 'multi-recipient'
}

function formatRelativeTimestamp(unixSeconds: number) {
  if (!unixSeconds) return 'recent'

  const delta = Math.round((unixSeconds * 1000 - Date.now()) / 1000)
  const units = [
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
  ] as const

  for (const [unit, threshold] of units) {
    if (Math.abs(delta) >= threshold) {
      return relativeTimeFormatter.format(Math.round(delta / threshold), unit)
    }
  }

  return relativeTimeFormatter.format(delta, 'second')
}
