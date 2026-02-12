-- Create table for tracking detailed question sessions
create table if not exists question_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  subject_id text not null,
  topic_id text not null,
  questions_count int not null,
  correct_count int not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table question_sessions enable row level security;

-- Create policy to allow users to insert their own data
create policy "Users can insert their own question sessions"
  on question_sessions for insert
  with check (auth.uid() = user_id);

-- Create policy to allow users to view their own data
create policy "Users can view their own question sessions"
  on question_sessions for select
  using (auth.uid() = user_id);

-- Create policy to allow users to delete their own data (optional, for cleanup)
create policy "Users can delete their own question sessions"
  on question_sessions for delete
  using (auth.uid() = user_id);
