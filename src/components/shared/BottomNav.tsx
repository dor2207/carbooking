import { ActivePage } from '../../types'
import { useAuth } from '../../contexts/AuthContext'
import { useBookings } from '../../contexts/BookingsContext'

interface Props {
  activePage: ActivePage
  onNavigate: (page: ActivePage) => void
}

const NAV_ICONS: Record<string, { active: string; inactive: string }> = {
  calendar: {
    active:   'M8 2v3M16 2v3M3.5 9.5h17M4 6h16a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z',
    inactive: 'M8 2v3M16 2v3M3.5 9.5h17M4 6h16a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z',
  },
  'new-booking': {
    active:   'M12 5v14M5 12h14',
    inactive: 'M12 5v14M5 12h14',
  },
  'my-bookings': {
    active:   'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9 2 2 4-4',
    inactive: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9 2 2 4-4',
  },
  admin: {
    active:   'M11.48 3.5a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5z',
    inactive: 'M11.48 3.5a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5z',
  },
  profile: {
    active:   'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    inactive: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  },
}

export default function BottomNav({ activePage, onNavigate }: Props) {
  const { profile } = useAuth()
  const { pendingCount } = useBookings()

  const items = [
    { id: 'calendar'     as ActivePage, label: 'יומן' },
    { id: 'new-booking'  as ActivePage, label: 'הזמנה' },
    { id: 'my-bookings'  as ActivePage, label: 'שלי' },
    ...(profile?.role === 'admin' ? [{ id: 'admin' as ActivePage, label: 'ניהול' }] : []),
    { id: 'profile'      as ActivePage, label: 'פרופיל' },
  ]

  return (
    <nav className="fixed bottom-0 right-0 left-0 glass-nav safe-area-pb z-50">
      <div className="flex items-stretch h-16">
        {items.map((item) => {
          const isActive = activePage === item.id
          const iconPath = NAV_ICONS[item.id]

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-200 relative
                ${isActive ? 'text-primary-500' : 'text-textMuted'}`}
            >
              {/* Active background pill */}
              {isActive && (
                <span className="absolute inset-x-3 top-1.5 bottom-1.5 bg-primary-50 rounded-2xl -z-0" />
              )}

              <span className="relative z-10">
                <svg
                  width="22" height="22"
                  viewBox="0 0 24 24"
                  fill={isActive && item.id !== 'calendar' && item.id !== 'new-booking' && item.id !== 'my-bookings' ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth={isActive ? '2.2' : '1.8'}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={iconPath?.active ?? ''} />
                </svg>
              </span>

              <span className={`relative z-10 text-[10px] font-semibold tracking-wide ${isActive ? 'text-primary-600' : 'text-textMuted'}`}>
                {item.label}
              </span>

              {/* Badge */}
              {item.id === 'admin' && pendingCount > 0 && (
                <span className="absolute top-1 right-1/4 bg-rejected-DEFAULT text-white text-[9px] font-bold rounded-full min-w-[17px] h-[17px] flex items-center justify-center px-1 shadow-sm">
                  {pendingCount}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
