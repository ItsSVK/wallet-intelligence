import { buildWalletAnalysisPrompt } from '../modules/ai/prompt-builder'
import type { WalletAnalysisInput } from '../modules/wallet-analysis/types'
import { getRuntimeConfig } from '@/services/utils/util'
import { GetEnhancedTransactionsByAddressResponse } from 'helius-sdk/enhanced/types'
import { createHeliusClient } from '@/services/clients/helius'
import { createSolRouterClient } from '@/services/clients/solrouter'
import { AnalyzeWalletResult } from '@/services/types'
const { heliusApiKey, transactionLimit, solRouterApiKey, model } = getRuntimeConfig()

export async function analyzeWallet(
  walletAddress: string,
  input: WalletAnalysisInput,
): Promise<AnalyzeWalletResult> {
  let responseMessage: unknown = null
  let aiError: string | null = null

  try {
    const response = await createSolRouterClient(solRouterApiKey).chat(
      buildWalletAnalysisPrompt(input),
      {
        model: model,
      },
    )

    responseMessage = response.message
  } catch (error) {
    aiError = error instanceof Error ? error.message : 'Failed to generate AI analysis.'
  }

  return {
    walletAddress: walletAddress,
    input,
    responseMessage,
    aiError,
  }
}

export async function fetchWalletTransactions(
  walletAddress: string,
): Promise<GetEnhancedTransactionsByAddressResponse> {
  return createHeliusClient(heliusApiKey).getTransactionsByAddress({
    address: walletAddress,
    limit: transactionLimit,
    commitment: 'confirmed',
  })
}
