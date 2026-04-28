import { useState, FormEvent } from 'react'
import { useAuth } from '../../contexts/AuthContext'

const EMOJIS = ['😊', '😎', '🤩', '😄', '🥳', '👦', '👧', '👨', '👩', '🧑', '👴', '👵', '🐱', '🦊', '🐼']

export default function AuthPage() {
  const { signIn, signUp } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [avatarEmoji, setAvatarEmoji] = useState('😊')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    if (isLogin) {
      const { error } = await signIn(email, password)
      if (error) setError('אימייל או סיסמה שגויים')
    } else {
      if (!fullName.trim()) { setError('יש להזין שם מלא'); setLoading(false); return }
      if (password.length < 6) { setError('הסיסמה חייבת להיות לפחות 6 תווים'); setLoading(false); return }
      const { error } = await signUp(email, password, fullName.trim(), avatarEmoji)
      if (error) {
        setError(error.message.includes('already registered') ? 'כתובת אימייל זו כבר רשומה' : 'שגיאה בהרשמה, נסה שוב')
      } else {
        setSuccess('ברוך הבא! ההרשמה הושלמה בהצלחה 🎉')
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      {/* Hero area */}
      <div className="relative flex-shrink-0 pt-16 pb-10 px-6 flex flex-col items-center text-center overflow-hidden">
        {/* Background blobs */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-primary-200 rounded-full blur-3xl opacity-40 pointer-events-none" />
        <div className="absolute top-8 -left-20 w-56 h-56 bg-approved-light rounded-full blur-3xl opacity-50 pointer-events-none" />
        <div className="absolute bottom-0 right-1/3 w-40 h-40 bg-pending-light rounded-full blur-2xl opacity-40 pointer-events-none" />

        <div className="relative animate-bounce-in">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-3xl flex items-center justify-center shadow-primary mb-4 mx-auto">
            <span className="text-4xl">🚗</span>
          </div>
        </div>

        <h1 className="text-3xl font-extrabold text-textBase tracking-tight leading-tight animate-fade-in">
          משפחה על גלגלים
        </h1>
        <p className="text-textMuted text-sm mt-2 font-medium animate-fade-in" style={{ animationDelay: '0.05s' }}>
          תיאום שימוש ברכב המשפחתי
        </p>
      </div>

      {/* Card */}
      <div className="flex-1 bg-white rounded-t-[2rem] px-5 pt-6 pb-8 shadow-[0_-4px_40px_rgba(26,23,20,0.08)] animate-slide-up overflow-y-auto">
        {/* Tab switcher */}
        <div className="flex bg-background rounded-2xl p-1 mb-6">
          <button
            onClick={() => { setIsLogin(true); setError('') }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200
              ${isLogin ? 'bg-white shadow-card text-primary-600' : 'text-textMuted'}`}
          >
            התחברות
          </button>
          <button
            onClick={() => { setIsLogin(false); setError('') }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200
              ${!isLogin ? 'bg-white shadow-card text-primary-600' : 'text-textMuted'}`}
          >
            הרשמה
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-semibold text-textBase mb-1.5">שם מלא</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="הזן את שמך המלא"
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-textBase mb-2">בחר אימוג׳י</label>
                <div className="grid grid-cols-5 gap-2">
                  {EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setAvatarEmoji(emoji)}
                      className={`text-2xl p-2.5 rounded-2xl transition-all duration-150 font-emoji
                        ${avatarEmoji === emoji
                          ? 'bg-primary-100 scale-110 shadow-primary-sm ring-2 ring-primary-300'
                          : 'hover:bg-background active:scale-95'}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-textMuted mt-2 text-center">נבחר: {avatarEmoji}</p>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-semibold text-textBase mb-1.5">אימייל</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="input-field"
              required
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-textBase mb-1.5">סיסמה</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={isLogin ? '••••••••' : 'לפחות 6 תווים'}
              className="input-field"
              required
              dir="ltr"
            />
          </div>

          {error && (
            <div className="bg-rejected-light border border-rejected-border text-rejected-text text-sm px-4 py-3 rounded-2xl flex items-center gap-2 animate-scale-in">
              <span className="text-base flex-shrink-0">⚠️</span>
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="bg-approved-light border border-approved-border text-approved-text text-sm px-4 py-3 rounded-2xl flex items-center gap-2 animate-scale-in">
              <span className="text-base flex-shrink-0">✅</span>
              <span>{success}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary text-white py-4 rounded-2xl font-bold text-base disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />
                <span>רגע...</span>
              </span>
            ) : isLogin ? 'התחבר' : 'צור חשבון'}
          </button>
        </form>

        {!isLogin && (
          <p className="text-xs text-textMuted text-center mt-4 leading-relaxed">
            המשתמש הראשון שנרשם יהפוך אוטומטית למנהל ⭐
          </p>
        )}
      </div>
    </div>
  )
}
