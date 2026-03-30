import { makeEnhancedTxClientLazy, type EnhancedTxClientLazy } from 'helius-sdk/enhanced/lazy'

export function createHeliusClient(apiKey: string): EnhancedTxClientLazy {
  return makeEnhancedTxClientLazy(apiKey)
}
