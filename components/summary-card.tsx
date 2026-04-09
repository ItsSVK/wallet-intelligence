'use client'

import { motion } from 'framer-motion'
import { Eye, Globe, Sparkles, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SummaryCardProps {
  walletAddress: string
  walletProfile: string
  confidence: number
  riskLevel: 'Low' | 'Medium' | 'High'
}

function shortenAddress(addr: string) {
  if (addr.length <= 12) return addr
  return `${addr.slice(0, 6)}…${addr.slice(-6)}`
}

const riskStyles: Record<'Low' | 'Medium' | 'High', string> = {
  Low: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 ring-emerald-500/20 dark:text-emerald-300',
  Medium:
    'border-amber-500/35 bg-amber-500/10 text-amber-900 ring-amber-500/25 dark:text-amber-200',
  High: 'border-red-500/35 bg-red-500/10 text-red-900 ring-red-500/25 dark:text-red-300',
}

export function SummaryCard({
  walletAddress,
  walletProfile,
  confidence,
  riskLevel,
}: SummaryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-card shadow-sm',
        'ring-1 ring-violet-500/10 dark:ring-violet-400/15',
      )}
    >
      {/* Top strip — matches Flow / Graph intelligence cards */}
      <div className="border-b border-violet-500/15 bg-violet-500/10 px-4 py-3.5 sm:px-5 dark:bg-violet-500/15">
        <div className="flex items-start gap-3 sm:items-center">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/20 text-violet-600 shadow-sm dark:bg-violet-500/25 dark:text-violet-300">
            <Wallet className="size-5" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold tracking-widest text-violet-700/90 uppercase dark:text-violet-300/90">
              Wallet address
            </p>
            <p
              className="mt-0.5 truncate font-mono text-sm text-foreground tabular-nums sm:text-base"
              title={walletAddress}
            >
              {shortenAddress(walletAddress)}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 sm:px-5 sm:py-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
          <div className="min-w-0 space-y-1">
            <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
              Profile
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-violet-800 sm:text-3xl lg:text-[1.85rem] lg:leading-tight dark:text-violet-200">
              {walletProfile}
            </h1>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-2.5">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold tabular-nums',
                'border-violet-500/25 bg-violet-500/10 text-violet-800 ring-1 ring-violet-500/15',
                'dark:text-violet-200',
              )}
            >
              <Sparkles className="size-3.5 shrink-0 text-violet-600 dark:text-violet-400" />
              {confidence}% confidence
            </span>
            <span
              className={cn(
                'inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold ring-1',
                riskStyles[riskLevel],
              )}
            >
              {riskLevel} risk
            </span>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2 border-t border-border/80 pt-5">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500/10 px-2.5 py-1.5 text-[11px] font-medium text-sky-900 ring-1 ring-sky-500/20 dark:text-sky-200">
            <Globe className="size-3.5 shrink-0 text-sky-600 dark:text-sky-400" aria-hidden />
            Solana Mainnet
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-violet-500/10 px-2.5 py-1.5 text-[11px] font-medium text-violet-900 ring-1 ring-violet-500/20 dark:text-violet-200">
            <Sparkles
              className="size-3.5 shrink-0 text-violet-600 dark:text-violet-400"
              aria-hidden
            />
            AI behavioral analysis
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted/80 px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground ring-1 ring-border">
            <Eye className="size-3.5 shrink-0 opacity-70" aria-hidden />
            Read-only
          </span>
        </div>
      </div>
    </motion.div>
  )
}
