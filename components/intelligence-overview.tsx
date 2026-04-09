'use client'

import { ExternalLink, Orbit } from 'lucide-react'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import type { IntelligenceView } from '@/app/api/analyze/types'

function shortAddr(id: string) {
  if (id === '__other__') return 'Other addresses'
  if (id.length <= 12) return id
  return `${id.slice(0, 4)}…${id.slice(-4)}`
}

export function IntelligenceOverview({ data }: { data: IntelligenceView }) {
  const maxHour = Math.max(1, ...data.activityByHour)
  const peakPct = Math.round((data.activityByHour[data.peakHourUtc] / maxHour) * 100)

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
        Network &amp; time
      </p>
      <Card className="overflow-hidden border-border bg-card shadow-sm ring-1 ring-fuchsia-500/10 dark:ring-fuchsia-400/15">
        <div className="border-b border-fuchsia-500/15 bg-fuchsia-500/10 px-4 pt-4 dark:bg-fuchsia-500/15">
          <div className="flex items-center gap-2 pb-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-300">
              <Orbit className="size-4" strokeWidth={2} />
            </div>
            <CardTitle className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
              Counterparty intelligence
            </CardTitle>
          </div>
        </div>
        <CardContent className="space-y-4 pt-2">
          <div className="flex flex-wrap gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Distinct counterparties</p>
              <p className="font-mono text-lg font-semibold text-fuchsia-600 tabular-nums dark:text-fuchsia-400">
                {data.distinctCounterparties}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Entropy (spread)</p>
              <p className="font-mono text-lg font-semibold text-violet-600 tabular-nums dark:text-violet-400">
                {data.counterpartyEntropy.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Peak UTC</p>
              <p className="font-mono text-lg font-semibold text-sky-600 tabular-nums dark:text-sky-400">
                {data.peakHourUtc}h
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Interaction spread</span>
              <span className="font-medium text-foreground tabular-nums">
                {Math.round(data.counterpartyEntropy * 100)}%
              </span>
            </div>
            <Progress
              value={Math.round(data.counterpartyEntropy * 100)}
              trackClassName="bg-violet-500/15 dark:bg-violet-500/20"
              colorClass="bg-violet-500"
            />
          </div>

          <div>
            <p className="mb-2 text-xs text-muted-foreground">
              Activity by UTC hour (peak {peakPct}% at {data.peakHourUtc}:00)
            </p>
            <div className="flex h-14 items-end gap-px rounded-md bg-violet-500/10 p-1 dark:bg-violet-950/40">
              {data.activityByHour.map((c, h) => {
                const hgt = maxHour > 0 ? Math.max(8, (c / maxHour) * 100) : 8
                return (
                  <div
                    key={h}
                    title={`${h}:00 UTC — ${c} tx`}
                    className="min-w-0 flex-1 rounded-sm bg-violet-500/85 opacity-90 transition-opacity hover:opacity-100 dark:bg-violet-400/90"
                    style={{ height: `${hgt}%` }}
                  />
                )
              })}
            </div>
            <div className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground">
              <span>0h</span>
              <span>12h</span>
              <span>23h</span>
            </div>
          </div>

          {data.topCounterparties.length > 0 && (
            <div className="border-t border-border pt-3">
              <p className="mb-2 text-xs text-muted-foreground">Top counterparties</p>
              <ul className="max-h-40 space-y-2 overflow-y-auto pr-1">
                {data.topCounterparties.slice(0, 6).map((cp) => {
                  const isOther = cp.address === '__other__'
                  const href = isOther ? undefined : `https://solscan.io/account/${cp.address}`
                  return (
                    <li
                      key={cp.address}
                      className="flex items-center justify-between gap-2 text-xs"
                    >
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          'flex min-w-0 items-center gap-1 font-mono text-foreground',
                          href && 'hover:underline',
                        )}
                        onClick={(e) => !href && e.preventDefault()}
                      >
                        {shortAddr(cp.address)}
                        {href && <ExternalLink className="size-3 shrink-0 opacity-40" />}
                      </a>
                      <span className="shrink-0 text-muted-foreground tabular-nums">
                        {cp.interactions}×
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {data.anomalyHints.length > 0 && (
            <p className="border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">Signals: </span>
              {data.anomalyHints.join(' · ')}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
