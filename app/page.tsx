'use client'

import { useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { WalletInput } from '@/components/wallet-input'
import { ParticleBackground } from '@/components/particle-background'
import { LoadingSteps } from '@/components/loading-steps'
import { SummaryCard } from '@/components/summary-card'
import { SignalsGrid } from '@/components/signals-grid'
import { MetricsPanel } from '@/components/metrics-panel'
import { ActivityList } from '@/components/activity-list'
import { FlowSection } from '@/components/flow-section'
import { GraphIntelligence } from '@/components/graph-intelligence'
import { AiInsightsSection } from '@/components/ai-insights-section'
import { IntelligenceOverview } from '@/components/intelligence-overview'
import { ProtocolUsage } from '@/components/protocol-usage'
import { TokenActivity } from '@/components/token-activity'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
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
    <div className="flex min-h-screen flex-1 flex-col bg-background">
      <AnimatePresence mode="wait">
        {/* Landing stays mounted during loading — blurs out as the overlay appears */}
        {(view === 'landing' || view === 'loading') && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'relative flex w-full flex-1 cursor-none transition-[filter,transform] duration-500',
              view === 'loading' &&
                'pointer-events-none scale-[0.98] blur-sm brightness-90 select-none',
            )}
          >
            <ParticleBackground />
            {/* Content sits above the particle layer */}
            <div className="relative z-10 flex w-full flex-1">
              <WalletInput onAnalyze={handleAnalyze} />
            </div>
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
            <div className="mx-auto w-full max-w-none min-w-0 px-4 py-6 sm:px-5 sm:py-7 md:px-6 lg:px-8 xl:px-10 2xl:px-12">
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

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.02 }}
                className="mt-8"
              >
                <AiInsightsSection
                  cards={result.aiInsights.cards}
                  forecasts={result.aiInsights.forecasts}
                  anomalies={result.aiInsights.anomalies}
                />
              </motion.div>

              {/* Main analysis: stack on small screens; ~58/42 then balances on wide screens */}
              <div className="mt-8 grid min-w-0 grid-cols-1 gap-x-6 gap-y-6 md:gap-x-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] xl:gap-x-10 2xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] 2xl:gap-x-12">
                {/* ── LEFT COLUMN ── */}
                <div className="min-w-0 space-y-6">
                  {/* Behavioral Summary */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.05 }}
                  >
                    <Card className="overflow-hidden border-border bg-card shadow-sm ring-1 ring-primary/10 dark:ring-primary/20">
                      <div className="border-b border-violet-500/15 bg-violet-500/10 px-4 pt-4 dark:bg-violet-500/15">
                        <div className="flex items-center gap-2 pb-3">
                          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                            <FileText className="size-4" strokeWidth={2} />
                          </div>
                          <CardTitle className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                            Behavioral Summary
                          </CardTitle>
                        </div>
                      </div>
                      <CardContent className="pb-5">
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
                <div className="min-w-0 space-y-4">
                  {/* Flow Analysis */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.08 }}
                  >
                    <FlowSection flow={result.flow} />
                  </motion.div>

                  {/* Counterparty + temporal (Helius-derived) */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.1 }}
                  >
                    <IntelligenceOverview data={result.intelligence} />
                  </motion.div>

                  {/* SOL-transfer graph metrics */}
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

                  {/* Token Activity */}
                  {result.tokenActivity.uniqueMints > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: 0.24 }}
                    >
                      <TokenActivity tokenActivity={result.tokenActivity} />
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.35 }}
                className="mt-10 border-t border-border pt-4"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground">Analysis generated · Mar 2026</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                    className="w-full sm:w-auto"
                  >
                    Analyze another wallet
                  </Button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading overlay — fixed on top of the blurred landing */}
      <AnimatePresence>
        {view === 'loading' && (
          <LoadingSteps
            allSteps={allSteps}
            currentStepIndex={currentStepIndex}
            isDone={loadingDone}
            onComplete={handleLoadingComplete}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
