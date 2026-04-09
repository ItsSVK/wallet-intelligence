'use client'

import { GitBranch, Share2, Target } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

export interface GraphData {
  uniqueConnections: number
  concentrationScore: number
  hubScore: number
}

export function GraphIntelligence({ graph }: { graph: GraphData }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
        Graph Intelligence
      </p>
      <Card className="overflow-hidden border-border bg-card shadow-sm ring-1 ring-violet-500/10 dark:ring-violet-400/15">
        <div className="border-b border-violet-500/15 bg-violet-500/10 px-4 pt-4 dark:bg-violet-500/15">
          <div className="flex items-center gap-2 pb-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-violet-500/15 text-violet-600 dark:text-violet-300">
              <Share2 className="size-4" strokeWidth={2} />
            </div>
            <div>
              <p className="text-xs font-medium text-foreground">Network shape</p>
              <p className="text-[11px] text-muted-foreground">SOL-transfer edge sample</p>
            </div>
          </div>
        </div>
        <CardContent className="space-y-4 pt-4 pb-4">
          <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2.5">
            <span className="text-xs text-muted-foreground">Unique connections</span>
            <span className="text-lg font-semibold text-violet-600 tabular-nums dark:text-violet-400">
              {graph.uniqueConnections}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Target className="size-3.5 text-violet-500/80" />
                Concentration
              </span>
              <span className="font-medium text-foreground tabular-nums">
                {graph.concentrationScore}
              </span>
            </div>
            <Progress
              value={graph.concentrationScore}
              trackClassName="bg-violet-500/15 dark:bg-violet-500/20"
              colorClass="bg-violet-500"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <GitBranch className="size-3.5 text-sky-500/80" />
                Hub intensity
              </span>
              <span className="font-medium text-foreground tabular-nums">{graph.hubScore}</span>
            </div>
            <Progress
              value={graph.hubScore}
              trackClassName="bg-sky-500/15 dark:bg-sky-500/20"
              colorClass="bg-sky-500"
            />
          </div>

          <p className="border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
            How concentrated wallet interactions are vs spread across many addresses.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
