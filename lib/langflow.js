// Langflow client. Server-side only - never import this from a 'use client'
// file, or LANGFLOW_API_KEY ships to the browser.
//
// The system prompt is duplicated from the Langflow flow config on purpose: the
// dashboard copy shapes the demo, this one is the fallback if the flow is
// reconfigured or points at the wrong flow.

export const SYSTEM_PROMPTS = {
  strict: `You are Bob, a Socratic AI tutor for computer science students studying in Indonesia. Your ONLY method is to respond with guiding questions — never give direct answers, complete code solutions, or step-by-step explanations unless the student has already tried and shown their work. Probe their reasoning and expose gaps with targeted questions so they discover the answer themselves. Keep responses to 2-4 sentences. Always end with a question.

Rules:
- Never write a full working solution, even if the student asks directly.
- If asked for code, give at most a short fragment or a hint about which construct to reach for, then ask a question.
- Reply in the language the student uses. If they write in Indonesian, reply in Indonesian.
- Use **bold** sparingly for the key term you want them to think about.`,

  guided: `You are Bob, an AI tutor for computer science students studying in Indonesia. You use the Guided Socratic method: provide clear hints, partial explanations, and nudges in the right direction. You may give short code snippets as examples, but always follow them with a question asking the student to extend or apply what they just learned. Keep responses focused and encouraging. Always end with a question or a small challenge.

Rules:
- Never paste a complete solution to the exact problem the student is on. Hints and partial examples only.
- Reply in the language the student uses. If they write in Indonesian, reply in Indonesian.
- Use **bold** sparingly for the key term you want them to notice.`,
}

export function getSystemPrompt(mode) {
  return SYSTEM_PROMPTS[mode] ?? SYSTEM_PROMPTS.guided
}

// The response shape is deeply nested and has shifted between versions
// (results.message.text, artifacts.message, results.message, ...). Walking the
// object for the first non-empty string is more durable than hardcoding a path.
export function extractLangflowText(payload) {
  const first = payload?.outputs?.[0]
  if (!first) return ''

  const candidates = [
    first.outputs?.[0]?.results?.message?.text,
    first.outputs?.[0]?.artifacts?.message,
    first.outputs?.[0]?.results?.message,
    first.outputs?.[0]?.results?.text,
    // A text component nests the string one level deeper, as outputs.message.message.
    first.outputs?.[0]?.outputs?.message?.message,
    first.outputs?.[0]?.outputs?.message,
    first.artifacts?.message,
  ]

  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim()
  }

  // Last resort: stringify and look for a text field anywhere in the subtree.
  const found = findFirstText(first, 0)
  return found ?? ''
}

function findFirstText(node, depth) {
  if (depth > 6 || node == null || typeof node !== 'object') return null
  if (typeof node.text === 'string' && node.text.trim()) return node.text.trim()
  if (typeof node.result === 'string' && node.result.trim()) return node.result.trim()
  for (const value of Object.values(node)) {
    const hit = findFirstText(value, depth + 1)
    if (hit) return hit
  }
  return null
}

/** Call the Langflow flow and return the assistant reply text. */
export async function callLangflow({ message, mode, sessionId }) {
  const base = process.env.LANGFLOW_URL?.replace(/\/+$/, '')
  const flowId = process.env.LANGFLOW_FLOW_ID
  const apiKey = process.env.LANGFLOW_API_KEY

  if (!base || !flowId || !apiKey) {
    throw new Error('Langflow is not configured. Set LANGFLOW_URL, LANGFLOW_FLOW_ID and LANGFLOW_API_KEY in .env.')
  }

  const inputType = process.env.LANGFLOW_INPUT_TYPE || 'chat'
  const outputType = process.env.LANGFLOW_OUTPUT_TYPE || 'chat'

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 45_000)

  try {
    const res = await fetch(`${base}/api/v1/run/${flowId}?stream=false`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'ngrok-skip-browser-warning': '69420',
      },
      body: JSON.stringify({
        input_value: message,
        input_type: inputType,
        output_type: outputType,
        // Every caller passes a per-request id. Scoping to anything stable (a user, a
        // tab) would let the flow's memory outlive the chat that built it, and a
        // stale topic can then steer an unrelated question.
        session_id: sessionId,
      }),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      throw new Error(`Langflow ${res.status}: ${detail.slice(0, 200) || res.statusText}`)
    }

    const payload = await res.json()
    const text = extractLangflowText(payload)
    if (!text) throw new Error('Langflow returned an empty response')
    return text
  } finally {
    clearTimeout(timeout)
  }
}