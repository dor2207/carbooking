export interface Profile {
  id: string
  full_name: string
  role: 'admin' | 'member'
  avatar_emoji: string
  created_at: string
}

export interface Booking {
  id: string
  user_id: string
  title: string
  description?: string
  start_time: string
  end_time: string
  status: 'pending' | 'approved' | 'rejected'
  admin_note?: string
  created_at: string
  updated_at: string
  profiles?: Profile
}

export type ActivePage = 'calendar' | 'new-booking' | 'my-bookings' | 'admin' | 'profile'
