'use client'

import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { getSignalAccent } from '@/components/signal-visuals'

interface Signal {
  title: string
  description: string
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' as const } },
}

export function SignalsGrid({ signals }: { signals: Signal[] }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
        Key Signals
      </p>
      <motion.div
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {signals.map((signal, index) => {
          const v = getSignalAccent(signal.title, index)
          const Icon = v.Icon
          return (
            <motion.div
              key={signal.title}
              variants={itemVariants}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.15 }}
            >
              <Card
                className={cn(
                  'h-full border shadow-sm ring-1 ring-black/5 dark:ring-white/5',
                  v.accent,
                  'border-l-[3px]',
                  v.cardBg,
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex gap-3">
                    <div
                      className={cn(
                        'flex size-9 shrink-0 items-center justify-center rounded-lg',
                        v.iconWrap,
                      )}
                    >
                      <Icon className="size-4" strokeWidth={2} />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <CardTitle className="text-sm leading-snug font-semibold text-foreground">
                        {signal.title}
                      </CardTitle>
                      <CardDescription className="text-xs leading-relaxed text-muted-foreground">
                        {signal.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
