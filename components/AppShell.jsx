'use client'

import React, { useState } from 'react'
import { ArrowRight, X, Download, Trophy } from 'lucide-react'
import { Sidebar, BottomNav } from './Navigation'
import { AuthModal, LogoutModal } from './AuthModals'
import { LearnGoIcon } from './LearnGoLogo'
import AITutorScreen from '../screens/AITutorScreen'
import LessonScreen from '../screens/LessonScreen'
import OnboardingScreen from '../screens/OnboardingScreen'
import { useUI } from '../context/UIContext'

function Toast({ msg, onDone }) {
  React.useEffect(() => {
    const t = setTimeout(onDone, 3200)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up pointer-events-none">
      <div
        className="glass-card border border-white/15 px-5 py-3 rounded-2xl text-sm font-semibold text-white shadow-card flex items-center gap-2 whitespace-nowrap"
      >
        {msg}
      </div>
    </div>
  )
}

function LoginGate({ onOpen }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-obsidian/95">
      <div className="text-center px-6 max-w-sm w-full">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5"
          style={{ background: '#FF7A00' }}
        >
          <LearnGoIcon size={48} />
        </div>
        <h2 className="text-3xl font-extrabold text-white mb-2">
          Welcome to <span style={{ color: '#FF7A00' }}>LearnGo</span>
        </h2>
        <p className="text-slate text-sm mb-6 leading-relaxed">
          Your AI-powered CS companion. Master fundamentals, earn XP, and get industry-ready.
        </p>
        <button onClick={onOpen} className="btn-primary px-8 py-3 text-base w-full flex items-center justify-center gap-2">
          Get Started <ArrowRight size={18} />
        </button>
        <p className="text-xs text-slate/50 mt-4">Free forever · No credit card needed</p>
      </div>
    </div>
  )
}

function PWAInstallBanner({ onInstall, onDismiss }) {
  return (
    <div
      className="fixed bottom-20 lg:bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div
        className="pointer-events-auto mx-4 mb-2 w-full max-w-sm glass-card border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-card animate-slide-up"
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: '#FF7A00' }}
        >
          <LearnGoIcon size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white leading-tight">Install LearnGo App</p>
          <p className="text-xs text-slate">Add to home screen for quick access</p>
        </div>
        <button
          onClick={onInstall}
          className="btn-primary text-xs px-3 py-1.5 flex-shrink-0"
        >
          Install
        </button>
        <button
          onClick={onDismiss}
          className="text-slate hover:text-white transition-colors flex-shrink-0"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

// Persistent chrome (sidebar, bottom nav, overlays) wrapping the App Router page.
export default function AppShell({ children }) {
  const {
    navigate, navTab, pathname,
    isLoggedIn, showAuth, setShowAuth, showLogout, setShowLogout,
    showPwaBanner: pwaBannerVisible,
    toast, showToast, clearToast,
    activeLesson, setActiveLesson,
    showOnboarding, setShowOnboarding,
    handlePwaInstall, handlePwaDismiss,
    handleLogout, handleAuthSuccess,
  } = useUI()

  return (
    <div className="min-h-screen bg-obsidian dot-grid">
      <Sidebar active={navTab} onNavigate={navigate} />

      {/* Wrapper flex column + min-h-screen supaya halaman setinggi penuh (AI Tutor)
          bisa memakai flex-1 dan menempel input bar di dasar. */}
      <main className="pb-20 lg:pb-6 lg:pl-56 min-h-screen flex flex-col">
        <div className="max-w-4xl mx-auto px-4 lg:px-6 py-4 flex flex-col flex-1 min-h-0 w-full">
          <div className={pathname === '/tutor' ? 'flex flex-col flex-1 min-h-0' : 'hidden'}>
            <AITutorScreen />
          </div>
          {pathname !== '/tutor' && children}
        </div>
      </main>

      <BottomNav active={navTab} onNavigate={navigate} />

      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} onSuccess={handleAuthSuccess} />
      )}
      {showLogout && (
        <LogoutModal onClose={() => setShowLogout(false)} onConfirm={handleLogout} />
      )}
      {/* Lesson modal: full-screen, sits above everything */}
      {activeLesson && (
        <LessonScreen
          lang={activeLesson.lang}
          levelIndex={activeLesson.levelIndex}
          title={activeLesson.title}
          onClose={() => setActiveLesson(null)}
          onComplete={() => {
            setActiveLesson(null)
            showToast('Lesson complete! Keep going!')
          }}
        />
      )}

      {toast && <Toast msg={toast} onDone={clearToast} />}

      {!isLoggedIn && <LoginGate onOpen={() => setShowAuth(true)} />}

      {showOnboarding && isLoggedIn && (
        <OnboardingScreen onDone={() => setShowOnboarding(false)} />
      )}

      {pwaBannerVisible && (
        <PWAInstallBanner onInstall={handlePwaInstall} onDismiss={handlePwaDismiss} />
      )}
    </div>
  )
}
