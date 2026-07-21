create table if not exists public.post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint post_likes_post_id_user_id_key unique (post_id, user_id)
);

create index if not exists post_likes_post_id_idx
on public.post_likes (post_id);

create index if not exists post_likes_user_id_idx
on public.post_likes (user_id);

alter table public.post_likes enable row level security;

drop policy if exists "Anyone can read post likes" on public.post_likes;
create policy "Anyone can read post likes"
on public.post_likes
for select
to anon, authenticated
using (true);

drop policy if exists "Authenticated users can like posts" on public.post_likes;
create policy "Authenticated users can like posts"
on public.post_likes
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can unlike their own likes" on public.post_likes;
create policy "Users can unlike their own likes"
on public.post_likes
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users cannot update post likes" on public.post_likes;
create policy "Users cannot update post likes"
on public.post_likes
for update
to authenticated
using (false)
with check (false);

grant select on public.post_likes to anon, authenticated;
grant insert, delete on public.post_likes to authenticated;

create or replace view public.post_like_counts as
select
  post_id,
  count(*)::integer as like_count
from public.post_likes
group by post_id;

grant select on public.post_like_counts to anon, authenticated;
