import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const BASE58_CHAR_TO_VALUE = new Map(BASE58_ALPHABET.split('').map((char, index) => [char, index]))

function decodeBase58(value: string) {
  const bytes: number[] = []

  for (const char of value) {
    const digit = BASE58_CHAR_TO_VALUE.get(char)

    if (digit === undefined) {
      return null
    }

    let carry = digit

    for (let i = 0; i < bytes.length; i += 1) {
      const nextValue = bytes[i] * 58 + carry
      bytes[i] = nextValue & 255
      carry = nextValue >> 8
    }

    while (carry > 0) {
      bytes.push(carry & 255)
      carry >>= 8
    }
  }

  for (const char of value) {
    if (char !== '1') {
      break
    }

    bytes.push(0)
  }

  return Uint8Array.from(bytes.reverse())
}

export function isValidSolanaAddress(address: string) {
  if (address.length < 32 || address.length > 44) {
    return false
  }

  const decoded = decodeBase58(address)

  return decoded !== null && decoded.length === 32
}
