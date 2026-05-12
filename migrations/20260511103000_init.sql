create table if not exists users (
  id text primary key,
  email text unique,
  name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists payment_sources (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  type text not null,
  name text not null,
  issuer text,
  last4 text,
  credit_limit_minor bigint,
  billing_cycle_day int,
  due_day int,
  created_at timestamptz not null default now()
);

create table if not exists groups (
  id text primary key,
  owner_user_id text not null references users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists group_members (
  id text primary key,
  group_id text not null references groups(id) on delete cascade,
  user_id text references users(id) on delete set null,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists expenses (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  occurred_at timestamptz not null,
  amount_minor bigint not null,
  currency text not null,
  merchant_name text not null,
  category_name text not null,
  payment_source_id text references payment_sources(id) on delete set null,
  kind text not null,
  group_id text references groups(id) on delete set null,
  my_share_minor bigint,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists expenses_user_occurred_idx on expenses(user_id, occurred_at desc);
create index if not exists expenses_user_kind_idx on expenses(user_id, kind);
create index if not exists expenses_user_group_idx on expenses(user_id, group_id);

create table if not exists expense_splits (
  id text primary key,
  expense_id text not null references expenses(id) on delete cascade,
  member_id text references group_members(id) on delete set null,
  participant_label text not null,
  share_minor bigint not null,
  created_at timestamptz not null default now()
);

create index if not exists expense_splits_expense_idx on expense_splits(expense_id);

