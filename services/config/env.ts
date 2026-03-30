import type { CliOptions } from '../cli/args'
import { SUPPORTED_SOLROUTER_MODELS, type SolRouterModel } from '../clients/solrouter'

const DEFAULT_MODEL = 'gpt-oss-20b'
const DEFAULT_TRANSACTION_LIMIT = 20

type EnvironmentSource = Record<string, string | undefined>

export interface AppConfig {
  heliusApiKey: string
  solRouterApiKey: string
  walletAddress: string
  model: SolRouterModel
  transactionLimit: number
}

export function loadAppConfig(
  cliOptions: CliOptions,
  env: EnvironmentSource = process.env,
): AppConfig {
  return {
    heliusApiKey: readRequiredString(
      env.NEXT_PUBLIC_HELIUS_API_KEY ?? env.API_KEY,
      'HELIUS_API_KEY (or legacy API_KEY)',
    ),
    solRouterApiKey: readRequiredString(env.SOLROUTER_API_KEY, 'SOLROUTER_API_KEY'),
    walletAddress: readRequiredString(
      cliOptions.walletAddress ?? env.WALLET_ADDRESS,
      'wallet address (--wallet or WALLET_ADDRESS)',
    ),
    model: parseSolRouterModel(
      readOptionalString(cliOptions.model ?? env.SOLROUTER_MODEL) ?? DEFAULT_MODEL,
    ),
    transactionLimit: parsePositiveInteger(
      cliOptions.transactionLimit ?? env.TRANSACTION_LIMIT ?? DEFAULT_TRANSACTION_LIMIT,
      'transaction limit',
    ),
  }
}

function readRequiredString(value: string | undefined, label: string): string {
  const normalizedValue = readOptionalString(value)
  if (!normalizedValue) {
    throw new Error(`Missing required ${label}.`)
  }

  return normalizedValue
}

function readOptionalString(value: string | number | undefined): string | undefined {
  if (value === undefined) {
    return undefined
  }

  const normalizedValue = String(value).trim()
  return normalizedValue.length > 0 ? normalizedValue : undefined
}

function parsePositiveInteger(value: number | string, label: string): number {
  const numericValue = typeof value === 'number' ? value : Number.parseInt(value, 10)

  if (!Number.isInteger(numericValue) || numericValue <= 0) {
    throw new Error(`Invalid ${label}: ${value}. Expected a positive integer.`)
  }

  return numericValue
}

function parseSolRouterModel(value: string): SolRouterModel {
  if (SUPPORTED_SOLROUTER_MODELS.includes(value as SolRouterModel)) {
    return value as SolRouterModel
  }

  throw new Error(
    `Invalid SolRouter model: ${value}. Supported values: ${SUPPORTED_SOLROUTER_MODELS.join(', ')}`,
  )
}
