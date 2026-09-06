-- ============================================
-- TeknikSchool Database Schema
-- ============================================

-- Profiles (extends Supabase auth.users with our custom fields)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  role text not null check (role in ('admin','teacher','student')),
  subject text,
  avatar_url text,
  join_date timestamptz default now()
);

-- Courses
create table public.courses (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  teacher_id uuid references public.profiles(id) on delete cascade,
  subject text,
  price numeric default 0,
  duration_days int default 30,
  description text,
  color text default '#7C6FFF',
  cover_image_url text,
  live boolean default false,
  created_at timestamptz default now()
);

-- Enrollments (many-to-many: students <-> courses)
create table public.enrollments (
  id uuid default gen_random_uuid() primary key,
  course_id uuid references public.courses(id) on delete cascade,
  student_id uuid references public.profiles(id) on delete cascade,
  enrolled_at timestamptz default now(),
  unique(course_id, student_id)
);

-- Chapters
create table public.chapters (
  id uuid default gen_random_uuid() primary key,
  course_id uuid references public.courses(id) on delete cascade,
  number int not null,
  title text not null,
  created_at timestamptz default now()
);

-- Chapter content blocks (text/video/audio)
create table public.chapter_content (
  id uuid default gen_random_uuid() primary key,
  chapter_id uuid references public.chapters(id) on delete cascade,
  type text check (type in ('text','video','audio')),
  label text,
  body text,
  file_url text,
  sort_order int default 0
);

-- Chapter completion tracking
create table public.chapter_progress (
  chapter_id uuid references public.chapters(id) on delete cascade,
  student_id uuid references public.profiles(id) on delete cascade,
  completed_at timestamptz default now(),
  primary key (chapter_id, student_id)
);

