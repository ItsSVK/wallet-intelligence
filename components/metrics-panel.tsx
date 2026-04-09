'use client'

import { Gauge, Timer, Wallet } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

export interface ActivityMetrics {
  txPerMinute: number
  consistencyScore: number
  avgFeeLamports: number
  swapCount: number
  dustTxCount: number
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
}

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' as const } },
}

export function MetricsPanel({ metrics }: { metrics: ActivityMetrics }) {
  const avgFeeDisplay =
    metrics.avgFeeLamports >= 1_000_000
      ? `${(metrics.avgFeeLamports / 1_000_000).toFixed(3)} SOL`
      : `${metrics.avgFeeLamports.toLocaleString()} lam`

  const feeBarValue = Math.min(100, (metrics.avgFeeLamports / 10_000) * 100)

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
        Activity Metrics
      </p>
      <Card className="overflow-hidden border-border bg-card shadow-sm ring-1 ring-sky-500/10 dark:ring-sky-400/15">
        <div className="border-b border-sky-500/15 bg-sky-500/10 px-4 pt-4 dark:bg-sky-500/15">
          <div className="flex items-center gap-2 pb-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-300">
              <Gauge className="size-4" strokeWidth={2} />
            </div>
            <div>
              <p className="text-xs font-medium text-foreground">Throughput &amp; fees</p>
              <p className="text-[11px] text-muted-foreground">Sampled activity rates</p>
            </div>
          </div>
        </div>
        <CardContent className="pt-4 pb-4">
          <motion.div
            className="space-y-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={rowVariants} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Timer className="size-3.5 text-sky-500/90" />
                  Transactions / min
                </span>
                <span className="font-semibold text-sky-600 tabular-nums dark:text-sky-400">
                  {metrics.txPerMinute.toFixed(1)}
                </span>
              </div>
              <Progress
                value={Math.min(100, (metrics.txPerMinute / 5) * 100)}
                trackClassName="bg-sky-500/15 dark:bg-sky-500/20"
                colorClass="bg-sky-500"
              />
            </motion.div>

            <motion.div variants={rowVariants} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Consistency score</span>
                <span className="font-semibold text-violet-600 tabular-nums dark:text-violet-400">
                  {metrics.consistencyScore}
                </span>
              </div>
              <Progress
                value={metrics.consistencyScore}
                trackClassName="bg-violet-500/15 dark:bg-violet-500/20"
                colorClass="bg-violet-500"
              />
            </motion.div>

            <motion.div variants={rowVariants} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Wallet className="size-3.5 text-amber-500/90" />
                  Avg fee
                </span>
                <span className="font-semibold text-amber-700 tabular-nums dark:text-amber-400">
                  {avgFeeDisplay}
                </span>
              </div>
              <Progress
                value={feeBarValue}
                trackClassName="bg-amber-500/15 dark:bg-amber-500/20"
                colorClass="bg-amber-500"
              />
            </motion.div>

            {metrics.swapCount > 0 && (
              <motion.div variants={rowVariants} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Swap transactions</span>
                <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 tabular-nums ring-1 ring-emerald-500/25 dark:text-emerald-300">
                  {metrics.swapCount}
                </span>
              </motion.div>
            )}

            {metrics.dustTxCount > 0 && (
              <motion.div variants={rowVariants} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Dust transfers</span>
                <span className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-xs font-semibold text-cyan-800 tabular-nums ring-1 ring-cyan-500/20 dark:text-cyan-300">
                  {metrics.dustTxCount}
                </span>
              </motion.div>
            )}
          </motion.div>
        </CardContent>
      </Card>
    </div>
  )
}
