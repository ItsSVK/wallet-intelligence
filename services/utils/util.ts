import { SolRouterModel } from '@/services/clients/solrouter'
import { AnalysisRuntimeConfig } from '@/services/types'

const DEFAULT_MODEL: SolRouterModel = 'gpt-oss-20b'
const DEFAULT_TRANSACTION_LIMIT = 50

function readRequiredEnv(names: string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim()

    if (value) {
      return value
    }
  }

  throw new Error(`Missing required environment variable: ${names.join(' or ')}`)
}

export function getRuntimeConfig(): AnalysisRuntimeConfig {
  return {
    heliusApiKey: readRequiredEnv(['NEXT_PUBLIC_HELIUS_API_KEY', 'HELIUS_API_KEY', 'API_KEY']),
    solRouterApiKey: readRequiredEnv(['SOLROUTER_API_KEY', 'NEXT_PUBLIC_SOLROUTER_API_KEY']),
    model: DEFAULT_MODEL,
    transactionLimit: DEFAULT_TRANSACTION_LIMIT,
  }
}
