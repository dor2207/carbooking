-- ============================================================
-- SUPABASE SETUP — הדבק בקובץ SQL בלוח הבקרה של Supabase
-- ============================================================

-- 1. יצירת טבלת profiles
create table if not exists profiles (
  id uuid references auth.users primary key,
  full_name text not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  avatar_emoji text default '🙂',
  created_at timestamptz default now()
);

-- 2. יצירת טבלת bookings
create table if not exists bookings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) not null,
  title text not null,
  description text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. הפעלת Row Level Security
alter table profiles enable row level security;
alter table bookings enable row level security;

-- 4. מדיניות RLS - profiles
-- כל מחובר יכול לקרוא פרופילים
create policy "profiles_read" on profiles
  for select using (auth.role() = 'authenticated');

-- משתמש יכול לעדכן רק את הפרופיל שלו
create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);

-- insert רק בעת יצירת חשבון (מכוסה על ידי service role בקוד)
create policy "profiles_insert_own" on profiles
  for insert with check (auth.uid() = id);

-- 5. מדיניות RLS - bookings
-- כל מחובר יכול לקרוא את כל ה-bookings (כדי שכולם יראו את היומן)
create policy "bookings_read_all" on bookings
  for select using (auth.role() = 'authenticated');

-- משתמש יכול ליצור booking רק עבור עצמו
create policy "bookings_insert_own" on bookings
  for insert with check (auth.uid() = user_id);

-- רק admin יכול לעדכן status ו-admin_note
create policy "bookings_update_admin" on bookings
  for update using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- משתמש יכול למחוק רק booking שלו שעדיין ב-pending
create policy "bookings_delete_own_pending" on bookings
  for delete using (
    auth.uid() = user_id and status = 'pending'
  );

-- 6. הפעלת Realtime על טבלת bookings
-- לך ל: Database → Replication → Enable Replication for table "bookings"
-- או הרץ:
alter publication supabase_realtime add table bookings;

-- ============================================================
-- סיום ההגדרות
-- ============================================================
