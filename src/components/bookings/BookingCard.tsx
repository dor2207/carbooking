import { Booking } from '../../types'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'

interface Props {
  booking: Booking
  showActions?: boolean
  onDelete?: (id: string) => void
}

const STATUS_CONFIG = {
  pending: {
    label:      'ממתין לאישור',
    pillClass:  'bg-pending-light text-pending-text border border-pending-border',
    dotClass:   'bg-pending-DEFAULT',
    barClass:   'bg-pending-DEFAULT',
  },
  approved: {
    label:      'מאושר',
    pillClass:  'bg-approved-light text-approved-text border border-approved-border',
    dotClass:   'bg-approved-DEFAULT',
    barClass:   'bg-approved-DEFAULT',
  },
  rejected: {
    label:      'נדחה',
    pillClass:  'bg-rejected-light text-rejected-text border border-rejected-border',
    dotClass:   'bg-rejected-DEFAULT',
    barClass:   'bg-rejected-DEFAULT',
  },
}

export default function BookingCard({ booking, onDelete }: Props) {
  const cfg = STATUS_CONFIG[booking.status]
  const start = new Date(booking.start_time)
  const end = new Date(booking.end_time)

  return (
    <div className="bg-white rounded-3xl shadow-card overflow-hidden animate-fade-in">
      <div className="flex">
        {/* Left status bar */}
        <div className={`w-1 flex-shrink-0 ${cfg.barClass}`} />

        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {/* User info */}
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-lg leading-none">{booking.profiles?.avatar_emoji ?? '🙂'}</span>
                <span className="text-xs text-textMuted font-medium truncate">{booking.profiles?.full_name ?? 'משתמש'}</span>
              </div>

              {/* Title */}
              <h3 className="font-bold text-textBase text-sm leading-snug">{booking.title}</h3>

              {/* Description */}
              {booking.description && (
                <p className="text-xs text-textMuted mt-0.5 leading-relaxed">{booking.description}</p>
              )}

              {/* Time */}
              <div className="flex items-center gap-1.5 mt-2.5">
                <span className="w-5 h-5 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7C6FF7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                </span>
                <span className="text-xs font-semibold text-textBase">
                  {format(start, 'HH:mm', { locale: he })} – {format(end, 'HH:mm', { locale: he })}
                </span>
                {start.toDateString() !== end.toDateString() && (
                  <span className="text-xs text-textMuted">({format(end, 'dd/MM', { locale: he })})</span>
                )}
              </div>

              {/* Admin note */}
              {booking.admin_note && (
                <div className="mt-2.5 bg-background rounded-xl px-3 py-2 text-xs text-textMuted border border-border">
                  <span className="font-semibold text-textBase">הערת מנהל: </span>
                  {booking.admin_note}
                </div>
              )}
            </div>

            {/* Status + actions */}
            <div className="flex flex-col items-end gap-2.5 shrink-0">
              <span className={`status-pill ${cfg.pillClass}`}>
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dotClass}`} />
                {cfg.label}
              </span>
              {onDelete && booking.status === 'pending' && (
                <button
                  onClick={() => onDelete(booking.id)}
                  className="text-[11px] text-textMuted hover:text-rejected-DEFAULT transition-colors font-medium"
                >
                  מחק
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
