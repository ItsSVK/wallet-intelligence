'use client'

import { motion } from 'framer-motion'

export interface ActivityItem {
  type: string
  pattern: string
  intent: string
  timestamp: string
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' as const } },
}

export function ActivityList({ items }: { items: ActivityItem[] }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
        Activity Timeline
      </p>
      <div className="overflow-hidden rounded-lg border border-border bg-white">
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          {items.map((item, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              className={`flex items-center justify-between gap-4 px-4 py-3 ${
                i < items.length - 1 ? 'border-b border-border' : ''
              }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/25" />
                <div className="min-w-0">
                  <p className="truncate font-mono text-xs font-medium text-foreground">
                    {item.type}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.pattern}</p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <span className="rounded border border-border px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                  {item.intent}
                </span>
                <span className="text-xs whitespace-nowrap text-muted-foreground/60 tabular-nums">
                  {item.timestamp}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
