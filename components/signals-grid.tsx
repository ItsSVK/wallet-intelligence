'use client';

import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface Signal {
  title: string;
  description: string;
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' as const } },
};

export function SignalsGrid({ signals }: { signals: Signal[] }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Key Signals</p>
      <motion.div
        className="grid grid-cols-2 gap-3"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {signals.map((signal) => (
          <motion.div
            key={signal.title}
            variants={itemVariants}
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.15 }}
          >
            <Card className="h-full border-border bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-foreground">{signal.title}</CardTitle>
                <CardDescription className="text-xs leading-relaxed">{signal.description}</CardDescription>
              </CardHeader>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
