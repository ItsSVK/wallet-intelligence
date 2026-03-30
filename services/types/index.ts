import { SolRouterModel } from '@/services/clients/solrouter'
import { WalletAnalysisInput } from '@/services/modules/wallet-analysis/types'

export interface AnalysisRuntimeConfig {
  heliusApiKey: string
  solRouterApiKey: string
  model: SolRouterModel
  transactionLimit: number
}

export interface AnalyzeWalletRequest {
  walletAddress: string
  transactionLimit: number
  model: SolRouterModel
}

export interface AnalyzeWalletResult {
  walletAddress: string
  input: WalletAnalysisInput
  responseMessage: unknown
  aiError: string | null
}
