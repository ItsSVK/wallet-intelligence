'use client'

import { motion } from 'framer-motion'
import { ArrowDownLeft, ArrowUpRight, Compass } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

type FlowDirection = 'mostly_outgoing' | 'mostly_incoming' | 'balanced'

export interface FlowData {
  direction: FlowDirection
  outgoing: number
  incoming: number
}

const directionLabels: Record<FlowDirection, string> = {
  mostly_outgoing: 'Mostly Outgoing',
  mostly_incoming: 'Mostly Incoming',
  balanced: 'Balanced',
}

export function FlowSection({ flow }: { flow: FlowData }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
        Flow Analysis
      </p>
      <Card className="overflow-hidden border-border bg-card shadow-sm ring-1 ring-emerald-500/10 dark:ring-emerald-400/15">
        <div className="border-b border-emerald-500/15 bg-emerald-500/10 px-4 pt-4 dark:bg-emerald-500/15">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 pb-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                <Compass className="size-4" strokeWidth={2} />
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">SOL transfer direction</p>
                <p className="text-[11px] text-muted-foreground">Native transfer counts</p>
              </div>
            </div>
            <span className="rounded-full bg-muted/80 px-2 py-0.5 text-[11px] font-medium text-foreground">
              {directionLabels[flow.direction]}
            </span>
          </div>
        </div>
        <CardContent className="space-y-4 pt-4 pb-4">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <ArrowUpRight className="size-3.5 text-emerald-500" />
                  Outgoing
                </span>
                <span className="font-semibold text-emerald-600 tabular-nums dark:text-emerald-400">
                  {flow.outgoing}%
                </span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-emerald-500/15 dark:bg-emerald-500/20">
                <motion.div
                  className="h-full rounded-full bg-emerald-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${flow.outgoing}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <ArrowDownLeft className="size-3.5 text-sky-500" />
                  Incoming
                </span>
                <span className="font-semibold text-sky-600 tabular-nums dark:text-sky-400">
                  {flow.incoming}%
                </span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-sky-500/15 dark:bg-sky-500/20">
                <motion.div
                  className="h-full rounded-full bg-sky-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${flow.incoming}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
