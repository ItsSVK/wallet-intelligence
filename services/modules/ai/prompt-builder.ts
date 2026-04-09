import type { WalletAnalysisInput } from '../wallet-analysis/types'

/** Trim payload for the model: keep intelligence but cap very long address lists. */
function compactInputForPrompt(input: WalletAnalysisInput): unknown {
  const { intelligence, ...rest } = input
  return {
    ...rest,
    intelligence: {
      ...intelligence,
      top_counterparties: intelligence.top_counterparties.slice(0, 12),
      network: {
        ...intelligence.network,
        nodes: intelligence.network.nodes.slice(0, 14),
        edges: intelligence.network.edges.slice(0, 14),
      },
    },
  }
}

export function buildWalletAnalysisPrompt(input: WalletAnalysisInput): string {
  const compact = compactInputForPrompt(input)

  const prompt = `
You are an expert Solana on-chain analyst. Your job is to turn **structured analytics** into **actionable intelligence** for a human reader.

You receive engineered features derived from Helius enhanced transactions. The field \`intelligence\` is especially important: it contains **counterparty network statistics**, **UTC hourly activity**, **entropy of interactions**, and **deterministic anomaly_hints** — use these heavily. Ground every claim in the numbers; do not invent transaction types or protocols that are absent from the data.

---

INPUT (JSON):
${JSON.stringify(compact, null, 2)}

---

HOW TO USE \`intelligence\`:

- **counterparty_entropy** (0–1): Low = few dominant counterparties (bot-like loops, OTC, or repeated DEX routes). High = many distinct addresses (airdrop farming, broad retail usage, or mixing).
- **top_counterparties**: Who the wallet repeatedly interacts with (programs, exchanges, or other wallets). Refer to addresses by short form (first 4 + last 4 chars) only.
- **activity_by_hour** + **peak_hour_utc** + **active_hours_utc**: When activity happens. Comment on whether it looks automated (narrow UTC windows) vs spread out.
- **network.nodes / edges**: A simplified star graph from the wallet — interpret concentration vs long tail.
- **anomaly_hints**: Pre-computed flags — explain what they mean for THIS wallet in plain language (do not just repeat the hint text).

Combine with existing signals: **graph** (SOL-transfer edges), **fees**, **tx_types**, **swap_count**, **token_activity**, **temporal.burst_score**, **flow**, **protocols**.

---

STRICT RULES:

1. Do NOT restate raw JSON. Synthesize.
2. Be decisive; avoid filler ("might", "perhaps") unless uncertainty is explicit in the data.
3. Never claim price, profit, or off-chain identity.
4. **insight_cards** must be 4–7 items, each with a concrete takeaway tied to specific metrics.

---

REQUIRED OUTPUT — JSON ONLY (no markdown fences):

{
  "wallet_profile": "Short label, e.g. Active DEX user, NFT-focused wallet",
  "behavior_summary": "2–4 sentences: the single clearest story about this wallet.",
  "key_signals": ["bullet 1", "bullet 2", "bullet 3"],
  "activity_pattern": "One paragraph on cadence and consistency (automation vs manual).",
  "flow_analysis": "One paragraph on incoming vs outgoing and what it implies.",
  "protocol_usage_insight": "One paragraph on dominant programs/sources.",
  "insight_cards": [
    {
      "title": "Short headline",
      "body": "2–4 sentences. Reference specific numbers (entropy, swap %, hours, fees).",
      "category": "counterparty"
    }
  ],
  "anomalies": ["Optional: unusual patterns worth watching, or empty array"],
  "forecasts": [
    "Soft, non-financial 'if history repeats' statements, e.g. likely next behavior — NOT price predictions."
  ],
  "risk_level": "low | medium | high",
  "confidence": "low | medium | high"
}

**category** for insight_cards must be one of: "counterparty", "temporal", "risk", "behavior", "protocol", "fees".

---

FORECASTS RULE: Only behavioral predictions relative to this wallet's own history (e.g. "likely to keep routing through Jupiter-class activity if swap share stays high"). Never predict token prices.

`

  return prompt.trim()
}
