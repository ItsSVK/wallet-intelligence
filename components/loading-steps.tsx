'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check, Loader2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface LoadingStepsProps {
  // Full step labels, received from the backend's init event
  allSteps: string[]
  // Index of the step currently in progress (-1 = awaiting first step event)
  currentStepIndex: number
  // True once the backend emits { type: "done" }
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
    const t = setTimeout(onComplete, 400)
    return () => clearTimeout(t)
  }, [isDone, onComplete])

  return (
    <motion.div
      className="flex w-full flex-1 flex-col items-center justify-center px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Analyzing wallet</h2>
          <p className="text-sm text-muted-foreground">This takes a few seconds.</p>
        </div>

        <ol className="space-y-3">
          {allSteps.map((label, i) => {
            const isDoneStep = isDone || i < currentStepIndex
            const isActive = !isDone && i === currentStepIndex
            return (
              <motion.li
                key={i}
                className="flex items-center gap-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.06, ease: 'easeOut' }}
              >
                <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                  {isDoneStep ? (
                    <motion.div
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Check className="size-4 text-foreground" />
                    </motion.div>
                  ) : isActive ? (
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  ) : (
                    <div className="h-1.5 w-1.5 rounded-full bg-border" />
                  )}
                </div>
                <span
                  className={
                    isDoneStep
                      ? 'text-sm text-muted-foreground line-through'
                      : isActive
                        ? 'text-sm font-medium text-foreground'
                        : 'text-sm text-muted-foreground/50'
                  }
                >
                  {label}
                </span>
              </motion.li>
            )
          })}
        </ol>

        {allSteps.length > 0 && (
          <div className="space-y-2 pt-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        )}
      </div>
    </motion.div>
  )
}
