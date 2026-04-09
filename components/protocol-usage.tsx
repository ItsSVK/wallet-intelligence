'use client'

import { motion } from 'framer-motion'
import { Layers } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface Protocol {
  name: string
  count: number
  pct: number
}

const BAR_FILLS = [
  'bg-violet-500',
  'bg-sky-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-fuchsia-500',
  'bg-indigo-500',
]
const TRACK_TINTS = [
  'bg-violet-500/12 dark:bg-violet-500/18',
  'bg-sky-500/12 dark:bg-sky-500/18',
  'bg-emerald-500/12 dark:bg-emerald-500/18',
  'bg-amber-500/12 dark:bg-amber-500/18',
  'bg-fuchsia-500/12 dark:bg-fuchsia-500/18',
  'bg-indigo-500/12 dark:bg-indigo-500/18',
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' as const } },
}

export function ProtocolUsage({ protocols }: { protocols: Protocol[] }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
        Protocol Usage
      </p>
      <Card className="overflow-hidden border-border bg-card shadow-sm ring-1 ring-emerald-500/10 dark:ring-emerald-400/15">
        <div className="border-b border-emerald-500/15 bg-emerald-500/10 px-4 pt-4 dark:bg-emerald-500/15">
          <div className="flex items-center gap-2 pb-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
              <Layers className="size-4" strokeWidth={2} />
            </div>
            <div>
              <p className="text-xs font-medium text-foreground">Program mix</p>
              <p className="text-[11px] text-muted-foreground">By transaction count</p>
            </div>
          </div>
        </div>
        <CardContent className="pt-4 pb-4">
          <motion.div
            className="space-y-3.5"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {protocols.map((p, i) => {
              const gi = i % BAR_FILLS.length
              return (
                <motion.div key={p.name} variants={itemVariants} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="truncate font-mono text-xs text-foreground">{p.name}</span>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        {p.count.toLocaleString()}
                      </span>
                      <span
                        className={cn(
                          'w-9 rounded-md px-1 py-0.5 text-right text-[11px] font-semibold tabular-nums',
                          'bg-muted/50 text-foreground',
                        )}
                      >
                        {p.pct}%
                      </span>
                    </div>
                  </div>
                  <div
                    className={cn(
                      'relative h-1.5 w-full overflow-hidden rounded-full',
                      TRACK_TINTS[gi],
                    )}
                  >
                    <motion.div
                      className={cn('h-full rounded-full', BAR_FILLS[gi])}
                      initial={{ width: 0 }}
                      animate={{ width: `${p.pct}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut', delay: 0.08 }}
                    />
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </CardContent>
      </Card>
    </div>
  )
}
