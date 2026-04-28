import { useBookings } from '../../contexts/BookingsContext'
import { useAuth } from '../../contexts/AuthContext'
import BookingCard from './BookingCard'
import LoadingSpinner from '../shared/LoadingSpinner'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import { ActivePage } from '../../types'

interface Props {
  onNavigate: (page: ActivePage) => void
}

const SECTION_CONFIG = {
  pending:  { label: 'ממתינות לאישור', dotClass: 'bg-pending-DEFAULT',  textClass: 'text-pending-text'  },
  approved: { label: 'מאושרות',         dotClass: 'bg-approved-DEFAULT', textClass: 'text-approved-text' },
  rejected: { label: 'נדחו',            dotClass: 'bg-rejected-DEFAULT', textClass: 'text-rejected-text' },
}

export default function MyBookingsPage({ onNavigate }: Props) {
  const { user, profile } = useAuth()
  const { bookings, loading, deleteBooking } = useBookings()

  const myBookings = bookings
    .filter(b => b.user_id === user?.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const pending  = myBookings.filter(b => b.status === 'pending')
  const approved = myBookings.filter(b => b.status === 'approved')
  const rejected = myBookings.filter(b => b.status === 'rejected')

  async function handleDelete(id: string) {
    if (confirm('למחוק את הבקשה?')) {
      await deleteBooking(id)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto scroll-container bg-background pb-28">
      {/* Header */}
      <div className="bg-white px-5 pt-14 pb-5 shadow-card">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
            {profile?.avatar_emoji ?? '🙂'}
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-textBase tracking-tight">הבקשות שלי</h1>
            <p className="text-sm text-textMuted font-medium">{profile?.full_name}</p>
          </div>
        </div>

        {/* Stats row */}
        {myBookings.length > 0 && (
          <div className="flex gap-2 mt-4">
            {pending.length > 0 && (
              <div className="flex-1 bg-pending-light rounded-2xl px-3 py-2 text-center">
                <p className="text-xl font-extrabold text-pending-text leading-none">{pending.length}</p>
                <p className="text-[10px] text-pending-text font-semibold mt-0.5">ממתינות</p>
              </div>
            )}
            {approved.length > 0 && (
              <div className="flex-1 bg-approved-light rounded-2xl px-3 py-2 text-center">
                <p className="text-xl font-extrabold text-approved-text leading-none">{approved.length}</p>
                <p className="text-[10px] text-approved-text font-semibold mt-0.5">מאושרות</p>
              </div>
            )}
            {rejected.length > 0 && (
              <div className="flex-1 bg-rejected-light rounded-2xl px-3 py-2 text-center">
                <p className="text-xl font-extrabold text-rejected-text leading-none">{rejected.length}</p>
                <p className="text-[10px] text-rejected-text font-semibold mt-0.5">נדחו</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-4">
        {myBookings.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <div className="w-24 h-24 bg-white rounded-3xl shadow-card flex items-center justify-center text-5xl mb-5">📋</div>
            <p className="text-textBase font-bold text-lg">עדיין אין לך בקשות</p>
            <p className="text-textMuted text-sm mt-1">הגש את הבקשה הראשונה שלך</p>
            <button
              onClick={() => onNavigate('new-booking')}
              className="mt-5 btn-primary text-white px-8 py-3 rounded-2xl text-sm font-bold"
            >
              הגש בקשה
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {([
              { list: pending,  key: 'pending'  as const },
              { list: approved, key: 'approved' as const },
              { list: rejected, key: 'rejected' as const },
            ]).map(({ list, key }) => list.length > 0 && (
              <section key={key}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${SECTION_CONFIG[key].dotClass}`} />
                  <h2 className={`text-sm font-bold ${SECTION_CONFIG[key].textClass}`}>
                    {SECTION_CONFIG[key].label} <span className="font-normal opacity-70">({list.length})</span>
                  </h2>
                </div>
                <div className="space-y-3">
                  {list.map(b => (
                    <div key={b.id}>
                      <p className="text-[11px] text-textMuted font-medium mb-1.5 mr-1">
                        {format(new Date(b.start_time), 'EEEE, d בMMMM', { locale: he })}
                      </p>
                      <BookingCard booking={b} onDelete={key === 'pending' ? handleDelete : undefined} />
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
