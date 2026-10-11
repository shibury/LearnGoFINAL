'use client'

import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Send, Users, Radio, Loader2 } from 'lucide-react'
import { useCommunityChat } from '@/lib/useCommunityChat'
import { useAuth } from '@/context/AuthContext'

// Community chat panel. Messages come from the `useCommunityChat` hook: an
// initial RPC load plus a Realtime INSERT subscription.

const STATUS_STYLE = {
  live:      { label: 'Live',    dot: 'bg-emerald', text: 'text-emerald' },
  connecting:{ label: 'Sync',    dot: 'bg-yellow-400 animate-pulse', text: 'text-yellow-400' },
  offline:   { label: 'Offline', dot: 'bg-red-500', text: 'text-red-400' },
}

function formatTime(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

function initials(name) {
  return (name || '?').trim().split(/\s+/)[0]?.[0]?.toUpperCase() || '?'
}

export default function ChatPanel() {
  const { messages, loading, sending, error, status, sendMessage, setError } = useCommunityChat()
  const { user, displayName, avatarUrl } = useAuth()
  const [draft, setDraft] = useState('')

  const scrollRef = useRef(null)
  const pinnedToBottom = useRef(true)

  const statusStyle = STATUS_STYLE[status] ?? STATUS_STYLE.connecting

  // Follow new messages only while the reader is already at the bottom, so
  // scrolling up to re-read something is not yanked away by an incoming message.
  useEffect(() => {
    const el = scrollRef.current
    if (el && pinnedToBottom.current) el.scrollTop = el.scrollHeight
  }, [messages.length])

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    pinnedToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40
  }

  const submit = async (e) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text || sending) return
    setDraft('')
    pinnedToBottom.current = true
    await sendMessage(text)
  }

  const disabled = loading || sending || !user

  return (
    <div
      className="glass-card rounded-2xl border border-white/10 overflow-hidden flex flex-col min-h-0"
      style={{ height: 'min(60dvh, calc(100dvh - 19rem))', minHeight: '20rem' }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan/20 flex items-center justify-center">
            <Users size={15} className="text-cyan" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white leading-tight">Community Chat</h3>
            <p className="text-xs text-slate leading-tight">Shared room</p>
          </div>
        </div>
        <span className={`text-xs font-semibold flex items-center gap-1.5 ${statusStyle.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
          {statusStyle.label}
        </span>
      </div>

      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-slate">
            <Loader2 size={15} className="animate-spin" />
            <span className="text-xs">Loading messages…</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10">
            <Radio size={22} className="text-slate/40 mx-auto mb-2" />
            <p className="text-xs text-slate">No messages yet. Say hello to your study group.</p>
          </div>
        ) : (
          messages.map(m => {
            const mine = m.user_id === user?.id
            const author = m.author ?? { name: 'Learner', avatarUrl: null }
            const authorName = mine ? displayName : author.name
            const authorAvatar = mine ? (author.avatarUrl || avatarUrl) : author.avatarUrl

            return (
              <div key={m.id} className={`flex gap-2.5 ${mine ? 'flex-row-reverse' : ''}`}>
                {authorAvatar ? (
                  // Google avatar URLs are arbitrary external hosts, so the
                  // image is passed through unoptimized instead of adding every
                  // possible domain to remotePatterns.
                  <div className="relative w-7 h-7 rounded-lg overflow-hidden flex-shrink-0 mt-0.5">
                    <Image
                      src={authorAvatar}
                      alt=""
                      fill
                      sizes="28px"
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5 ${
                    mine ? 'bg-orange/25 text-orange' : 'bg-raised text-slate'
                  }`}>
                    {initials(authorName)}
                  </div>
                )}

                <div className={`min-w-0 max-w-[80%] ${mine ? 'items-end text-right' : ''}`}>
                  <p className="text-xs text-slate mb-0.5">
                    {authorName}
                    <span className="text-slate/50 ml-1.5">{formatTime(m.created_at)}</span>
                  </p>
                  <div
                    className={`px-3 py-2 rounded-xl text-sm leading-relaxed text-left break-words ${
                      mine
                        ? 'bg-orange text-white rounded-tr-sm'
                        : 'bg-raised text-slate-light rounded-tl-sm'
                    }`}
                  >
                    {m.message}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {error && (
        <div className="px-4 py-2 border-t border-white/10 bg-red-500/10 flex items-center justify-between gap-3 flex-shrink-0">
          <p className="text-xs text-red-400">{error}</p>
          <button onClick={() => setError(null)} className="text-xs text-slate hover:text-white flex-shrink-0">
            Dismiss
          </button>
        </div>
      )}

      <form onSubmit={submit} className="border-t border-white/10 p-3 flex gap-2 flex-shrink-0">
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          maxLength={2000}
          disabled={disabled}
          placeholder={user ? 'Message the community…' : `Sign in as ${displayName || 'a learner'} to chat`}
          className="input-dark flex-1 !py-2 text-sm disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !draft.trim()}
          aria-label="Send message"
          className="px-3.5 rounded-xl bg-orange hover:bg-orange-glow text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center"
        >
          {sending
            ? <Loader2 size={15} className="animate-spin" />
            : <Send size={15} />}
        </button>
      </form>
    </div>
  )
}