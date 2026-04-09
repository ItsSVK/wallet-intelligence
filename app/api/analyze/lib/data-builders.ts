import type { AnalyzeResponse, InsightCard } from '../types'
import type {
  CompressedTransaction,
  WalletAnalysisInput,
} from '@/services/modules/wallet-analysis/types'

type FlowDirection = AnalyzeResponse['flow']['direction']

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
  const sorted = [...transactions].sort((a, b) => b.time - a.time).slice(0, 15)

  if (sorted.length === 0) {
    return [
      {
        type: 'UNKNOWN',
        pattern: 'no recent activity',
        intent: 'unavailable',
        timestamp: 'recent',
        signature: '',
      },
    ]
  }

  return sorted.map((tx, i) => {
    const derived = recentActivity[i]

    // Use the real Helius tx.type as the display type when it is more specific than
    // the action kind. e.g. a SWAP transaction still has nativeTransfers (fees/slippage)
    // so action.kind would be SOL_TRANSFER — but tx.type is the ground truth.
    const displayType = resolveDisplayType(tx.type, tx.action.kind)
    const intent = resolveIntent(tx.type, tx.action, derived)

    // Build a descriptive pattern depending on what the tx actually is
    const pattern = resolvePattern(tx, derived, displayType)

    return {
      type: displayType,
      pattern,
      intent,
      timestamp: formatRelativeTimestamp(tx.time),
      signature: tx.signature,
      detail: resolveDetail(tx, displayType),
    }
  })
}

// ─── Activity resolution helpers ─────────────────────────────────────────────

/**
 * Returns tx.type when it carries real semantic meaning (SWAP, NFT_SALE, BURN,
 * etc.).  Falls back to action.kind when tx.type is generic (TRANSFER / UNKNOWN
 * / empty) because in those cases the action kind is more descriptive.
 */
function resolveDisplayType(txType: string, actionKind: string): string {
  const t = txType?.trim().toUpperCase() ?? ''
  if (!t || t === 'TRANSFER' || t === 'UNKNOWN') return actionKind
  return t
}

/**
 * Intent is derived from tx.type first, then from action details as a fallback.
 */
function resolveIntent(
  txType: string,
  action: CompressedTransaction['action'],
  derived: WalletAnalysisInput['recent_activity'][number] | undefined,
): string {
  const t = txType?.trim().toUpperCase() ?? ''

  // Specific tx-type intents
  if (t === 'SWAP') return 'swap'
  if (t.startsWith('NFT_SALE')) return 'nft_sale'
  if (t.startsWith('NFT_MINT')) return 'nft_mint'
  if (t.startsWith('NFT_BID')) return 'nft_bid'
  if (t.startsWith('NFT_LIST')) return 'nft_listing'
  if (t.startsWith('NFT')) return 'nft_activity'
  if (t === 'STAKE_SOL' || t === 'ACTIVATE_STAKE') return 'staking'
  if (t === 'UNSTAKE_SOL' || t === 'DEACTIVATE_STAKE') return 'unstaking'
  if (t === 'BURN') return 'burn'
  if (t === 'CREATE_ACCOUNT') return 'account_creation'

  // Fall back to action-derived intent
  if (action.kind === 'SOL_TRANSFER') {
    if (derived && 'intent' in derived) return derived.intent
    return action.transfers > 1 ? 'batch_transfer' : 'payment'
  }
  if (action.kind === 'NFT_TRANSFER') return 'nft_activity'
  if (action.kind === 'TOKEN_TRANSFER') return 'token_transfer'
  return 'unknown'
}

/**
 * Pattern is a short human-readable description of HOW the tx happened.
 * For SWAPs/DEX actions: show the protocol.
 * For SOL transfers: show single / multi-recipient breakdown.
 * For token transfers: show token count.
 */
