'use client';

import { motion } from 'framer-motion';

interface SummaryCardProps {
  walletAddress: string;
  walletProfile: string;
  confidence: number;
  riskLevel: 'Low' | 'Medium' | 'High';
}

function shortenAddress(addr: string) {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-6)}`;
}

const riskBorder: Record<'Low' | 'Medium' | 'High', string> = {
  Low: 'border-zinc-300 text-zinc-600',
  Medium: 'border-zinc-400 text-zinc-700',
  High: 'border-zinc-600 text-zinc-900',
};

export function SummaryCard({ walletAddress, walletProfile, confidence, riskLevel }: SummaryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="border-b border-border pb-6"
    >
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="font-mono text-xs text-muted-foreground">{shortenAddress(walletAddress)}</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{walletProfile}</h1>
        </div>

        <div className="flex items-center gap-3 pb-0.5">
          <span className="text-xs tabular-nums text-muted-foreground">{confidence}% confidence</span>
          <div className="h-3 w-px bg-border" />
          <span className={`rounded border px-2 py-0.5 text-xs font-medium ${riskBorder[riskLevel]}`}>
            {riskLevel} Risk
          </span>
        </div>
      </div>

      <p className="mt-2 text-xs text-muted-foreground/60">
        Solana Mainnet · AI-powered behavioral analysis · Read-only
      </p>
    </motion.div>
  );
}
