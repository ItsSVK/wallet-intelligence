"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface Signal {
  title: string
  description: string
}

interface SignalsGridProps {
  signals: Signal[]
}

const CARD_BG_CLASSES = [
  "bg-slate-50",
  "bg-stone-50",
  "bg-zinc-50",
  "bg-sky-50/40",
  "bg-amber-50/40",
]

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" as const } },
}

export function SignalsGrid({ signals }: SignalsGridProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-foreground">Key Signals</h3>
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {signals.map((signal, i) => (
          <motion.div key={signal.title} variants={itemVariants}>
            <Card
              size="sm"
              className={`${CARD_BG_CLASSES[i % CARD_BG_CLASSES.length]} border-border/60`}
            >
              <CardHeader>
                <CardTitle className="text-sm font-medium text-foreground">
                  {signal.title}
                </CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  {signal.description}
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
