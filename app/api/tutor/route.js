export const maxDuration = 60

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callLangflow, getSystemPrompt } from '@/lib/langflow'
import { isOffTopic, REFUSAL } from '@/lib/offTopic'

// Chat proxy for the AI Tutor. Everything that talks to Langflow happens here
// rather than in the browser: LANGFLOW_API_KEY must not reach the client, and the
// guard and prompt only mean anything enforced server-side.
export async function POST(request) {
  // Reading the user here (not getSession) means an expired or forged token is
  // rejected rather than trusted.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: 'Sign in to use the AI Tutor.' },
      { status: 401 },
    )
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const message = typeof body?.message === 'string' ? body.message.trim() : ''
  const mode = body?.mode === 'strict' ? 'strict' : 'guided'
  const history = Array.isArray(body?.history) ? body.history : []

  if (!message) {
    return NextResponse.json({ error: 'Message is required.' }, { status: 400 })
  }
  if (message.length > 4000) {
    return NextResponse.json({ error: 'Message too long.' }, { status: 413 })
  }

  // Checked before any network call so a rejected question never costs a token
  // and never depends on the flow being configured.
  if (isOffTopic(message)) {
    return NextResponse.json({ reply: REFUSAL, refused: true })
  }

  // Resend the prompt as a safety net. The same text is set in the Langflow
  // flow config, which is what shapes the demo; this copy keeps the behaviour
  // if the flow is ever reconfigured or swapped.
  const prompt = getSystemPrompt(mode)

  // Replay the last few turns so the flow has context: the per-request session id
  // below means the flow keeps no memory of its own between calls.
  const recent = history
    .filter((m) => m && typeof m.content === 'string' && m.role !== 'system')
    .slice(-6)
    .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }))

  const transcript = [
    `${prompt}\n\n---\nPercakapan sejauh ini:`,
    ...recent.map((m) => `${m.role === 'assistant' ? 'Bob' : 'Siswa'}: ${m.content}`),
    `Siswa: ${message}`,
    'Bob:',
  ].join('\n')

  // A fresh session id per request, deliberately: the flow's Agent component keeps
  // conversation memory scoped to session_id with no expiry, so a user-keyed id
  // let an earlier question steer an unrelated one. The transcript above already
  // replays the last few turns.
  const sessionId = `learngo-${crypto.randomUUID()}`

  try {
    const reply = await callLangflow({
      message: transcript,
      mode,
      sessionId,
    })
    return NextResponse.json({ reply })
  } catch (err) {
    console.error('[api/tutor] Langflow call failed:', err.message)

    // Configuration problems are called out separately: the failure mode most likely
    // to happen right before a demo, and the message says exactly what to fix.
    const configError =
      err.message.includes('not configured') || err.message.includes('LANGFLOW_')

    return NextResponse.json(
      {
        error: configError
          ? 'AI tutor is not configured. Check LANGFLOW_URL, LANGFLOW_FLOW_ID and LANGFLOW_API_KEY in .env.'
          : 'The AI tutor is unreachable right now. Please try again.',
        detail: err.message,
      },
      { status: configError ? 503 : 502 },
    )
  }
}