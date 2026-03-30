"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface FlowSectionProps {
  inbound: number
  outbound: number
}

function formatSol(val: number) {
  return val >= 1000
    ? `${(val / 1000).toFixed(1)}k SOL`
    : `${val.toFixed(1)} SOL`
}

export function FlowSection({ inbound, outbound }: FlowSectionProps) {
  const total = inbound + outbound || 1
  const inPct = Math.round((inbound / total) * 100)
  const outPct = Math.round((outbound / total) * 100)

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-foreground">Token Flow</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="bg-emerald-50/60 border-emerald-100">
          <CardHeader>
            <CardTitle className="text-xs text-emerald-700 font-medium uppercase tracking-wider">
              Inbound
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <p className="text-2xl font-semibold text-emerald-800 tabular-nums">
              {formatSol(inbound)}
            </p>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-emerald-600">
                <span>Share of total flow</span>
                <span>{inPct}%</span>
              </div>
              <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-emerald-100">
                <motion.div
                  className="h-full rounded-full bg-emerald-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${inPct}%` }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50/60 border-red-100">
          <CardHeader>
            <CardTitle className="text-xs text-red-600 font-medium uppercase tracking-wider">
              Outbound
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <p className="text-2xl font-semibold text-red-700 tabular-nums">
              {formatSol(outbound)}
            </p>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-red-500">
                <span>Share of total flow</span>
                <span>{outPct}%</span>
              </div>
              <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-red-100">
                <motion.div
                  className="h-full rounded-full bg-red-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${outPct}%` }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
