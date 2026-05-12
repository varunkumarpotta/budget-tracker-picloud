-- Insert demo user so FK constraints work for demo mode
insert into users (id, email, name)
values ('demo', 'demo@ledgerly.app', 'Demo User')
on conflict (id) do nothing;

-- Add password_hash column to users for email/password auth
alter table users add column if not exists password_hash text;

-- Categories table (user-specific)
create table if not exists categories (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  name text not null,
  icon text,
  created_at timestamptz not null default now(),
  unique(user_id, name)
);

-- Credit cards table
create table if not exists cards (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  name text not null,
  credit_limit_minor bigint not null default 0,
  billing_cycle text not null default '1st–31st',
  due_day int not null default 1,
  outstanding_minor bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Budget alerts table
create table if not exists alerts (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  name text not null,
  category_name text,
  threshold_minor bigint not null,
  period text not null default 'monthly',
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
