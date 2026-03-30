import { parseCliArgs, buildUsageText } from './cli/args'
import { createHeliusClient } from './clients/helius'
import { createSolRouterClient } from './clients/solrouter'
import { loadAppConfig } from './config/env'
import { analyzeWallet } from './services/wallet-analysis.service'

type EnvironmentSource = Record<string, string | undefined>

export async function run(
  argv: string[] = process.argv.slice(2),
  env: EnvironmentSource = process.env,
): Promise<void> {
  const cliOptions = parseCliArgs(argv)

  if (cliOptions.help) {
    console.log(buildUsageText())
    return
  }

  const config = loadAppConfig(cliOptions, env)
  const result = await analyzeWallet(
    {
      aiClient: createSolRouterClient(config.solRouterApiKey),
      transactionClient: createHeliusClient(config.heliusApiKey),
    },
    {
      walletAddress: config.walletAddress,
      transactionLimit: config.transactionLimit,
      model: config.model,
    },
  )

  console.log(JSON.stringify(result.responseMessage, null, 2))
}

export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return 'An unexpected error occurred.'
}

run()
