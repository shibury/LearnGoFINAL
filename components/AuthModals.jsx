'use client'

import React, { useState } from 'react'
import { X, Eye, EyeOff, Mail, Lock, User, Loader, ArrowRight, LogOut, Key, UserPlus } from 'lucide-react'
import { FoxMascot } from './Header'
import { LearnGoWordmark } from './LearnGoLogo'
import { useAuth } from '@/context/AuthContext'

function AuthInput({ icon: Icon, placeholder, type = 'text', value, onChange, toggleable }) {
  const [show, setShow] = useState(false)
  const inputType = toggleable ? (show ? 'text' : 'password') : type

  return (
    <div className="relative">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate">
        <Icon size={16} />
      </div>
      <input
        type={inputType}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="input-dark w-full pl-10 pr-10"
      />
      {toggleable && (
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate hover:text-white transition-colors"
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      )}
    </div>
  )
}

// Google mark. lucide has no brand icons, so the real multi-colour logo is inlined.
function GoogleIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.45a5.5 5.5 0 0 1-2.39 3.61v3h3.86c2.26-2.08 3.58-5.15 3.58-8.8Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.08 7.94-2.91l-3.86-3c-1.08.72-2.45 1.15-4.08 1.15-3.13 0-5.78-2.11-6.73-4.96H1.28v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.27 14.28a7.2 7.2 0 0 1 0-4.56v-3.1H1.28a12 12 0 0 0 0 10.76l3.99-3.1Z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.62l3.99 3.1C6.22 6.86 8.87 4.75 12 4.75Z" />
    </svg>
  )
}

export function AuthModal({ onClose, onSuccess }) {
  const [mode, setMode]       = useState('login')
  const [loading, setLoading] = useState(false)
  const [googleBusy, setGoogleBusy] = useState(false)
  const [error, setError]     = useState(null)
  const [notice, setNotice]   = useState(null)
  const [form, setForm]       = useState({ name: '', email: '', password: '' })

  const { signInWithGoogle, signInWithPassword, signUp } = useAuth()

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) return
    if (mode === 'register' && !form.name) {
      setError('Please enter your name.')
      return
    }

    setError(null)
    setNotice(null)
    setLoading(true)

    try {
      if (mode === 'register') {
        const session = await signUp(form.email, form.password, form.name)
        // No session back means the project still requires email confirmation, so
        // prompt the user to confirm instead of showing a generic failure.
        if (!session) {
          setNotice('Check your email to confirm your account, then sign in.')
          setMode('login')
          return
        }
      } else {
        await signInWithPassword(form.email, form.password)
      }
      onSuccess()
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError(null)
    setGoogleBusy(true)
    try {
      // Navigates away on success, so onSuccess here is never reached.
      await signInWithGoogle('/tutor')
    } catch (err) {
      setError(err.message || 'Google sign-in failed. Check the provider config.')
      setGoogleBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/85 animate-fade-in">
      <div className="w-full max-w-md glass-card rounded-3xl overflow-hidden shadow-card animate-slide-up">
        <div className="flex items-center justify-between px-6 py-5 border-b border-indigo">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-orange rounded-xl flex items-center justify-center">
              <FoxMascot size={22} />
            </div>
            <div>
              <LearnGoWordmark className="font-extrabold text-white text-lg" />
              <p className="text-xs text-slate leading-none mt-0.5">AI Companion for CS</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate hover:text-white transition-colors p-1.5 rounded-xl hover:bg-white/10">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-6">
          <div className="flex bg-obsidian rounded-xl border border-indigo p-0.5 gap-0.5 mb-6">
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all duration-150
                  ${mode === m ? 'bg-orange text-white' : 'text-slate hover:text-white'}`}>
                {m === 'login' ? (<><Key size={12} className="inline mr-1" /> Sign In</>) : (<><UserPlus size={12} className="inline mr-1" /> Create Account</>)}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'register' && (
              <AuthInput icon={User} placeholder="Full Name" value={form.name} onChange={set('name')} />
            )}
            <AuthInput icon={Mail} type="email" placeholder="Email address" value={form.email} onChange={set('email')} />
            <AuthInput icon={Lock} placeholder="Password" value={form.password} onChange={set('password')} toggleable />

            {mode === 'login' && (
              <div className="text-right">
                <button type="button" className="text-xs text-orange hover:text-orange-glow transition-colors">
                  Forgot password?
                </button>
              </div>
            )}

            {error && (
              <p role="alert" className="text-xs text-red-400 bg-red-500/10 border border-red-500/25 rounded-xl px-3 py-2">
                {error}
              </p>
            )}
            {notice && (
              <p role="status" className="text-xs text-slate bg-white/5 border border-indigo rounded-xl px-3 py-2">
                {notice}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || googleBusy || !form.email || !form.password}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader size={16} className="animate-spin" /> Authenticating…</>
              ) : (
                <>{mode === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight size={14} /></>
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-slate">or continue with</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading || googleBusy}
            className="btn-secondary w-full py-2.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {googleBusy
              ? <><Loader size={16} className="animate-spin" /> Redirecting to Google…</>
              : <><GoogleIcon /> <span className="text-xs font-semibold">Continue with Google</span></>}
          </button>

          <p className="text-xs text-center text-slate mt-5 leading-relaxed">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-orange hover:text-orange-glow font-semibold transition-colors">
              {mode === 'login' ? 'Sign up free' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export function LogoutModal({ onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/85 animate-fade-in">
      <div className="w-full max-w-sm glass-card rounded-3xl overflow-hidden shadow-card animate-slide-up">
        <div className="px-6 py-6 text-center">
          <div className="w-14 h-14 mx-auto bg-red-500/15 rounded-2xl flex items-center justify-center mb-4">
            <LogOut size={26} className="text-red-400" />
          </div>
          <h3 className="text-lg font-extrabold text-white mb-1">Log Out?</h3>
          <p className="text-sm text-slate leading-relaxed">
            Your streak and progress are saved. You can sign back in anytime.
          </p>
          <div className="flex gap-3 mt-6">
            <button onClick={onClose} className="btn-secondary flex-1 py-3">Cancel</button>
            <button onClick={onConfirm} className="flex-1 py-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold text-sm border border-red-500/30 transition-all duration-150">
              Yes, Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
