import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

const EMOJI_OPTIONS = ['😊', '😎', '🤩', '😄', '🥳', '👦', '👧', '👨', '👩', '🧑', '👴', '👵', '🐱', '🦊', '🐼']

export default function ProfilePage() {
  const { profile, user, refreshProfile } = useAuth()
  const [name, setName] = useState(profile?.full_name ?? '')
  const [emoji, setEmoji] = useState(profile?.avatar_emoji ?? '😊')
  const [showPicker, setShowPicker] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasChanges =
    name.trim() !== profile?.full_name || emoji !== profile?.avatar_emoji

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('he-IL', {
        year: 'numeric',
        month: 'long',
      })
    : ''

  async function handleSave() {
    if (!profile) return
    setSaving(true)
    setError(null)
    const { error: dbError } = await supabase
      .from('profiles')
      .update({ full_name: name.trim(), avatar_emoji: emoji })
      .eq('id', profile.id)
    setSaving(false)
    if (dbError) {
      setError('שמירה נכשלה, נסה שוב')
    } else {
      await refreshProfile()
      setSaved(true)
      setTimeout(() => setSaved(false), 2200)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto" dir="rtl">
      <div className="h-16" />

      <div className="px-4 pb-28 max-w-sm mx-auto">

        {/* ---- Hero avatar ---- */}
        <div className="flex flex-col items-center pt-10 pb-8">
          <button
            onClick={() => setShowPicker(true)}
            className="relative group focus:outline-none"
            aria-label="שנה אימוגי"
          >
            {/* Glow ring */}
            <div className="absolute inset-0 rounded-full bg-primary-200 blur-xl opacity-60 scale-110 group-hover:opacity-90 transition-opacity duration-300" />

            {/* Avatar circle */}
            <div className="relative w-28 h-28 rounded-full bg-white shadow-xl flex items-center justify-center text-[4rem] leading-none border-4 border-white ring-4 ring-primary-200 group-hover:ring-primary-400 transition-all duration-200 group-active:scale-95">
              <span style={{ lineHeight: 1 }}>{emoji}</span>
            </div>

            {/* Edit badge */}
            <div className="absolute -bottom-1 -left-1 w-9 h-9 bg-primary-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white group-hover:bg-primary-600 transition-colors duration-150">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
              </svg>
            </div>
          </button>

          <p className="mt-4 text-xs text-textMuted font-medium">לחץ לשינוי אימוגי</p>
        </div>

        {/* ---- Name field ---- */}
        <div className="card p-5 mb-4 shadow-sm">
          <label className="block text-[11px] font-bold text-textMuted mb-2 tracking-widest uppercase">
            שם מלא
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="input-field w-full text-lg font-semibold text-right"
            placeholder="הכנס את שמך"
            maxLength={40}
            dir="rtl"
          />
        </div>

        {/* ---- Info card ---- */}
        <div className="card p-5 mb-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[11px] font-bold text-textMuted tracking-widest uppercase shrink-0">אימייל</span>
            <span className="text-sm font-medium text-textBase truncate text-left" dir="ltr">{user?.email}</span>
          </div>

          <div className="border-t border-border" />

          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-textMuted tracking-widest uppercase">תפקיד</span>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full ${
                profile?.role === 'admin'
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-approved-light text-approved-text'
              }`}
            >
              {profile?.role === 'admin' ? 'מנהל' : 'חבר'}
            </span>
          </div>

          <div className="border-t border-border" />

          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-textMuted tracking-widest uppercase">חבר מאז</span>
            <span className="text-sm font-medium text-textBase">{memberSince}</span>
          </div>
        </div>

        {/* ---- Error ---- */}
        {error && (
          <p className="text-center text-sm text-rejected-DEFAULT mb-3 animate-fade-in">{error}</p>
        )}

        {/* ---- Save button ---- */}
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving || name.trim().length === 0}
          className={`w-full py-3.5 rounded-2xl text-base font-bold text-white transition-all duration-300 shadow-md
            ${saved
              ? 'bg-approved-DEFAULT shadow-none scale-95'
              : 'bg-gradient-to-l from-primary-DEFAULT to-primary-400 hover:opacity-90 active:scale-95'
            }
            disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:scale-100`}
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              שומר...
            </span>
          ) : saved ? (
            <span className="flex items-center justify-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              נשמר!
            </span>
          ) : (
            'שמור שינויים'
          )}
        </button>
      </div>

      {/* ---- Emoji picker bottom-sheet ---- */}
      {showPicker && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          onClick={() => setShowPicker(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Sheet */}
          <div
            className="relative bg-surface rounded-t-3xl pt-5 pb-12 px-6 animate-slide-up max-h-[70vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5 shrink-0" />

            <p className="text-center text-sm font-bold text-textMuted mb-5 tracking-wide shrink-0">
              בחר את האימוגי שלך
            </p>

            <div className="overflow-y-auto">
              <div className="grid grid-cols-5 gap-3 max-w-xs mx-auto">
                {EMOJI_OPTIONS.map(e => (
                  <button
                    key={e}
                    onClick={() => { setEmoji(e); setShowPicker(false) }}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl transition-all duration-150 active:scale-90
                      ${emoji === e
                        ? 'bg-primary-100 ring-2 ring-primary-400 scale-110 shadow-sm'
                        : 'bg-background hover:bg-primary-50'
                      }`}
                    style={{ lineHeight: 1 }}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
