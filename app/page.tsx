'use client';

import { useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { WalletInput } from '@/components/wallet-input';
import { LoadingSteps } from '@/components/loading-steps';
import { SummaryCard } from '@/components/summary-card';
import { SignalsGrid } from '@/components/signals-grid';
import { MetricsPanel } from '@/components/metrics-panel';
import { ActivityList } from '@/components/activity-list';
import { FlowSection } from '@/components/flow-section';
import { GraphIntelligence } from '@/components/graph-intelligence';
import { ProtocolUsage } from '@/components/protocol-usage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type View = 'landing' | 'loading' | 'results';

const MOCK_RESULT = {
  walletProfile: 'DeFi Power User',
  confidence: 87,
  riskLevel: 'Medium' as const,
  behaviorSummary:
    'This wallet demonstrates consistent high-frequency trading behavior concentrated in DeFi protocols. Activity patterns suggest an experienced operator with systematic execution habits — likely using automated tooling for a portion of transaction volume. Interaction graph analysis shows strong centrality with limited exposure to high-risk token launches. No mixing patterns or obfuscation signals detected.',
  signals: [
    {
      title: 'High Frequency Execution',
      description:
        'Transaction rate significantly exceeds typical wallet averages, suggesting automated or semi-automated tooling.',
    },
    {
      title: 'Protocol Concentration',
      description:
        'Over 70% of activity concentrated in 3 protocols, indicating deliberate strategy rather than exploration.',
    },
    {
      title: 'Consistent Timing Patterns',
      description:
        'Transactions cluster in predictable time windows, pointing to scheduled or algorithmic execution.',
    },
    {
      title: 'Low Dust Activity',
      description:
        'Minimal micro-transactions or spam patterns. Clean operational hygiene throughout the observed period.',
    },
  ],
  metrics: {
    txPerMinute: 2.4,
    consistencyScore: 82,
  },
  graph: {
    uniqueConnections: 142,
    concentrationScore: 74,
    hubScore: 61,
  },
  activity: [
    { type: 'SOL_TRANSFER', pattern: 'multi-recipient', intent: 'airdrop_distribution', timestamp: '2h ago' },
    { type: 'NFT_TRANSFER', pattern: 'single', intent: 'payment', timestamp: '5h ago' },
    { type: 'SOL_TRANSFER', pattern: 'single', intent: 'consolidation', timestamp: '9h ago' },
    { type: 'SOL_TRANSFER', pattern: 'multi-recipient', intent: 'batch_payout', timestamp: '14h ago' },
    { type: 'NFT_TRANSFER', pattern: 'single', intent: 'sale', timestamp: '1d ago' },
  ],
  flow: {
    direction: 'mostly_outgoing' as const,
    outgoing: 64,
    incoming: 36,
  },
  protocols: [
    { name: 'sol_transfer', count: 847, pct: 52 },
    { name: 'compressed_nft', count: 412, pct: 25 },
    { name: 'token_swap', count: 211, pct: 13 },
    { name: 'other', count: 163, pct: 10 },
  ],
};

export default function Home() {
  const [view, setView] = useState<View>('landing');
  const [walletAddress, setWalletAddress] = useState('');

  const handleAnalyze = useCallback((address: string) => {
    setWalletAddress(address);
    setView('loading');
  }, []);

  const handleLoadingComplete = useCallback(() => {
    setView('results');
  }, []);

  const handleReset = useCallback(() => {
    setView('landing');
    setWalletAddress('');
  }, []);

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
            <LoadingSteps onComplete={handleLoadingComplete} />
          </motion.div>
        )}

        {view === 'results' && (
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
                walletProfile={MOCK_RESULT.walletProfile}
                confidence={MOCK_RESULT.confidence}
                riskLevel={MOCK_RESULT.riskLevel}
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
                        <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Behavioral Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm leading-7 text-foreground">
                          {MOCK_RESULT.behaviorSummary}
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
                    <SignalsGrid signals={MOCK_RESULT.signals} />
                  </motion.div>

                  {/* Activity Timeline */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.15 }}
                  >
                    <ActivityList items={MOCK_RESULT.activity} />
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
                    <FlowSection flow={MOCK_RESULT.flow} />
                  </motion.div>

                  {/* Graph Intelligence */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.12 }}
                  >
                    <GraphIntelligence graph={MOCK_RESULT.graph} />
                  </motion.div>

                  {/* Activity Metrics */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.16 }}
                  >
                    <MetricsPanel metrics={MOCK_RESULT.metrics} />
                  </motion.div>

                  {/* Protocol Usage */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.2 }}
                  >
                    <ProtocolUsage protocols={MOCK_RESULT.protocols} />
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
  );
}
