'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { isValidSolanaAddress } from '@/lib/utils'

interface WalletInputProps {
  onAnalyze: (address: string) => void
}

export function WalletInput({ onAnalyze }: WalletInputProps) {
  const [address, setAddress] = useState('')
  const [error, setError] = useState('')

  function validateAddress(value: string) {
    if (value.length === 0) {
      return 'Please enter a Solana wallet address'
    }

    if (!isValidSolanaAddress(value)) {
      return 'This is not a valid Solana wallet address'
    }

    return ''
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const nextAddress = e.target.value
    const trimmed = nextAddress.trim()

    setAddress(nextAddress)

    if (!error) {
      return
    }

    setError(trimmed.length === 0 ? '' : validateAddress(trimmed))
  }

  function handleBlur() {
    const trimmed = address.trim()

    if (trimmed.length === 0) {
      setError('')
      return
    }

    setError(validateAddress(trimmed))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const trimmed = address.trim()

    const validationError = validateAddress(trimmed)

    if (validationError) {
      setError(validationError)
      return
    }

    setError('')
    onAnalyze(trimmed)
  }

  return (
    <motion.div
      className="flex w-full flex-1 flex-col items-center justify-center px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="w-full max-w-md space-y-10 rounded-3xl bg-background px-10 py-12 shadow-xl ring-1 shadow-black/4 ring-border/40 dark:shadow-black/30">
        <div className="space-y-2">
          <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
            Solana
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Wallet Intelligence
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Enter a wallet address to receive AI-powered behavioral analysis and on-chain insights.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            placeholder="Enter Solana wallet address"
            value={address}
            onChange={handleChange}
            onBlur={handleBlur}
            className="h-11 font-mono text-sm"
            autoComplete="off"
            spellCheck={false}
            required
            aria-invalid={error.length > 0}
            aria-describedby={error ? 'wallet-address-error' : undefined}
          />
          {error && (
            <p id="wallet-address-error" role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.99 }}
            transition={{ duration: 0.15 }}
          >
            <Button
              type="submit"
              className="h-11 w-full text-sm font-medium"
              disabled={address.trim().length === 0}
            >
              Analyze Wallet
            </Button>
          </motion.div>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Analysis is read-only and does not require wallet connection.
        </p>
      </div>
    </motion.div>
  )
}
