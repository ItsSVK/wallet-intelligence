import type { SolRouter } from '@solrouter/sdk';
import type { EnhancedTxClientLazy } from 'helius-sdk/enhanced/lazy';

import { buildWalletAnalysisPrompt } from '../modules/ai/prompt-builder';
import { buildWalletAnalysisInput } from '../modules/wallet-analysis/analytics';
import { compressTransactions } from '../modules/wallet-analysis/compression';
import type { WalletAnalysisInput } from '../modules/wallet-analysis/types';
import type { SolRouterModel } from '../clients/solrouter';

export interface WalletAnalysisServiceDependencies {
  aiClient: Pick<SolRouter, 'chat'>;
  transactionClient: Pick<EnhancedTxClientLazy, 'getTransactionsByAddress'>;
}

export interface AnalyzeWalletRequest {
  walletAddress: string;
  transactionLimit: number;
  model: SolRouterModel;
}

export interface AnalyzeWalletResult {
  walletAddress: string;
  input: WalletAnalysisInput;
  prompt: string;
  responseMessage: unknown;
}

export async function analyzeWallet(
  dependencies: WalletAnalysisServiceDependencies,
  request: AnalyzeWalletRequest,
): Promise<AnalyzeWalletResult> {
  const transactions = await dependencies.transactionClient.getTransactionsByAddress({
    address: request.walletAddress,
    limit: request.transactionLimit,
    commitment: 'confirmed',
  });

  const compressedTransactions = compressTransactions(transactions);
  const input = buildWalletAnalysisInput(compressedTransactions);
  const prompt = buildWalletAnalysisPrompt(input);

  const response = await dependencies.aiClient.chat(prompt, {
    model: request.model,
  });

  return {
    walletAddress: request.walletAddress,
    input,
    prompt,
    responseMessage: response.message,
  };
}
