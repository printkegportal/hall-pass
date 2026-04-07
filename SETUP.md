# Hall Pass Tracker — Setup Guide

## Step 1: Create a Supabase account
1. Go to https://supabase.com and sign up (free)
2. Click "New Project" — name it anything (e.g. "hall-pass")
3. Set a database password and save it somewhere safe
4. Wait ~2 minutes for the project to provision

## Step 2: Create the database tables
In your Supabase project, click SQL Editor in the left sidebar, paste the following, and click Run:

```sql
create table students (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamptz default now()
);

create table classes (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamptz default now()
);

create table class_students (
  id uuid default gen_random_uuid() primary key,
  class_id uuid references classes(id) on delete cascade,
  student_id uuid references students(id) on delete cascade,
  unique(class_id, student_id)
);

create table passes (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references students(id) on delete set null,
  student_name text not null,
  class_id uuid references classes(id) on delete set null,
  destination text not null,
  time_out timestamptz not null,
  time_in timestamptz,
  duration_seconds integer,
  flagged boolean default false,
  created_at timestamptz default now()
);

alter table students enable row level security;
alter table classes enable row level security;
alter table class_students enable row level security;
alter table passes enable row level security;

create policy "Allow all" on students for all using (true) with check (true);
create policy "Allow all" on classes for all using (true) with check (true);
create policy "Allow all" on class_students for all using (true) with check (true);
create policy "Allow all" on passes for all using (true) with check (true);
```

## Step 3: Get your credentials
1. Go to Settings -> API in Supabase
2. Copy your Project URL (https://xxxx.supabase.co)
3. Copy your anon/public key

## Step 4: Deploy to Vercel (free)
1. Push this folder to a GitHub repo
2. Sign up at vercel.com with GitHub
3. Import the repo — Vercel auto-detects Vite — click Deploy
4. You get a permanent URL

## Step 5: First login
Open the URL, paste your Supabase credentials, click Connect.
Credentials save in the browser — only need to do this once per device.

---

## Teacher Workflow

FIRST TIME SETUP:
1. Roster tab — add all students by name
2. Classes tab — create each period (e.g. "Period 1 — English")
3. Classes tab — expand each class and check which students belong to it

DAILY USE:
1. Select the current class from the header dropdown
2. Dashboard — pick student + destination, click Issue Pass (prints automatically)
3. Click RETURNED when the student comes back
4. Students out 10+ minutes turn red automatically

REVIEWING RECORDS:
- History tab — filter by class, student, or flagged (10+ min) trips only
