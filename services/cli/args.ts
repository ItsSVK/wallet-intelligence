export interface CliOptions {
  help: boolean;
  walletAddress?: string;
  model?: string;
  transactionLimit?: number;
}

export function parseCliArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    help: false,
  };

  for (let index = 0; index < args.length; index++) {
    const argument = args[index]!;
    const [flag, inlineValue] = argument.split('=', 2);

    const readValue = (name: string): string => {
      if (inlineValue && inlineValue.trim().length > 0) {
        return inlineValue.trim();
      }

      const nextValue = args[index + 1];
      if (!nextValue || nextValue.startsWith('-')) {
        throw new Error(`Missing value for ${name}.`);
      }

      index += 1;
      return nextValue.trim();
    };

    if (!argument.startsWith('-')) {
      if (options.walletAddress) {
        throw new Error(`Unexpected positional argument: ${argument}`);
      }

      options.walletAddress = argument.trim();
      continue;
    }

    switch (flag) {
      case '--help':
      case '-h':
        options.help = true;
        break;
      case '--wallet':
      case '-w':
        options.walletAddress = readValue(flag);
        break;
      case '--model':
      case '-m':
        options.model = readValue(flag);
        break;
      case '--limit':
      case '-l':
        options.transactionLimit = parseTransactionLimit(readValue(flag));
        break;
      default:
        throw new Error(`Unknown argument: ${argument}`);
    }
  }

  return options;
}

export function buildUsageText(): string {
  return [
    'Wallet Intelligence CLI',
    '',
    'Usage:',
    '  bun run index.ts <wallet-address>',
    '  bun run index.ts --wallet <wallet-address> [--model <model>] [--limit <number>]',
    '',
    'Flags:',
    '  -w, --wallet   Wallet address to analyze',
    '  -m, --model    SolRouter model to use',
    '  -l, --limit    Number of transactions to fetch',
    '  -h, --help     Show this help message',
    '',
    'Environment:',
    '  HELIUS_API_KEY (or legacy API_KEY)',
    '  SOLROUTER_API_KEY',
    '  WALLET_ADDRESS',
    '  SOLROUTER_MODEL',
    '  TRANSACTION_LIMIT',
  ].join('\n');
}

function parseTransactionLimit(value: string): number {
  const numericValue = Number.parseInt(value, 10);

  if (!Number.isInteger(numericValue) || numericValue <= 0) {
    throw new Error(`Invalid transaction limit: ${value}`);
  }

  return numericValue;
}
