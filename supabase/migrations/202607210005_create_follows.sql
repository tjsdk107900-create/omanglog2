create table if not exists public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint follows_follower_id_following_id_key unique (follower_id, following_id),
  constraint follows_no_self_follow check (follower_id <> following_id)
);

create index if not exists follows_follower_id_idx
on public.follows (follower_id);

create index if not exists follows_following_id_idx
on public.follows (following_id);

alter table public.follows enable row level security;

drop policy if exists "Anyone can read follows" on public.follows;
create policy "Anyone can read follows"
on public.follows
for select
to anon, authenticated
using (true);

drop policy if exists "Authenticated users can follow" on public.follows;
create policy "Authenticated users can follow"
on public.follows
for insert
to authenticated
with check (auth.uid() = follower_id and follower_id <> following_id);

drop policy if exists "Users can unfollow their own follows" on public.follows;
create policy "Users can unfollow their own follows"
on public.follows
for delete
to authenticated
using (auth.uid() = follower_id);

drop policy if exists "Users cannot update follows" on public.follows;
create policy "Users cannot update follows"
on public.follows
for update
to authenticated
using (false)
with check (false);

grant select on public.follows to anon, authenticated;
grant insert, delete on public.follows to authenticated;

create or replace view public.follow_counts as
select
  profile.id as profile_id,
  coalesce(follower_counts.count, 0)::integer as follower_count,
  coalesce(following_counts.count, 0)::integer as following_count
from public.profiles as profile
left join (
  select following_id, count(*) as count
  from public.follows
  group by following_id
) as follower_counts on follower_counts.following_id = profile.id
left join (
  select follower_id, count(*) as count
  from public.follows
  group by follower_id
) as following_counts on following_counts.follower_id = profile.id;

grant select on public.follow_counts to anon, authenticated;
