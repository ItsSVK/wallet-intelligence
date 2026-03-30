"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ActivityItem {
  type: string
  pattern: string
  amountCategory: "small" | "medium" | "large"
  timestamp: string
}

interface ActivityListProps {
  items: ActivityItem[]
}

function amountVariant(cat: ActivityItem["amountCategory"]) {
  if (cat === "large") return "red"
  if (cat === "medium") return "amber"
  return "slate"
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" as const } },
}

export function ActivityList({ items }: ActivityListProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-foreground">Activity Timeline</h3>
      <motion.div
        className="space-y-2"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {items.map((item, i) => (
          <motion.div key={i} variants={itemVariants}>
            <Card size="sm" className="bg-slate-50 border-border/60">
              <CardContent className="flex items-center justify-between gap-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-foreground/30 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {item.type}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.pattern}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={amountVariant(item.amountCategory)} className="capitalize">
                    {item.amountCategory}
                  </Badge>
                  <span className="text-xs text-muted-foreground/70 tabular-nums whitespace-nowrap">
                    {item.timestamp}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
