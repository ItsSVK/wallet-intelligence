'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { LoaderCore } from '@/components/ui/multi-step-loader'

interface LoadingStepsProps {
  /** Full step labels received from the backend's init event */
  allSteps: string[]
  /** Index of the step currently in progress (-1 = awaiting first step event) */
  currentStepIndex: number
  /** True once the backend emits { type: "done" } */
  isDone: boolean
  onComplete: () => void
}

export function LoadingSteps({
  allSteps,
  currentStepIndex,
  isDone,
  onComplete,
}: LoadingStepsProps) {
  useEffect(() => {
    if (!isDone) return
    const t = setTimeout(onComplete, 600)
    return () => clearTimeout(t)
  }, [isDone, onComplete])

  // Map step strings to the shape LoaderCore expects
  const loadingStates = allSteps.map((text) => ({ text }))

  // When isDone, mark all steps visually complete by pinning to the last index
  const value = isDone
    ? Math.max(loadingStates.length - 1, 0)
    : Math.max(currentStepIndex, 0)

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="multi-step-loader"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-100 flex w-full h-full items-center justify-center backdrop-blur-2xl"
      >
        <div className="relative h-96">
          {loadingStates.length > 0 ? (
            <LoaderCore loadingStates={loadingStates} value={value} />
          ) : (
            // Before the init event arrives — show a subtle pulse
            <div className="flex flex-col items-center justify-center gap-3 mt-40">
              <div className="h-2 w-2 animate-ping rounded-full bg-foreground/40" />
              <span className="text-sm text-muted-foreground">Connecting…</span>
            </div>
          )}
        </div>

        {/* Radial gradient vignette — same as MultiStepLoader */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-full bg-linear-to-t from-white via-white dark:from-black dark:via-black mask-[radial-gradient(900px_at_center,transparent_30%,white)]" />
      </motion.div>
    </AnimatePresence>
  )
}
