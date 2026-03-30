'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export interface GraphData {
  uniqueConnections: number;
  concentrationScore: number;
  hubScore: number;
}

export function GraphIntelligence({ graph }: { graph: GraphData }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Graph Intelligence
      </p>
      <Card className="border-border bg-white">
        <CardContent className="space-y-4 pt-4 pb-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Unique Connections</span>
            <span className="tabular-nums text-sm font-semibold text-foreground">
              {graph.uniqueConnections}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Concentration Score</span>
              <span className="tabular-nums font-medium text-foreground">{graph.concentrationScore}</span>
            </div>
            <Progress value={graph.concentrationScore} colorClass="bg-foreground" />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Hub Score</span>
              <span className="tabular-nums font-medium text-foreground">{graph.hubScore}</span>
            </div>
            <Progress value={graph.hubScore} colorClass="bg-foreground/55" />
          </div>

          <p className="border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground/60">
            Indicates how concentrated or distributed wallet interactions are within the on-chain network.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
