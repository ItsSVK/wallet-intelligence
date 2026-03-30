'use client'

import { useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { WalletInput } from '@/components/wallet-input'
import { LoadingSteps } from '@/components/loading-steps'
import { SummaryCard } from '@/components/summary-card'
import { SignalsGrid } from '@/components/signals-grid'
import { MetricsPanel } from '@/components/metrics-panel'
import { ActivityList } from '@/components/activity-list'
import { FlowSection } from '@/components/flow-section'
import { GraphIntelligence } from '@/components/graph-intelligence'
import { ProtocolUsage } from '@/components/protocol-usage'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { AnalyzeResponse, AnalyzeStreamEvent } from '@/app/api/analyze/types'

type View = 'landing' | 'loading' | 'results'

export default function Home() {
  const [view, setView] = useState<View>('landing')
  const [walletAddress, setWalletAddress] = useState('')
  const [allSteps, setAllSteps] = useState<string[]>([])
  const [currentStepIndex, setCurrentStepIndex] = useState(-1)
  const [loadingDone, setLoadingDone] = useState(false)
  const [result, setResult] = useState<AnalyzeResponse | null>(null)

  const handleAnalyze = useCallback(async (address: string) => {
    setWalletAddress(address)
    setAllSteps([])
    setCurrentStepIndex(-1)
    setLoadingDone(false)
    setResult(null)
    setView('loading')

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      })

      if (!response.ok || !response.body) {
        setView('landing')
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        // Keep the last (possibly incomplete) line in the buffer
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue

          const event = JSON.parse(trimmed) as AnalyzeStreamEvent
          if (event.type === 'init') {
            setAllSteps(event.steps)
          } else if (event.type === 'step') {
            setCurrentStepIndex(event.index)
          } else if (event.type === 'done') {
            setResult(event.result)
            setLoadingDone(true)
          }
        }
      }
    } catch {
      setView('landing')
    }
  }, [])

  const handleLoadingComplete = useCallback(() => {
    setView('results')
  }, [])

  const handleReset = useCallback(() => {
    setView('landing')
    setWalletAddress('')
    setAllSteps([])
    setCurrentStepIndex(-1)
    setLoadingDone(false)
    setResult(null)
  }, [])

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-white">
      <AnimatePresence mode="wait">
        {view === 'landing' && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex w-full flex-1"
          >
            <WalletInput onAnalyze={handleAnalyze} />
          </motion.div>
        )}

        {view === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex w-full flex-1"
          >
            <LoadingSteps
              allSteps={allSteps}
              currentStepIndex={currentStepIndex}
              isDone={loadingDone}
              onComplete={handleLoadingComplete}
            />
          </motion.div>
        )}

        {view === 'results' && result && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="w-full"
          >
            <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
              {/* Back nav */}
              <div className="mb-6">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="size-3.5" />
                  New analysis
                </button>
              </div>

              {/* Full-width header */}
              <SummaryCard
                walletAddress={walletAddress}
                walletProfile={result.walletProfile}
                confidence={result.confidence}
                riskLevel={result.riskLevel}
              />

              {/* 2-column layout: 65% left / 35% right */}
              <div className="mt-8 grid grid-cols-1 gap-x-8 gap-y-6 lg:grid-cols-[65fr_35fr]">
                {/* ── LEFT COLUMN ── */}
                <div className="space-y-6">
                  {/* Behavioral Summary */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.05 }}
                  >
                    <Card className="border-border bg-white">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                          Behavioral Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm leading-7 text-foreground">
                          {result.behaviorSummary}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Key Signals */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.1 }}
                  >
                    <SignalsGrid signals={result.signals} />
                  </motion.div>

                  {/* Activity Timeline */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.15 }}
                  >
                    <ActivityList items={result.activity} />
                  </motion.div>
                </div>

                {/* ── RIGHT COLUMN ── */}
                <div className="space-y-4">
                  {/* Flow Analysis */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.08 }}
                  >
                    <FlowSection flow={result.flow} />
                  </motion.div>

                  {/* Graph Intelligence */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.12 }}
                  >
                    <GraphIntelligence graph={result.graph} />
                  </motion.div>

                  {/* Activity Metrics */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.16 }}
                  >
                    <MetricsPanel metrics={result.metrics} />
                  </motion.div>

                  {/* Protocol Usage */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.2 }}
                  >
                    <ProtocolUsage protocols={result.protocols} />
                  </motion.div>
                </div>
              </div>

              {/* Footer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.35 }}
                className="mt-10 border-t border-border pt-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Analysis generated · Mar 2026</p>
                  <Button variant="outline" size="sm" onClick={handleReset}>
                    Analyze another wallet
                  </Button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
