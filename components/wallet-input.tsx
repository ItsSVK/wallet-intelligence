"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface WalletInputProps {
  onAnalyze: (address: string) => void
}

export function WalletInput({ onAnalyze }: WalletInputProps) {
  const [address, setAddress] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = address.trim()
    if (trimmed.length > 0) {
      onAnalyze(trimmed)
    }
  }

  return (
    <motion.div
      className="flex flex-1 flex-col items-center justify-center w-full px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="w-full max-w-md space-y-10">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
            Solana
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Wallet Intelligence
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Enter a wallet address to receive AI-powered behavioral analysis
            and on-chain insights.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            placeholder="Enter Solana wallet address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="h-11 text-sm font-mono"
            autoComplete="off"
            spellCheck={false}
          />
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.99 }}
            transition={{ duration: 0.15 }}
          >
            <Button
              type="submit"
              className="w-full h-11 text-sm font-medium"
              disabled={address.trim().length === 0}
            >
              Analyze Wallet
            </Button>
          </motion.div>
        </form>

        <p className="text-xs text-muted-foreground text-center">
          Analysis is read-only and does not require wallet connection.
        </p>
      </div>
    </motion.div>
  )
}