function resolvePattern(
  tx: CompressedTransaction,
  derived: WalletAnalysisInput['recent_activity'][number] | undefined,
  displayType: string,
): string {
  const t = displayType.toUpperCase()

  // DEX / swap — protocol is the most useful context
  if (t === 'SWAP' || t.includes('SWAP')) {
    const proto = tx.protocol ? humanizeLabel(tx.protocol.toLowerCase()) : ''
    if (tx.action.kind === 'SOL_TRANSFER') {
      const xfers = tx.action.transfers
      const detail = xfers > 1 ? ` · ${xfers} transfers` : ''
      return proto ? `${proto}${detail}`.trim() : 'dex swap'
    }
    return proto || 'dex swap'
  }

  // NFT types
  if (t.startsWith('NFT')) {
    const proto = tx.protocol ? humanizeLabel(tx.protocol.toLowerCase()) : ''
    return proto || 'nft transfer'
  }

  // Stake / burn / account operations
  if (t === 'STAKE_SOL' || t === 'ACTIVATE_STAKE') return 'sol staking'
  if (t === 'UNSTAKE_SOL' || t === 'DEACTIVATE_STAKE') return 'sol unstaking'
  if (t === 'BURN') return 'token burn'
  if (t === 'CREATE_ACCOUNT') return 'new account'

  // SOL transfer — use enriched derived data when available
  if (tx.action.kind === 'SOL_TRANSFER') {
    if (derived && 'pattern' in derived) return derived.pattern
    return inferTransferPattern(tx.action.transfers)
  }

  // Token transfer
  if (tx.action.kind === 'TOKEN_TRANSFER') {
    const count = tx.action.tokens.length
    return count > 1 ? `${count} tokens` : 'token transfer'
  }

  return 'unknown'
}

// ─── Transfer detail ─────────────────────────────────────────────────────────

// ─── Well-known Solana token symbols ─────────────────────────────────────────

const KNOWN_SYMBOLS: Record<string, string> = {
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: 'USDC',
  Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: 'USDT',
  So11111111111111111111111111111111111111112: 'SOL',
  DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263: 'BONK',
  JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN: 'JUP',
  '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R': 'RAY',
  HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3: 'PYTH',
  jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL: 'JTO',
  mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So: 'mSOL',
  bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1: 'bSOL',
  J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn: 'jitoSOL',
  '7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj': 'stSOL',
  Jd4M8bfJG3sAkd82RsGWyEXoaBXQP7njFzwoQWK7jTaa: 'WBTC',
  '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs': 'ETH',
}

function tokenLabel(mint: string): string {
  return KNOWN_SYMBOLS[mint] ?? shortenAddress(mint)
}

/**
 * Returns a short human-readable line describing what moved and in which
 * direction.  For SWAP transactions uses the resolved swap legs (sold → bought).
 * For SOL / NFT / token transfers shows amount and direction.
 */
function resolveDetail(tx: CompressedTransaction, displayType: string): string | undefined {
  const t = displayType.toUpperCase()

  // SWAP — show the two legs if we resolved them
  if (t === 'SWAP' || t.includes('SWAP')) {
    if (!tx.swap) return undefined
    const { soldMint, soldAmount, boughtMint, boughtAmount } = tx.swap
    const soldStr = `${formatTokenAmount(soldAmount)} ${tokenLabel(soldMint)}`
    const boughtStr = `${formatTokenAmount(boughtAmount)} ${tokenLabel(boughtMint)}`
    return `${soldStr} → ${boughtStr}`
  }

  if (tx.action.kind === 'SOL_TRANSFER') {
    const amount = tx.action.totalAmount
    if (amount < 0.000001) return undefined
    const amtStr = formatSol(amount)
    if (tx.action.outgoingCount > 0 && tx.action.incomingCount === 0) return `↑ ${amtStr}`
    if (tx.action.incomingCount > 0 && tx.action.outgoingCount === 0) return `↓ ${amtStr}`
    if (tx.action.outgoingCount > 0 && tx.action.incomingCount > 0) return `↕ ${amtStr}`
    return amtStr
  }

  if (tx.action.kind === 'NFT_TRANSFER') {
    const { from, to } = tx.action
    if (from && to) return `${shortenAddress(from)} → ${shortenAddress(to)}`
    if (from) return `from ${shortenAddress(from)}`
    if (to) return `to ${shortenAddress(to)}`
    return undefined
  }

  if (tx.action.kind === 'TOKEN_TRANSFER') {
    const count = tx.action.tokens.length
    return count > 1 ? `${count} token type${count === 1 ? '' : 's'}` : undefined
  }

  return undefined
}

function formatTokenAmount(amount: number): string {
  if (amount === 0) return '0'
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(2)}M`
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(2)}K`
  if (amount >= 1) return amount.toFixed(amount % 1 === 0 ? 0 : 4)
  if (amount >= 0.0001) return amount.toFixed(6)
  return amount.toExponential(2)
}

function formatSol(amount: number): string {
  if (amount === 0) return '0 SOL'
  if (amount < 0.0001) return `${(amount * 1_000_000_000).toFixed(0)} lamports`
  if (amount < 0.001) return `${amount.toFixed(6)} SOL`
  if (amount < 1) return `${amount.toFixed(4)} SOL`
  return `${amount.toFixed(3)} SOL`
}

