create table if not exists public.content_entries (
  section text not null,
  slug text not null,
  title text not null default '',
  text text not null default '',
  download_url text,
  purchase_url text,
  book_image_url text,
  text_align text,
  bold boolean default false,
  italic boolean default false,
  underline boolean default false,
  text_layout jsonb,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (section, slug)
);

create index if not exists content_entries_updated_at_idx
  on public.content_entries (updated_at desc);

create table if not exists public.admin_credentials (
  id text primary key,
  password_hash text not null,
  updated_at timestamptz not null default timezone('utc', now())
);
