"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface Metrics {
  txPerMinute: number
  consistencyScore: number
  concentrationScore: number
  hubScore: number
}

interface MetricsPanelProps {
  metrics: Metrics
}

function scoreColor(value: number) {
  if (value >= 70) return "bg-emerald-500"
  if (value >= 40) return "bg-amber-400"
  return "bg-red-400"
}

function scoreLabel(value: number) {
  if (value >= 70) return "text-emerald-600"
  if (value >= 40) return "text-amber-600"
  return "text-red-500"
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
}

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" as const } },
}

export function MetricsPanel({ metrics }: MetricsPanelProps) {
  const rows: { label: string; value: number; isRate?: boolean }[] = [
    { label: "Transactions / min", value: metrics.txPerMinute, isRate: true },
    { label: "Consistency Score", value: metrics.consistencyScore },
    { label: "Concentration Score", value: metrics.concentrationScore },
    { label: "Hub Score", value: metrics.hubScore },
  ]

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-foreground">Metrics</h3>
      <Card className="bg-white border-border">
        <CardContent className="pt-4 pb-2">
          <motion.div
            className="space-y-5"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {rows.map((row) => (
              <motion.div key={row.label} variants={rowVariants} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{row.label}</span>
                  <span className={`text-xs font-medium tabular-nums ${row.isRate ? "text-foreground" : scoreLabel(row.value)}`}>
                    {row.isRate ? `${row.value.toFixed(1)}` : `${row.value}`}
                  </span>
                </div>
                {!row.isRate && (
                  <Progress
                    value={row.value}
                    colorClass={scoreColor(row.value)}
                  />
                )}
                {row.isRate && (
                  <Progress
                    value={Math.min(100, (row.value / 5) * 100)}
                    colorClass="bg-foreground/70"
                  />
                )}
              </motion.div>
            ))}
          </motion.div>
        </CardContent>
      </Card>
    </div>
  )
}
