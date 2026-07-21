create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint comments_content_not_blank check (length(btrim(content)) > 0)
);

create index if not exists comments_post_id_created_at_idx
on public.comments (post_id, created_at asc);

create index if not exists comments_user_id_idx
on public.comments (user_id);

alter table public.comments enable row level security;

drop policy if exists "Anyone can read comments" on public.comments;
create policy "Anyone can read comments"
on public.comments
for select
to anon, authenticated
using (true);

drop policy if exists "Authenticated users can create comments" on public.comments;
create policy "Authenticated users can create comments"
on public.comments
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own comments" on public.comments;
create policy "Users can update their own comments"
on public.comments
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id and length(btrim(content)) > 0);

drop policy if exists "Users can delete their own comments" on public.comments;
create policy "Users can delete their own comments"
on public.comments
for delete
to authenticated
using (auth.uid() = user_id);

grant select on public.comments to anon, authenticated;
grant insert, update, delete on public.comments to authenticated;

create or replace view public.post_comment_counts as
select
  post_id,
  count(*)::integer as comment_count
from public.comments
group by post_id;

grant select on public.post_comment_counts to anon, authenticated;
