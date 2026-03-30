import { SolRouter, type ChatOptions } from '@solrouter/sdk'

export type SolRouterModel = NonNullable<ChatOptions['model']>

export const SUPPORTED_SOLROUTER_MODELS = [
  'gpt-oss-20b',
  'gemini-flash',
  'claude-sonnet',
  'claude-sonnet-4',
  'gpt-4o-mini',
] as const satisfies readonly SolRouterModel[]

export function createSolRouterClient(apiKey: string): SolRouter {
  return new SolRouter({ apiKey })
}
