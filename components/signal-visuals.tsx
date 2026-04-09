import type { LucideIcon } from 'lucide-react'
import {
  ArrowLeftRight,
  Cloud,
  Coins,
  Cpu,
  GitBranch,
  Layers,
  Network,
  RefreshCw,
  Sparkles,
  UserCircle,
  Zap,
} from 'lucide-react'

export type SignalAccent = {
  Icon: LucideIcon
  accent: string
  cardBg: string
  iconWrap: string
}

const PALETTE: SignalAccent[] = [
  {
    Icon: Zap,
    accent: 'border-l-violet-500',
    cardBg: 'bg-violet-500/[0.06] dark:bg-violet-500/10',
    iconWrap: 'bg-violet-500/15 text-violet-600 dark:text-violet-300',
  },
  {
    Icon: ArrowLeftRight,
    accent: 'border-l-sky-500',
    cardBg: 'bg-sky-500/[0.06] dark:bg-sky-500/10',
    iconWrap: 'bg-sky-500/15 text-sky-600 dark:text-sky-300',
  },
  {
    Icon: Network,
    accent: 'border-l-emerald-500',
    cardBg: 'bg-emerald-500/[0.06] dark:bg-emerald-500/10',
    iconWrap: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300',
  },
  {
    Icon: Cpu,
    accent: 'border-l-amber-500',
    cardBg: 'bg-amber-500/[0.06] dark:bg-amber-500/10',
    iconWrap: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  },
  {
    Icon: Coins,
    accent: 'border-l-orange-500',
    cardBg: 'bg-orange-500/[0.06] dark:bg-orange-500/10',
    iconWrap: 'bg-orange-500/15 text-orange-600 dark:text-orange-300',
  },
  {
    Icon: RefreshCw,
    accent: 'border-l-fuchsia-500',
    cardBg: 'bg-fuchsia-500/[0.06] dark:bg-fuchsia-500/10',
    iconWrap: 'bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-300',
  },
  {
    Icon: Cloud,
    accent: 'border-l-cyan-500',
    cardBg: 'bg-cyan-500/[0.06] dark:bg-cyan-500/10',
    iconWrap: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-300',
  },
]

const TITLE_HINTS: { test: RegExp; Icon: LucideIcon }[] = [
  { test: /wallet|heuristic|type/i, Icon: UserCircle },
  { test: /flow/i, Icon: ArrowLeftRight },
  { test: /graph|concentration|hub/i, Icon: GitBranch },
  { test: /system|program/i, Icon: Layers },
  { test: /fee/i, Icon: Coins },
  { test: /dex|swap/i, Icon: RefreshCw },
  { test: /dust|airdrop/i, Icon: Cloud },
  { test: /token/i, Icon: Sparkles },
]

export function getSignalAccent(title: string, index: number): SignalAccent {
  const base = PALETTE[index % PALETTE.length]
  for (const hint of TITLE_HINTS) {
    if (hint.test.test(title)) {
      return { ...base, Icon: hint.Icon }
    }
  }
  return base
}
