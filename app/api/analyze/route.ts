import { isValidSolanaAddress } from '@/lib/utils'
import { type NextRequest } from 'next/server'

export interface AnalyzeResponse {
  address: string
  walletProfile: string
  confidence: number
  riskLevel: 'Low' | 'Medium' | 'High'
  behaviorSummary: string
  signals: { title: string; description: string }[]
  metrics: { txPerMinute: number; consistencyScore: number }
  graph: { uniqueConnections: number; concentrationScore: number; hubScore: number }
  activity: { type: string; pattern: string; intent: string; timestamp: string }[]
  flow: {
    direction: 'mostly_outgoing' | 'mostly_incoming' | 'balanced'
    outgoing: number
    incoming: number
  }
  protocols: { name: string; count: number; pct: number }[]
}

// Each line in the NDJSON stream is one of these
export type AnalyzeStreamEvent =
  | { type: 'init'; steps: string[] }          // sent first — full step list
  | { type: 'step'; index: number }            // marks step[index] as active
  | { type: 'done'; result: AnalyzeResponse }  // all done, carry result

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

const encoder = new TextEncoder()

function chunk(event: AnalyzeStreamEvent): Uint8Array {
  return encoder.encode(JSON.stringify(event) + '\n')
}

// POST /api/analyze
// Body: { address: string }
// Response: NDJSON stream — step events followed by final result
export async function POST(request: NextRequest) {
  let address: string

  try {
    const body = (await request.json()) as { address?: string }
    address = (body.address ?? '').trim()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!address) {
    return Response.json({ error: 'Missing required field: address' }, { status: 422 })
  }

  if (!isValidSolanaAddress(address)) {
    return Response.json({ error: 'Invalid Solana wallet address' }, { status: 422 })
  }

  const result: AnalyzeResponse = {
    address,
    walletProfile: 'DeFi Power User',
    confidence: 87,
    riskLevel: 'Medium',
    behaviorSummary:
      'This wallet demonstrates consistent high-frequency trading behavior concentrated in DeFi protocols. Activity patterns suggest an experienced operator with systematic execution habits — likely using automated tooling for a portion of transaction volume. Interaction graph analysis shows strong centrality with limited exposure to high-risk token launches. No mixing patterns or obfuscation signals detected.',
    signals: [
      {
        title: 'High Frequency Execution',
        description:
          'Transaction rate significantly exceeds typical wallet averages, suggesting automated or semi-automated tooling.',
      },
      {
        title: 'Protocol Concentration',
        description:
          'Over 70% of activity concentrated in 3 protocols, indicating deliberate strategy rather than exploration.',
      },
      {
        title: 'Consistent Timing Patterns',
        description:
          'Transactions cluster in predictable time windows, pointing to scheduled or algorithmic execution.',
      },
      {
        title: 'Low Dust Activity',
        description:
          'Minimal micro-transactions or spam patterns. Clean operational hygiene throughout the observed period.',
      },
    ],
    metrics: { txPerMinute: 2.4, consistencyScore: 82 },
    graph: { uniqueConnections: 142, concentrationScore: 74, hubScore: 61 },
    activity: [
      {
        type: 'SOL_TRANSFER',
        pattern: 'multi-recipient',
        intent: 'airdrop_distribution',
        timestamp: '2h ago',
      },
      { type: 'NFT_TRANSFER', pattern: 'single', intent: 'payment', timestamp: '5h ago' },
      { type: 'SOL_TRANSFER', pattern: 'single', intent: 'consolidation', timestamp: '9h ago' },
      {
        type: 'SOL_TRANSFER',
        pattern: 'multi-recipient',
        intent: 'batch_payout',
        timestamp: '14h ago',
      },
      { type: 'NFT_TRANSFER', pattern: 'single', intent: 'sale', timestamp: '1d ago' },
    ],
    flow: { direction: 'mostly_outgoing', outgoing: 64, incoming: 36 },
    protocols: [
      { name: 'sol_transfer', count: 847, pct: 52 },
      { name: 'compressed_nft', count: 412, pct: 25 },
      { name: 'token_swap', count: 211, pct: 13 },
      { name: 'other', count: 163, pct: 10 },
    ],
  }

  const STEPS = [
    'Fetching transactions...',
    'Processing wallet activity...',
    'Building behavioral model...',
    'Analyzing with AI...',
  ]

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // Announce full step list immediately so the UI can render all steps at once
      controller.enqueue(chunk({ type: 'init', steps: STEPS }))

      controller.enqueue(chunk({ type: 'step', index: 0 }))
      await sleep(800)

      controller.enqueue(chunk({ type: 'step', index: 1 }))
      await sleep(700)

      controller.enqueue(chunk({ type: 'step', index: 2 }))
      await sleep(900)

      controller.enqueue(chunk({ type: 'step', index: 3 }))
      await sleep(1000)

      controller.enqueue(chunk({ type: 'done', result }))
      controller.close()
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'application/x-ndjson' },
  })
}
