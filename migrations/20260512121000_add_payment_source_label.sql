alter table expenses
  add column if not exists payment_source_label text;