-- Community chat messages (per course)
create table public.community_messages (
  id uuid default gen_random_uuid() primary key,
  course_id uuid references public.courses(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  text text not null,
  reply_to uuid references public.community_messages(id),
  pinned boolean default false,
  created_at timestamptz default now()
);

-- Message reactions
create table public.message_reactions (
  message_id uuid references public.community_messages(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  emoji text not null,
  primary key (message_id, user_id, emoji)
);

-- Homeworks
create table public.homeworks (
  id uuid default gen_random_uuid() primary key,
  course_id uuid references public.courses(id) on delete cascade,
  title text not null,
  due_date date,
  created_at timestamptz default now()
);

create table public.homework_submissions (
  id uuid default gen_random_uuid() primary key,
  homework_id uuid references public.homeworks(id) on delete cascade,
  student_id uuid references public.profiles(id) on delete cascade,
  text text,
  submitted_at timestamptz default now(),
  unique(homework_id, student_id)
);

-- Quizzes (regular + final exam flag)
create table public.quizzes (
  id uuid default gen_random_uuid() primary key,
  course_id uuid references public.courses(id) on delete cascade,
  title text not null,
  is_final boolean default false,
  created_at timestamptz default now()
);

create table public.quiz_questions (
  id uuid default gen_random_uuid() primary key,
  quiz_id uuid references public.quizzes(id) on delete cascade,
  question text not null,
  options jsonb not null,
  correct_answer int not null,
  sort_order int default 0
);

create table public.quiz_submissions (
  id uuid default gen_random_uuid() primary key,
  quiz_id uuid references public.quizzes(id) on delete cascade,
  student_id uuid references public.profiles(id) on delete cascade,
  score int not null,
  total int not null,
  submitted_at timestamptz default now()
);

-- Certificates
create table public.certificates (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.profiles(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  course_title text not null,
  hours_spent int,
  issued_at timestamptz default now()
);

-- Course documents (free/paid downloads)
create table public.documents (
  id uuid default gen_random_uuid() primary key,
  course_id uuid references public.courses(id) on delete cascade,
  title text not null,
  file_url text not null,
  file_name text,
  price numeric default 0,
  uploaded_at timestamptz default now()
);

create table public.document_purchases (
  document_id uuid references public.documents(id) on delete cascade,
  student_id uuid references public.profiles(id) on delete cascade,
  purchased_at timestamptz default now(),
  primary key (document_id, student_id)
);

-- Live sessions (for video call rooms)
create table public.live_sessions (
  id uuid default gen_random_uuid() primary key,
  course_id uuid references public.courses(id) on delete cascade,
  room_name text not null,
  started_at timestamptz default now(),
  ended_at timestamptz
);

-- ============================================
-- Row Level Security (RLS) — lock down access
-- ============================================
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.enrollments enable row level security;
alter table public.chapters enable row level security;
alter table public.chapter_content enable row level security;
alter table public.chapter_progress enable row level security;
alter table public.community_messages enable row level security;
alter table public.message_reactions enable row level security;
alter table public.homeworks enable row level security;
alter table public.homework_submissions enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_submissions enable row level security;
alter table public.certificates enable row level security;
alter table public.documents enable row level security;
alter table public.document_purchases enable row level security;
alter table public.live_sessions enable row level security;

-- Basic policies: everyone logged in can read most things; writes are scoped
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

create policy "Courses are viewable by everyone" on public.courses for select using (true);
create policy "Teachers can insert own courses" on public.courses for insert with check (auth.uid() = teacher_id);
create policy "Teachers can update own courses" on public.courses for update using (auth.uid() = teacher_id);
create policy "Teachers can delete own courses" on public.courses for delete using (auth.uid() = teacher_id);

create policy "Enrollments viewable by everyone" on public.enrollments for select using (true);
create policy "Teachers manage enrollments" on public.enrollments for all using (
  exists (select 1 from public.courses where courses.id = course_id and courses.teacher_id = auth.uid())
);

create policy "Chapters viewable by everyone" on public.chapters for select using (true);
create policy "Teachers manage own chapters" on public.chapters for all using (
  exists (select 1 from public.courses where courses.id = course_id and courses.teacher_id = auth.uid())
);

create policy "Chapter content viewable by everyone" on public.chapter_content for select using (true);
create policy "Teachers manage own chapter content" on public.chapter_content for all using (
  exists (select 1 from public.chapters join public.courses on courses.id = chapters.course_id
          where chapters.id = chapter_id and courses.teacher_id = auth.uid())
);

create policy "Progress viewable by everyone" on public.chapter_progress for select using (true);
create policy "Students mark own progress" on public.chapter_progress for insert with check (auth.uid() = student_id);

create policy "Messages viewable by everyone" on public.community_messages for select using (true);
create policy "Logged in users can post messages" on public.community_messages for insert with check (auth.uid() = user_id);
create policy "Users manage own messages" on public.community_messages for update using (auth.uid() = user_id);
create policy "Users delete own messages" on public.community_messages for delete using (auth.uid() = user_id);

create policy "Reactions viewable by everyone" on public.message_reactions for select using (true);
create policy "Users manage own reactions" on public.message_reactions for all using (auth.uid() = user_id);

create policy "Homeworks viewable by everyone" on public.homeworks for select using (true);
create policy "Teachers manage own homeworks" on public.homeworks for all using (
  exists (select 1 from public.courses where courses.id = course_id and courses.teacher_id = auth.uid())
);

create policy "Submissions viewable by everyone" on public.homework_submissions for select using (true);
create policy "Students manage own submissions" on public.homework_submissions for all using (auth.uid() = student_id);

create policy "Quizzes viewable by everyone" on public.quizzes for select using (true);
create policy "Teachers manage own quizzes" on public.quizzes for all using (
  exists (select 1 from public.courses where courses.id = course_id and courses.teacher_id = auth.uid())
);

create policy "Questions viewable by everyone" on public.quiz_questions for select using (true);
create policy "Teachers manage own questions" on public.quiz_questions for all using (
  exists (select 1 from public.quizzes join public.courses on courses.id = quizzes.course_id
          where quizzes.id = quiz_id and courses.teacher_id = auth.uid())
);

create policy "Quiz submissions viewable by everyone" on public.quiz_submissions for select using (true);
create policy "Students manage own quiz submissions" on public.quiz_submissions for all using (auth.uid() = student_id);

create policy "Certificates viewable by everyone" on public.certificates for select using (true);
create policy "System issues certificates" on public.certificates for insert with check (true);

create policy "Documents viewable by everyone" on public.documents for select using (true);
create policy "Teachers manage own documents" on public.documents for all using (
  exists (select 1 from public.courses where courses.id = course_id and courses.teacher_id = auth.uid())
);

create policy "Purchases viewable by everyone" on public.document_purchases for select using (true);
create policy "Students manage own purchases" on public.document_purchases for insert with check (auth.uid() = student_id);

create policy "Live sessions viewable by everyone" on public.live_sessions for select using (true);
create policy "Teachers manage own live sessions" on public.live_sessions for all using (
  exists (select 1 from public.courses where courses.id = course_id and courses.teacher_id = auth.uid())
);

-- Auto-create a profile row when someone signs up
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', 'New User'), coalesce(new.raw_user_meta_data->>'role', 'student'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
