'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';

export interface Protocol {
  name: string;
  count: number;
  pct: number;
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' as const } },
};

export function ProtocolUsage({ protocols }: { protocols: Protocol[] }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Protocol Usage</p>
      <Card className="border-border bg-white">
        <CardContent className="pt-4 pb-4">
          <motion.div
            className="space-y-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {protocols.map((p) => (
              <motion.div key={p.name} variants={itemVariants} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-foreground">{p.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="tabular-nums text-muted-foreground">{p.count.toLocaleString()}</span>
                    <span className="w-8 text-right tabular-nums font-medium text-foreground">{p.pct}%</span>
                  </div>
                </div>
                <div className="relative h-1 w-full overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full rounded-full bg-foreground/65"
                    initial={{ width: 0 }}
                    animate={{ width: `${p.pct}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
}
