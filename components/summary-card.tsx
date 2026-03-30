"use client"

import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

interface SummaryCardProps {
  walletAddress: string
  walletProfile: string
  confidence: number
  riskLevel: "Low" | "Medium" | "High"
}

function riskVariant(risk: string) {
  if (risk === "Low") return "emerald"
  if (risk === "High") return "red"
  return "amber"
}

function shortenAddress(addr: string) {
  if (addr.length <= 12) return addr
  return `${addr.slice(0, 6)}…${addr.slice(-6)}`
}

export function SummaryCard({
  walletAddress,
  walletProfile,
  confidence,
  riskLevel,
}: SummaryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Card className="bg-white border-border">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-mono text-muted-foreground tracking-tight">
                {shortenAddress(walletAddress)}
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                {walletProfile}
              </h2>
            </div>
            <div className="flex flex-col items-end gap-2 pt-0.5">
              <Badge variant="emerald">{confidence}% confidence</Badge>
              <Badge variant={riskVariant(riskLevel)}>
                {riskLevel} risk
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <span>Solana Mainnet</span>
            <span>·</span>
            <span>AI-powered analysis</span>
            <span>·</span>
            <span>Read-only</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
