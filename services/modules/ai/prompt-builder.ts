import type { WalletAnalysisInput } from '../wallet-analysis/types'

export function buildWalletAnalysisPrompt(input: WalletAnalysisInput): string {
  const prompt = `
You are an expert blockchain analyst specializing in Solana wallet behavior.

You are given structured wallet analytics data (NOT raw transactions). The data already includes engineered features such as activity rate, flow direction, protocol usage, graph connectivity, and inferred intents.

Your task is to produce a precise behavioral classification of the wallet.

---

INPUT DATA:
${JSON.stringify(input, null, 2)}

---

ANALYSIS RULES:

1. Do NOT repeat or summarize the input.
2. Focus strictly on INTERPRETATION and CLASSIFICATION.
3. Be decisive. Avoid vague language like "possibly", "might", or "appears".

---

SIGNAL PRIORITY (VERY IMPORTANT):

Use signals in this order of importance:

1. Graph signals (highest priority):
   - concentration_score
   - hub_score
   - unique_connections

2. Flow + activity:
   - flow.direction
   - activity.consistency_score
   - activity.tx_per_minute

3. Behavioral summaries:
   - summary.wallet_type (validate or challenge it)
   - recent_activity.intent
   - protocols

---

INTERPRETATION GUIDELINES:

- High concentration_score -> repeated interactions -> trading bot / loop behavior
- Low concentration_score -> wide distribution -> airdrop / spam pattern
- High hub_score -> structured repeated interactions -> automation
- High unique_connections -> broad network -> distribution or aggregator

- High consistency_score -> automated/scripted behavior
- Low consistency_score -> human / irregular usage

- Mostly_outgoing -> distributor / sender
- Mostly_incoming -> collector / receiver

- Dust transfers + multi-recipient -> airdrop or spam bot

---

REQUIRED OUTPUT:

You MUST determine:

- wallet_profile (clear category: bot, trader, distributor, NFT user, etc.)
- intent of activity
- level of automation (manual vs automated)
- key behavioral signals driving your conclusion

---

OUTPUT FORMAT (STRICT JSON ONLY):

{
  "wallet_profile": "...",
  "behavior_summary": "...",
  "key_signals": ["...", "..."],
  "activity_pattern": "...",
  "flow_analysis": "...",
  "protocol_usage_insight": "...",
  "risk_level": "low | medium | high",
  "confidence": "low | medium | high"
}
`

  return prompt.trim()
}