function shortenAddress(address: string): string {
  if (!address || address.length <= 10) return address
  return `${address.slice(0, 4)}…${address.slice(-4)}`
}

// ─── Token activity ──────────────────────────────────────────────────────────

export function buildTokenActivity(
  tokenActivity: WalletAnalysisInput['token_activity'],
): AnalyzeResponse['tokenActivity'] {
  return {
    uniqueMints: tokenActivity.unique_mints,
    topTokens: tokenActivity.top_tokens.map((t) => ({
      mint: t.mint,
      txCount: t.tx_count,
    })),
  }
}

// ─── Intelligence (deterministic view model) ────────────────────────────────

export function buildIntelligenceView(
  intel: WalletAnalysisInput['intelligence'],
): AnalyzeResponse['intelligence'] {
  return {
    counterpartyEntropy: intel.counterparty_entropy,
    distinctCounterparties: intel.distinct_counterparties,
    peakHourUtc: intel.peak_hour_utc,
    activeHoursUtc: intel.active_hours_utc,
    activityByHour: [...intel.activity_by_hour],
    topCounterparties: intel.top_counterparties.map((t) => ({ ...t })),
    network: {
      center: intel.network.center,
      nodes: intel.network.nodes.map((n) => ({
        id: n.id,
        kind: n.kind,
        interactions: n.interactions,
      })),
      edges: intel.network.edges.map((e) => ({ ...e })),
    },
    anomalyHints: [...intel.anomaly_hints],
  }
}

export function normalizeInsightCategory(raw: string | undefined): InsightCard['category'] {
  const r = (raw ?? '').toLowerCase().trim()
  if (
    r === 'counterparty' ||
    r === 'temporal' ||
    r === 'risk' ||
    r === 'behavior' ||
    r === 'protocol' ||
    r === 'fees'
  ) {
    return r
  }
  return 'other'
}

/** Deterministic cards when the model returns too few insight_cards. */
export function buildFallbackInsightCards(input: WalletAnalysisInput): InsightCard[] {
  const intel = input.intelligence
  const cards: InsightCard[] = []

  if (input.summary.total_tx > 0) {
    const ent = intel.counterparty_entropy
    const spread =
      ent < 0.25
        ? 'Counterparty interactions are highly concentrated — typical of tight routing through a few programs or addresses.'
        : ent > 0.75
          ? 'Counterparty interactions are spread across many distinct addresses — broader retail or distribution-like behavior.'
          : 'Counterparty mix shows both repeat partners and occasional new addresses.'
    cards.push({
      title: 'Network concentration',
      body: `${spread} Entropy: ${ent.toFixed(2)} across ${intel.distinct_counterparties} distinct counterparties (${input.summary.total_tx} transactions sampled).`,
      category: 'counterparty',
    })
  }

  cards.push({
    title: 'Temporal footprint',
    body: `Peak UTC hour: ${intel.peak_hour_utc}. Active hours in sample: ${intel.active_hours_utc} of 24 — ${intel.active_hours_utc <= 4 ? 'narrow windows can correlate with scripted bursts or focused sessions.' : 'activity is spread across many hours, more consistent with organic usage.'}`,
    category: 'temporal',
  })

  if (intel.anomaly_hints.length > 0) {
    cards.push({
      title: 'Heuristic flags',
      body: intel.anomaly_hints
        .map((h) =>
          h.startsWith('counterparty_concentration')
            ? 'Strong concentration toward a small counterparty set.'
            : h.startsWith('counterparty_dispersion')
              ? 'Unusually high counterparty diversity for the sample size.'
              : h.startsWith('fee_outlier')
                ? 'Fee distribution has outliers — one or more transactions paid much more than the average.'
                : h.startsWith('time_concentration')
                  ? 'Transactions cluster in very few UTC hours.'
                  : h,
        )
        .join(' '),
      category: 'risk',
    })
  }

  const swapPct =
    input.summary.total_tx > 0
      ? clampPercentage((input.summary.swap_count / input.summary.total_tx) * 100)
      : 0
  if (input.summary.swap_count > 0) {
    cards.push({
      title: 'DEX footprint',
      body: `${input.summary.swap_count} swap-labeled transactions (${swapPct}% of the sample) — interpret alongside protocol list for router-heavy vs direct trading.`,
      category: 'behavior',
    })
  }

  return cards
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
