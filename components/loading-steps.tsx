"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Check, Loader2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

const STEPS = [
  "Fetching transactions...",
  "Processing wallet activity...",
  "Building behavioral model...",
  "Analyzing with AI...",
]

const STEP_DURATION = 900

interface LoadingStepsProps {
  onComplete: () => void
}

export function LoadingSteps({ onComplete }: LoadingStepsProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [completed, setCompleted] = useState<number[]>([])

  useEffect(() => {
    if (currentStep >= STEPS.length) {
      const t = setTimeout(onComplete, 400)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => {
      setCompleted((prev) => [...prev, currentStep])
      setCurrentStep((prev) => prev + 1)
    }, STEP_DURATION)
    return () => clearTimeout(t)
  }, [currentStep, onComplete])

  return (
    <motion.div
      className="flex flex-1 flex-col items-center justify-center w-full px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Analyzing wallet
          </h2>
          <p className="text-sm text-muted-foreground">
            This takes a few seconds.
          </p>
        </div>

        <ol className="space-y-3">
          {STEPS.map((step, i) => {
            const isDone = completed.includes(i)
            const isActive = currentStep === i
            return (
              <motion.li
                key={step}
                className="flex items-center gap-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.25,
                  delay: i * 0.06,
                  ease: "easeOut",
                }}
              >
                <div className="shrink-0 w-5 h-5 flex items-center justify-center">
                  {isDone ? (
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
                    <div className="w-1.5 h-1.5 rounded-full bg-border" />
                  )}
                </div>
                <span
                  className={
                    isDone
                      ? "text-sm text-muted-foreground line-through"
                      : isActive
                        ? "text-sm text-foreground font-medium"
                        : "text-sm text-muted-foreground/50"
                  }
                >
                  {step}
                </span>
              </motion.li>
            )
          })}
        </ol>

        <div className="space-y-2 pt-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    </motion.div>
  )
}
