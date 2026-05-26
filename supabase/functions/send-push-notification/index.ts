import { createClient } from 'npm:@supabase/supabase-js@2'
import webPush from 'npm:web-push'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_EMAIL = Deno.env.get('VAPID_EMAIL') ?? 'admin@family-car.app'

webPush.setVapidDetails(`mailto:${VAPID_EMAIL}`, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { event, booking_id } = await req.json() as {
      event: 'new_booking' | 'approved' | 'rejected'
      booking_id: string
    }

    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('id, title, user_id, profiles(full_name)')
      .eq('id', booking_id)
      .single()

    if (!booking) {
      return new Response(JSON.stringify({ error: 'booking not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let targetUserIds: string[]
    let notification: { title: string; body: string }

    if (event === 'new_booking') {
      const { data: admins } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('role', 'admin')
      targetUserIds = (admins ?? []).map((a: { id: string }) => a.id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const requesterName = (booking.profiles as any)?.full_name ?? 'מישהו'
      notification = {
        title: 'בקשה חדשה לרכב 🚗',
        body: `${requesterName} ביקש/ה: ${booking.title}`,
      }
    } else {
      targetUserIds = [booking.user_id]
      notification = {
        title: event === 'approved' ? 'הבקשה אושרה ✅' : 'הבקשה נדחתה ❌',
        body: `"${booking.title}" ${event === 'approved' ? 'אושרה בהצלחה' : 'נדחתה'}`,
      }
    }

    const { data: subs } = await supabaseAdmin
      .from('push_subscriptions')
      .select('id, subscription')
      .in('user_id', targetUserIds)

    if (!subs?.length) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const results = await Promise.allSettled(
      subs.map(({ subscription }) =>
        webPush.sendNotification(subscription, JSON.stringify(notification))
      )
    )

    // Remove expired/invalid subscriptions (HTTP 410 Gone)
    const expiredIds: string[] = []
    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        const err = result.reason as { statusCode?: number }
        if (err?.statusCode === 410) expiredIds.push(subs[i].id)
      }
    })
    if (expiredIds.length) {
      await supabaseAdmin.from('push_subscriptions').delete().in('id', expiredIds)
    }

    const sent = results.filter((r) => r.status === 'fulfilled').length
    return new Response(JSON.stringify({ sent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
