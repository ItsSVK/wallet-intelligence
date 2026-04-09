import { isValidSolanaAddress } from '@/lib/utils'
import { buildWalletAnalysisInput } from '@/services/modules/wallet-analysis/analytics'
import { compressTransactions } from '@/services/modules/wallet-analysis/compression'
import { analyzeWallet, fetchWalletTransactions } from '@/services/services/wallet-analysis.service'
import { type NextRequest } from 'next/server'
import { adaptAnalyzeResult } from './lib/response-builder'
import type { AnalyzeStreamEvent } from './types'

export type { AnalyzeResponse, AnalyzeStreamEvent } from './types'

export const runtime = 'nodejs'

const STEPS = [
  'Fetching transactions...',
  'Processing wallet activity...',
  'Building behavioral model...',
  'Analyzing with AI... (this may take a while)',
]

const encoder = new TextEncoder()

function chunk(event: AnalyzeStreamEvent): Uint8Array {
  return encoder.encode(JSON.stringify(event) + '\n')
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

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

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        controller.enqueue(chunk({ type: 'init', steps: STEPS }))

        controller.enqueue(chunk({ type: 'step', index: 0 }))
        const transactions = await fetchWalletTransactions(address)

        controller.enqueue(chunk({ type: 'step', index: 1 }))
        const compressedTransactions = compressTransactions(transactions)
        await sleep(1000)

        controller.enqueue(chunk({ type: 'step', index: 2 }))
        const input = buildWalletAnalysisInput(address, compressedTransactions, transactions)
        await sleep(1000)

        controller.enqueue(chunk({ type: 'step', index: 3 }))
        const analysis = await analyzeWallet(address, input)
        const result = adaptAnalyzeResult({ ...analysis, compressedTransactions })

        controller.enqueue(chunk({ type: 'done', result }))
        controller.close()
      } catch (error) {
        controller.error(error)
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-store',
    },
  })
}
