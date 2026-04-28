import { useState } from 'react'
import { useAuth } from './contexts/AuthContext'
import { ActivePage } from './types'
import AuthPage from './components/auth/AuthPage'
import WeeklyCalendar from './components/calendar/WeeklyCalendar'
import NewBookingPage from './components/bookings/NewBookingPage'
import MyBookingsPage from './components/bookings/MyBookingsPage'
import AdminPage from './components/admin/AdminPage'
import ProfilePage from './components/profile/ProfilePage'
import BottomNav from './components/shared/BottomNav'
import LoadingSpinner from './components/shared/LoadingSpinner'

export default function App() {
  const { user, profile, loading, signOut } = useAuth()
  const [activePage, setActivePage] = useState<ActivePage>('calendar')

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 bg-background">
        <div className="relative">
          <div className="text-6xl animate-bounce-in">🚗</div>
          <div className="absolute -inset-4 bg-primary-100 rounded-full blur-xl opacity-60 -z-10" />
        </div>
        <LoadingSpinner size="md" />
        <p className="text-textMuted text-sm font-medium">טוען...</p>
      </div>
    )
  }

  if (!user || !profile) {
    return <AuthPage />
  }

  function navigate(page: ActivePage) {
    if (page === 'admin' && profile?.role !== 'admin') return
    setActivePage(page)
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Top bar */}
      <div className="absolute top-0 right-0 left-0 z-30 flex items-center justify-between px-4 pt-3 pointer-events-none">
        <div className="pointer-events-auto">
          <button
            onClick={signOut}
            className="text-xs text-textMuted hover:text-rejected-DEFAULT transition-colors font-medium px-2 py-1 rounded-lg hover:bg-rejected-light"
          >
            יציאה
          </button>
        </div>
        <button
          onClick={() => navigate('profile')}
          className="pointer-events-auto flex items-center gap-2 glass rounded-full px-3 py-1.5 shadow-sm hover:bg-white/80 transition-colors duration-150 active:scale-95"
        >
          <span className="text-base leading-none">{profile.avatar_emoji}</span>
          <span className="text-xs font-semibold text-textBase">{profile.full_name}</span>
          {profile.role === 'admin' && (
            <span className="text-[10px] bg-primary-100 text-primary-600 font-bold px-1.5 py-0.5 rounded-full">מנהל</span>
          )}
        </button>
      </div>

      {/* Page content */}
      <div className="flex-1 flex flex-col overflow-hidden page-enter">
        {activePage === 'calendar'     && <WeeklyCalendar onNavigate={navigate} />}
        {activePage === 'new-booking'  && <NewBookingPage onNavigate={navigate} />}
        {activePage === 'my-bookings'  && <MyBookingsPage onNavigate={navigate} />}
        {activePage === 'admin' && profile.role === 'admin' && <AdminPage />}
        {activePage === 'profile'      && <ProfilePage />}
      </div>

      <BottomNav activePage={activePage} onNavigate={navigate} />
    </div>
  )
}
