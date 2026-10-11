'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'

// Community chat over Supabase Realtime.
//
// Two things this hook gets right that are easy to get wrong:
//
// 1. Sending is an `insert` and nothing else. Realtime echoes an INSERT back to
//    the client that made it, so appending locally too would show every message
//    twice. Messages only enter state via the initial load or the realtime
//    handler.
// 2. Author names come from `get_chat_messages()` on load and
//    `get_chat_authors()` for ids first seen on a realtime event. The `users`
//    table cannot be joined client-side: RLS only lets a user read their own row.

const HISTORY_LIMIT = 50
const CHANNEL_NAME = 'community_chats'
const MAX_MESSAGE_LENGTH = 2000

export function useCommunityChat() {
  const { user } = useAuth()
  const userId = user?.id ?? null

  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  // 'connecting' | 'live' | 'offline' - drives the status dot in the UI.
  const [status, setStatus] = useState('connecting')

  // user_id -> { name, avatarUrl }. A ref, not state: it is a lookup cache that
  // never needs to trigger a render, and the realtime callback must not depend
  // on a render having happened first.
  const authorsRef = useRef(new Map())

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      if (!userId) {
        setMessages([])
        setLoading(false)
        return
      }

      setLoading(true)
      const supabase = createClient()
      const { data, error: fetchError } = await supabase.rpc('get_chat_messages', {
        limit_rows: HISTORY_LIMIT,
      })

      if (cancelled) return

      if (fetchError) {
        console.error('[chat] history failed:', fetchError.message)
        setError('Could not load messages.')
        setLoading(false)
        return
      }

      const rows = data ?? []
      for (const row of rows) {
        const author = {
          name: row.author_name || 'Learner',
          avatarUrl: row.author_avatar ?? null,
        }
        authorsRef.current.set(row.user_id, author)
      }

      // Newest last, so the list renders bottom-up without reversing at paint.
      setMessages(rows.slice().reverse().map(row => ({
        ...row,
        author: authorsRef.current.get(row.user_id),
      })))
      setError(null)
      setLoading(false)
    })()

    return () => { cancelled = true }
  }, [userId])

  useEffect(() => {
    if (!userId) return

    const supabase = createClient()

    // Fills the author cache for ids the history load missed. Returns the
    // resolved authors so a name can render immediately instead of "Learner".
    const resolveAuthors = async (ids) => {
      const missing = ids.filter(id => id && !authorsRef.current.has(id))
      if (missing.length === 0) return authorsRef.current

      const { data, error: authorsError } = await supabase.rpc('get_chat_authors', { user_ids: missing })
      if (authorsError) {
        console.error('[chat] author lookup failed:', authorsError.message)
        setError('Could not load chat profiles.')
        return authorsRef.current
      }

      for (const row of data ?? []) {
        authorsRef.current.set(row.id, {
          name: row.name || 'Learner',
          avatarUrl: row.avatar_url ?? null,
        })
      }
      return authorsRef.current
    }

    const channel = supabase
      .channel(CHANNEL_NAME)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'community_chats' },
        (payload) => {
          const row = payload.new
          if (!row?.id) return

          const known = authorsRef.current.get(row.user_id)
          const push = (author) => {
            setMessages(prev => {
              // The same INSERT can in principle reach us twice (own echo plus
              // a resubscribe replay). Keying on id makes that harmless.
              if (prev.some(m => m.id === row.id)) return prev
              return [...prev, { ...row, author }]
            })
          }

          if (known) {
            push(known)
            return
          }

          // Unknown author: render with a placeholder, then patch the name in once the
          // lookup lands. setState in an async callback avoids the
          // synchronous-effect-update pattern the lint rule rejects.
          push({ name: 'Learner', avatarUrl: null })
          resolveAuthors([row.user_id]).then(authors => {
            const author = authors.get(row.user_id)
            if (!author) return
            setMessages(prev => prev.map(m =>
              m.id === row.id ? { ...m, author } : m,
            ))
          })
        },
      )
      .subscribe((state) => {
        if (state === 'SUBSCRIBED') setStatus('live')
        else if (state === 'CHANNEL_ERROR' || state === 'TIMED_OUT') setStatus('offline')
        else setStatus('connecting')
      })

    return () => {
      // Removing the channel closes the websocket subscription; leaving it open
      // would keep delivering events for an unmounted screen.
      supabase.removeChannel(channel)
    }
  }, [userId])

  // Insert only. No local append - see the note at the top of this file.
  const sendMessage = useCallback(async (text) => {
    const message = text.trim()
    if (!userId || !message) return

    if (message.length > MAX_MESSAGE_LENGTH) {
      setError(`Messages are limited to ${MAX_MESSAGE_LENGTH} characters.`)
      return
    }

    setSending(true)
    const supabase = createClient()
    const { error: insertError } = await supabase
      .from('community_chats')
      .insert({ user_id: userId, message })

    setSending(false)

    if (insertError) {
      console.error('[chat] send failed:', insertError.message)
      setError('Could not send. Check your connection and try again.')
      return
    }

    // Quest chat_community dihitung dari jumlah baris di community_chats, jadi
    // setelah pesan tersimpan server mengevaluasi ulang quest-nya. Kegagalan di
    // sini tidak menggagalkan pengiriman pesan, itu sudah sukses.
    supabase.rpc('sync_daily_quests').then(({ error: questError }) => {
      if (questError) {
        console.error('[chat] quest sync failed:', questError.message)
      }
    })
  }, [userId])

  return { messages, loading, sending, error, status, sendMessage, setError }
}