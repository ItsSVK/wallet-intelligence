'use client'

import { motion } from 'framer-motion'
import { ExternalLink } from 'lucide-react'

export interface ActivityItem {
  type: string
  pattern: string
  intent: string
  timestamp: string
  signature: string
  detail?: string
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' as const } },
}

function humanizeType(type: string): string {
  return type
    .split('_')
    .map((w) =>
      w.length <= 3 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
    )
    .join(' ')
}

type ColorScheme = { dot: string; badge: string }

function getTypeColor(type: string): ColorScheme {
  const t = type.toUpperCase()

  if (t === 'SWAP' || t.includes('SWAP'))
    return {
      dot: 'bg-emerald-400',
      badge:
        'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800',
    }

  if (t.startsWith('NFT'))
    return {
      dot: 'bg-violet-400',
      badge:
        'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-400 dark:border-violet-800',
    }

  if (t === 'TOKEN_TRANSFER' || t === 'TOKEN')
    return {
      dot: 'bg-amber-400',
      badge:
        'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800',
    }

  if (t === 'SOL_TRANSFER' || t === 'TRANSFER')
    return {
      dot: 'bg-sky-400',
      badge:
        'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-400 dark:border-sky-800',
    }

  if (
    t === 'STAKE_SOL' ||
    t === 'ACTIVATE_STAKE' ||
    t === 'UNSTAKE_SOL' ||
    t === 'DEACTIVATE_STAKE'
  )
    return {
      dot: 'bg-yellow-400',
      badge:
        'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/50 dark:text-yellow-400 dark:border-yellow-800',
    }

  if (t === 'BURN')
    return {
      dot: 'bg-red-400',
      badge:
        'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800',
    }

  return { dot: 'bg-foreground/20', badge: 'bg-muted text-muted-foreground border-border' }
}

export function ActivityList({ items }: { items: ActivityItem[] }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
        Activity Timeline
      </p>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          {items.map((item, i) => {
            const colors = getTypeColor(item.type)
            const solscanUrl = item.signature
              ? `https://solscan.io/tx/${item.signature}`
              : undefined

            return (
              <motion.div key={i} variants={itemVariants}>
                <a
                  href={solscanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={[
                    'group flex items-center justify-between gap-4 px-4 py-3',
                    'transition-colors duration-150 hover:bg-muted/40',
                    i < items.length - 1 ? 'border-b border-border' : '',
                    solscanUrl ? 'cursor-pointer' : 'cursor-default',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={(e) => !solscanUrl && e.preventDefault()}
                >
                  {/* Left: dot + type label + secondary lines */}
                  <div className="flex min-w-0 items-start gap-3">
                    <div className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${colors.dot}`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate font-mono text-xs font-semibold text-foreground">
                          {humanizeType(item.type)}
                        </p>
                        {solscanUrl && (
                          <ExternalLink className="size-3 shrink-0 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100" />
                        )}
                      </div>
                      {item.pattern && item.pattern !== 'unknown' && (
                        <p className="truncate text-xs text-muted-foreground">{item.pattern}</p>
                      )}
                      {item.detail && (
                        <p className="truncate font-mono text-xs text-muted-foreground/70">
                          {item.detail}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: intent badge + timestamp */}
                  <div className="flex shrink-0 items-center gap-2">
                    {item.intent && item.intent !== 'unknown' && (
                      <span
                        className={`rounded border px-1.5 py-0.5 font-mono text-[11px] ${colors.badge}`}
                      >
                        {item.intent.replace(/_/g, ' ')}
                      </span>
                    )}
                    <span className="text-xs whitespace-nowrap text-muted-foreground/60 tabular-nums">
                      {item.timestamp}
                    </span>
                  </div>
                </a>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </div>
  )
}
