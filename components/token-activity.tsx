'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface TokenActivityData {
  uniqueMints: number
  topTokens: Array<{ mint: string; txCount: number }>
}

function shortenMint(mint: string): string {
  if (mint.length <= 12) return mint
  return `${mint.slice(0, 6)}…${mint.slice(-4)}`
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
}

const rowVariants = {
  hidden: { opacity: 0, x: -6 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.22, ease: 'easeOut' as const } },
}

export function TokenActivity({ tokenActivity }: { tokenActivity: TokenActivityData }) {
  if (tokenActivity.uniqueMints === 0) return null

  const maxCount = Math.max(...tokenActivity.topTokens.map((t) => t.txCount), 1)

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
        Token Activity
      </p>
      <Card className="border-border bg-card">
        <CardHeader className="pt-4 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Top Tokens Transferred
            </CardTitle>
            <span className="text-xs text-muted-foreground tabular-nums">
              {tokenActivity.uniqueMints} unique mint{tokenActivity.uniqueMints === 1 ? '' : 's'}
            </span>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          {tokenActivity.topTokens.length === 0 ? (
            <p className="text-xs text-muted-foreground">No token transfers recorded.</p>
          ) : (
            <motion.ol
              className="space-y-2.5"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {tokenActivity.topTokens.map((token) => {
                const barPct = Math.round((token.txCount / maxCount) * 100)
                return (
                  <motion.li key={token.mint} variants={rowVariants} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-foreground/80" title={token.mint}>
                        {shortenMint(token.mint)}
                      </span>
                      <span className="text-muted-foreground tabular-nums">{token.txCount} tx</span>
                    </div>
                    <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                      <motion.div
                        className="h-full rounded-full bg-primary/60"
                        initial={{ width: 0 }}
                        animate={{ width: `${barPct}%` }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                      />
                    </div>
                  </motion.li>
                )
              })}
            </motion.ol>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
