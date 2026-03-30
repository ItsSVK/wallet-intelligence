'use client';

import { useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { WalletInput } from '@/components/wallet-input';
import { LoadingSteps } from '@/components/loading-steps';
import { SummaryCard } from '@/components/summary-card';
import { SignalsGrid } from '@/components/signals-grid';
import { MetricsPanel } from '@/components/metrics-panel';
import { ActivityList } from '@/components/activity-list';
import { FlowSection } from '@/components/flow-section';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

type View = 'landing' | 'loading' | 'results';

const MOCK_RESULT = {
  walletProfile: 'DeFi Power User' as const,
  confidence: 87,
  riskLevel: 'Medium' as const,
  behaviorSummary:
    'This wallet demonstrates consistent high-frequency trading behavior concentrated in DeFi protocols. Activity patterns suggest an experienced operator with systematic execution habits — likely using automated tooling for at least a portion of transaction volume. Interaction graph analysis shows strong centrality across Raydium and Orca liquidity pools, with limited exposure to high-risk token launches. No mixing patterns or obfuscation signals detected.',
  signals: [
    {
      title: 'High Frequency Execution',
      description:
        'Transaction rate significantly exceeds typical wallet averages, suggesting automated or semi-automated tooling.',
    },
    {
      title: 'Protocol Concentration',
      description:
        'Over 70% of activity is concentrated in 3 DeFi protocols, indicating deliberate strategy rather than exploration.',
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
    {
      title: 'Hub Node Behavior',
      description:
        'Wallet appears frequently as an intermediary in multi-hop flows, indicating ecosystem influence.',
    },
  ],
  metrics: {
    txPerMinute: 2.4,
    consistencyScore: 82,
    concentrationScore: 74,
    hubScore: 61,
  },
  activity: [
    {
      type: 'Swap',
      pattern: 'Raydium AMM → USDC/SOL',
      amountCategory: 'large' as const,
      timestamp: '2h ago',
    },
    {
      type: 'Liquidity Add',
      pattern: 'Orca Whirlpool deposit',
      amountCategory: 'medium' as const,
      timestamp: '5h ago',
    },
    {
      type: 'Token Transfer',
      pattern: 'Outbound to known DEX hot wallet',
      amountCategory: 'large' as const,
      timestamp: '9h ago',
    },
    {
      type: 'Swap',
      pattern: 'Jupiter aggregator route',
      amountCategory: 'small' as const,
      timestamp: '14h ago',
    },
    {
      type: 'Stake',
      pattern: 'Marinade staking deposit',
      amountCategory: 'medium' as const,
      timestamp: '1d ago',
    },
  ],
  flow: {
    inbound: 18420,
    outbound: 16085,
  },
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
    <div className="flex min-h-screen flex-1 flex-col bg-zinc-50">
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
            <div className="w-full space-y-8 px-6 py-10 lg:px-10">
              {/* Nav */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="size-3.5" />
                  New analysis
                </button>
                <p className="max-w-[200px] truncate font-mono text-xs text-muted-foreground/60">
                  {walletAddress}
                </p>
              </div>

              {/* Summary */}
              <SummaryCard
                walletAddress={walletAddress}
                walletProfile={MOCK_RESULT.walletProfile}
                confidence={MOCK_RESULT.confidence}
                riskLevel={MOCK_RESULT.riskLevel}
              />

              {/* Behavior Summary + Flow — side by side on wide screens */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.05 }}
                >
                  <Card className="h-full border-border/60 bg-slate-50">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-foreground">
                        Behavioral Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-7 text-muted-foreground">
                        {MOCK_RESULT.behaviorSummary}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.08 }}
                >
                  <FlowSection
                    inbound={MOCK_RESULT.flow.inbound}
                    outbound={MOCK_RESULT.flow.outbound}
                  />
                </motion.div>
              </div>

              {/* Signals */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <SignalsGrid signals={MOCK_RESULT.signals} />
              </motion.div>

              {/* Metrics + Activity — side by side on wide screens */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.15 }}
                >
                  <MetricsPanel metrics={MOCK_RESULT.metrics} />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <ActivityList items={MOCK_RESULT.activity} />
                </motion.div>
              </div>

              {/* Footer CTA */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.35 }}
                className="border-t border-border pt-4"
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
