'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';

type FlowDirection = 'mostly_outgoing' | 'mostly_incoming' | 'balanced';

export interface FlowData {
  direction: FlowDirection;
  outgoing: number;
  incoming: number;
}

const directionLabels: Record<FlowDirection, string> = {
  mostly_outgoing: 'Mostly Outgoing',
  mostly_incoming: 'Mostly Incoming',
  balanced: 'Balanced',
};

export function FlowSection({ flow }: { flow: FlowData }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Flow Analysis</p>
      <Card className="border-border bg-white">
        <CardContent className="space-y-4 pt-4 pb-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Direction</span>
            <span className="text-xs font-medium text-foreground">{directionLabels[flow.direction]}</span>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Outgoing</span>
                <span className="tabular-nums font-medium text-foreground">{flow.outgoing}%</span>
              </div>
              <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full bg-foreground"
                  initial={{ width: 0 }}
                  animate={{ width: `${flow.outgoing}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Incoming</span>
                <span className="tabular-nums font-medium text-foreground">{flow.incoming}%</span>
              </div>
              <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full bg-foreground/40"
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
  );
}
