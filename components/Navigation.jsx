'use client'

import React from 'react'
import { Home, Bot, Map, Gamepad2, MoreHorizontal, Users, ClipboardCheck } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { LearnGoIcon, LearnGoWordmark } from './LearnGoLogo'

// Bottom-nav tabs (mobile) — matches reference image exactly.
const tabs = [
  { id: 'tutor',  label: 'AI Tutor', Icon: Bot,       href: '/tutor' },
  { id: 'learn',  label: 'Learn',    Icon: Map,       href: '/learn' },
  { id: 'home',   label: 'Home',     Icon: Home,      href: '/', center: true },
  { id: 'game',   label: 'Game',     Icon: Gamepad2,  href: '/game' },
  { id: 'other',  label: 'Other',    Icon: MoreHorizontal, href: '/other' },
]

const sidebarEntries = [
  { id: 'home',      label: 'Home',      Icon: Home,     href: '/' },
  { id: 'tutor',     label: 'AI Tutor',  Icon: Bot,      href: '/tutor' },
  { id: 'learn',     label: 'Learn',     Icon: Map,      href: '/learn' },
  { id: 'quiz',      label: 'Quiz',      Icon: ClipboardCheck, href: '/quiz' },
  { id: 'game',      label: 'Game',      Icon: Gamepad2, href: '/game' },
  { id: 'community', label: 'Community', Icon: Users,    href: '/community' },
  { id: 'other',     label: 'Other',     Icon: MoreHorizontal, href: '/other' },
]

export function Sidebar({ active, onNavigate }) {
  const pathname = usePathname()

  // `navTab` is the coarse mapping from the mobile bottom nav, where routes
  // without a tab of their own fold into a parent. The sidebar has a dedicated
  // row for those, so folding them here would light up two rows at once; the
  // current route always wins and `navTab` only applies to rows the sidebar lacks.
  const exactEntry = sidebarEntries.find(e => e.href === pathname)?.id

  return (
    <nav className="fixed left-0 top-0 bottom-0 z-20 w-56 bg-navy border-r border-indigo hidden lg:flex flex-col py-4 px-3 gap-1">
      <button
        onClick={() => onNavigate('home')}
        className="flex items-center gap-2.5 px-3 pb-3 mb-1 border-b border-indigo text-left"
      >
        <LearnGoIcon size={30} />
        <LearnGoWordmark className="text-lg font-extrabold tracking-tight text-white" />
      </button>

      {sidebarEntries.map(({ id, label, Icon }) => {
        const highlighted = id === exactEntry || (exactEntry === undefined && active === id)

        return (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            aria-current={highlighted ? 'page' : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-left w-full
              ${highlighted
                ? 'text-orange'
                : 'text-slate hover:text-white hover:bg-white/5'
              }`}
            style={highlighted ? { background: 'rgba(255,122,0,0.12)' } : {}}
          >
            <Icon
              size={18}
              style={{ color: highlighted ? '#FF7A00' : undefined }}
            />
            {label}
            {highlighted && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: '#FF7A00' }} />
            )}
          </button>
        )
      })}

      <div className="mt-auto px-3 py-2">
        <p className="text-xs text-slate/40 font-mono">LearnGo v1.0.0</p>
        <p className="text-xs text-slate/40">AI Companion for CS</p>
      </div>
    </nav>
  )
}

// Community is accessed via the "Other" tab on mobile; the bottom nav uses the
// 5 standard tabs, and "Other" lights up for both /other and /community.
export function BottomNav({ active, onNavigate }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-navy border-t border-indigo px-1">
      <div className="flex items-center justify-around">
        {tabs.map(({ id, label, Icon }) => {
          const isActive = active === id

          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className="nav-item flex-1 pt-2.5 pb-2"
              style={isActive ? { color: '#FF7A00' } : {}}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.4 : 2}
                style={{ color: isActive ? '#FF7A00' : '#8B8CA5' }}
              />
              <span
                className="text-[11px] font-semibold leading-tight"
                style={{ color: isActive ? '#FF7A00' : '#8B8CA5' }}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
