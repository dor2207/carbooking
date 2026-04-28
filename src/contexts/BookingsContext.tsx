import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Booking } from '../types'
import { useAuth } from './AuthContext'

interface BookingsContextType {
  bookings: Booking[]
  loading: boolean
  pendingCount: number
  createBooking: (data: Omit<Booking, 'id' | 'user_id' | 'status' | 'created_at' | 'updated_at' | 'profiles'>) => Promise<{ error: Error | null }>
  approveBooking: (id: string, note?: string) => Promise<{ error: Error | null }>
  rejectBooking: (id: string, note?: string) => Promise<{ error: Error | null }>
  deleteBooking: (id: string) => Promise<{ error: Error | null }>
  refetch: () => Promise<void>
}

const BookingsContext = createContext<BookingsContextType | undefined>(undefined)

export function BookingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('bookings')
      .select('*, profiles(id, full_name, role, avatar_emoji)')
      .order('start_time', { ascending: true })
    if (!error && data) setBookings(data as Booking[])
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!user) {
      setBookings([])
      setLoading(false)
      return
    }
    fetchBookings()

    const channel = supabase
      .channel('bookings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchBookings()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user, fetchBookings])

  const pendingCount = bookings.filter(b => b.status === 'pending').length

  async function createBooking(data: Omit<Booking, 'id' | 'user_id' | 'status' | 'created_at' | 'updated_at' | 'profiles'>) {
    if (!user) return { error: new Error('לא מחובר') }
    const { error } = await supabase.from('bookings').insert({
      ...data,
      user_id: user.id,
      status: 'pending',
    })
    return { error }
  }

  async function approveBooking(id: string, note?: string) {
    const toApprove = bookings.find(b => b.id === id)
    if (toApprove) {
      const hasOverlap = bookings.some(b => {
        if (b.id === id || b.status !== 'approved') return false
        return new Date(toApprove.start_time) < new Date(b.end_time) &&
               new Date(toApprove.end_time) > new Date(b.start_time)
      })
      if (hasOverlap) {
        return { error: new Error('קיימת חפיפה עם הזמנה מאושרת אחרת — לא ניתן לאשר') }
      }
    }
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'approved', admin_note: note ?? null, updated_at: new Date().toISOString() })
      .eq('id', id)
    return { error }
  }

  async function rejectBooking(id: string, note?: string) {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'rejected', admin_note: note ?? null, updated_at: new Date().toISOString() })
      .eq('id', id)
    return { error }
  }

  async function deleteBooking(id: string) {
    const { error } = await supabase.from('bookings').delete().eq('id', id)
    return { error }
  }

  return (
    <BookingsContext.Provider value={{ bookings, loading, pendingCount, createBooking, approveBooking, rejectBooking, deleteBooking, refetch: fetchBookings }}>
      {children}
    </BookingsContext.Provider>
  )
}

export function useBookings() {
  const ctx = useContext(BookingsContext)
  if (!ctx) throw new Error('useBookings must be used within BookingsProvider')
  return ctx
}
