'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export interface ActivityMetrics {
  txPerMinute: number;
  consistencyScore: number;
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' as const } },
};

export function MetricsPanel({ metrics }: { metrics: ActivityMetrics }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Activity Metrics
      </p>
      <Card className="border-border bg-white">
        <CardContent className="pt-4 pb-4">
          <motion.div
            className="space-y-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={rowVariants} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Transactions / min</span>
                <span className="tabular-nums font-medium text-foreground">
                  {metrics.txPerMinute.toFixed(1)}
                </span>
              </div>
              <Progress value={Math.min(100, (metrics.txPerMinute / 5) * 100)} colorClass="bg-foreground/70" />
            </motion.div>

            <motion.div variants={rowVariants} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Consistency Score</span>
                <span className="tabular-nums font-medium text-foreground">{metrics.consistencyScore}</span>
              </div>
              <Progress value={metrics.consistencyScore} colorClass="bg-foreground/70" />
            </motion.div>
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
}
