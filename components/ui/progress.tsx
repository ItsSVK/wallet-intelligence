'use client'

import * as React from 'react'
import { motion } from 'framer-motion'

import { cn } from '@/lib/utils'

interface ProgressProps extends React.ComponentProps<'div'> {
  value?: number
  /** Fill (solid color classes) */
  colorClass?: string
  /** Track background (tinted) */
  trackClassName?: string
}

function Progress({
  className,
  value = 0,
  colorClass = 'bg-foreground',
  trackClassName = 'bg-muted',
  ...props
}: ProgressProps) {
  return (
    <div
      data-slot="progress"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('relative h-2 w-full overflow-hidden rounded-full', trackClassName, className)}
      {...props}
    >
      <motion.div
        className={cn('h-full rounded-full', colorClass)}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
      />
    </div>
  )
}

export { Progress }
