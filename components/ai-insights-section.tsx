'use client'

import { motion } from 'framer-motion'
import { Sparkles, TrendingUp, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { InsightCard } from '@/app/api/analyze/types'

const categoryStyles: Record<
  InsightCard['category'],
  { border: string; badge: string; dot: string }
> = {
  counterparty: {
    border: 'border-violet-200/80 dark:border-violet-900/60',
    badge: 'bg-violet-50 text-violet-800 dark:bg-violet-950/50 dark:text-violet-300',
    dot: 'bg-violet-400',
  },
  temporal: {
    border: 'border-sky-200/80 dark:border-sky-900/60',
    badge: 'bg-sky-50 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300',
    dot: 'bg-sky-400',
  },
  risk: {
    border: 'border-amber-200/80 dark:border-amber-900/60',
    badge: 'bg-amber-50 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200',
    dot: 'bg-amber-400',
  },
  behavior: {
    border: 'border-emerald-200/80 dark:border-emerald-900/60',
    badge: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
    dot: 'bg-emerald-400',
  },
  protocol: {
    border: 'border-fuchsia-200/80 dark:border-fuchsia-900/60',
    badge: 'bg-fuchsia-50 text-fuchsia-800 dark:bg-fuchsia-950/50 dark:text-fuchsia-300',
    dot: 'bg-fuchsia-400',
  },
  fees: {
    border: 'border-orange-200/80 dark:border-orange-900/60',
    badge: 'bg-orange-50 text-orange-900 dark:bg-orange-950/50 dark:text-orange-200',
    dot: 'bg-orange-400',
  },
  other: {
    border: 'border-border',
    badge: 'bg-muted text-muted-foreground',
    dot: 'bg-foreground/30',
  },
}

export function AiInsightsSection({
  cards,
  forecasts,
  anomalies,
}: {
  cards: InsightCard[]
  forecasts: string[]
  anomalies: string[]
}) {
  if (cards.length === 0 && forecasts.length === 0 && anomalies.length === 0) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-violet-500" />
        <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
          AI intelligence
        </p>
      </div>

      {cards.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card, i) => {
            const styles = categoryStyles[card.category] ?? categoryStyles.other
            return (
              <motion.div
                key={`${card.title}-${i}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.04 }}
              >
                <Card className={cn('h-full border bg-card', styles.border)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start gap-2">
                      <span className={cn('mt-1.5 size-1.5 shrink-0 rounded-full', styles.dot)} />
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-sm leading-snug font-semibold text-foreground">
                          {card.title}
                        </CardTitle>
                        <span
                          className={cn(
                            'mt-1 inline-block rounded px-1.5 py-0.5 font-mono text-[10px] uppercase',
                            styles.badge,
                          )}
                        >
                          {card.category}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm leading-relaxed text-muted-foreground">{card.body}</p>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {(anomalies.length > 0 || forecasts.length > 0) && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {anomalies.length > 0 && (
            <Card className="border-amber-200/60 bg-amber-50/30 dark:border-amber-900/40 dark:bg-amber-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-xs font-medium tracking-wider text-amber-900/90 uppercase dark:text-amber-200/90">
                  <AlertTriangle className="size-3.5" />
                  Flags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-amber-950/90 dark:text-amber-100/90">
                  {anomalies.map((a, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-amber-600 dark:text-amber-400">•</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {forecasts.length > 0 && (
            <Card className="border-violet-200/60 bg-violet-50/25 dark:border-violet-900/40 dark:bg-violet-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-xs font-medium tracking-wider text-violet-900/90 uppercase dark:text-violet-200/90">
                  <TrendingUp className="size-3.5" />
                  Behavioral outlook
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-violet-950/90 dark:text-violet-100/90">
                  {forecasts.map((f, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-violet-600 dark:text-violet-400">→</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
