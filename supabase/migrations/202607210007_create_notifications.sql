create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  type text not null check (type in ('like', 'comment', 'follow')),
  post_id uuid references public.posts(id) on delete set null,
  comment_id uuid references public.comments(id) on delete set null,
  follow_id uuid references public.follows(id) on delete set null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_recipient_created_at_idx
on public.notifications (recipient_id, created_at desc);

create index if not exists notifications_recipient_is_read_idx
on public.notifications (recipient_id, is_read);

create index if not exists notifications_actor_id_idx
on public.notifications (actor_id);

create index if not exists notifications_post_id_idx
on public.notifications (post_id);

create index if not exists notifications_comment_id_idx
on public.notifications (comment_id);

create index if not exists notifications_type_idx
on public.notifications (type);

create unique index if not exists notifications_unique_like_event_idx
on public.notifications (recipient_id, actor_id, type, post_id)
where type = 'like' and post_id is not null;

create unique index if not exists notifications_unique_comment_event_idx
on public.notifications (recipient_id, actor_id, type, comment_id)
where type = 'comment' and comment_id is not null;

create unique index if not exists notifications_unique_follow_event_idx
on public.notifications (recipient_id, actor_id, type)
where type = 'follow';

alter table public.notifications enable row level security;

drop policy if exists "Users can read their own notifications" on public.notifications;
create policy "Users can read their own notifications"
on public.notifications
for select
to authenticated
using (auth.uid() = recipient_id);

drop policy if exists "Users can update their own notifications" on public.notifications;
create policy "Users can update their own notifications"
on public.notifications
for update
to authenticated
using (auth.uid() = recipient_id)
with check (auth.uid() = recipient_id);

drop policy if exists "Users can delete their own notifications" on public.notifications;
create policy "Users can delete their own notifications"
on public.notifications
for delete
to authenticated
using (auth.uid() = recipient_id);

drop policy if exists "Clients cannot insert notifications" on public.notifications;
create policy "Clients cannot insert notifications"
on public.notifications
for insert
to authenticated
with check (false);

revoke all on public.notifications from anon, authenticated;
grant select, delete on public.notifications to authenticated;
grant update (is_read) on public.notifications to authenticated;

create or replace function public.create_like_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_user_id uuid;
begin
  select user_id into target_user_id
  from public.posts
  where id = new.post_id;

  if target_user_id is not null and target_user_id <> new.user_id then
    insert into public.notifications (recipient_id, actor_id, type, post_id)
    values (target_user_id, new.user_id, 'like', new.post_id)
    on conflict do nothing;
  end if;

  return new;
exception
  when others then
    return new;
end;
$$;

create or replace function public.create_comment_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_user_id uuid;
begin
  select user_id into target_user_id
  from public.posts
  where id = new.post_id;

  if target_user_id is not null and target_user_id <> new.user_id then
    insert into public.notifications (recipient_id, actor_id, type, post_id, comment_id)
    values (target_user_id, new.user_id, 'comment', new.post_id, new.id)
    on conflict do nothing;
  end if;

  return new;
exception
  when others then
    return new;
end;
$$;

create or replace function public.create_follow_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.following_id <> new.follower_id then
    insert into public.notifications (recipient_id, actor_id, type, follow_id)
    values (new.following_id, new.follower_id, 'follow', new.id)
    on conflict do nothing;
  end if;

  return new;
exception
  when others then
    return new;
end;
$$;

drop trigger if exists post_likes_create_notification on public.post_likes;
create trigger post_likes_create_notification
after insert on public.post_likes
for each row
execute function public.create_like_notification();

drop trigger if exists comments_create_notification on public.comments;
create trigger comments_create_notification
after insert on public.comments
for each row
execute function public.create_comment_notification();

drop trigger if exists follows_create_notification on public.follows;
create trigger follows_create_notification
after insert on public.follows
for each row
execute function public.create_follow_notification();

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1
       from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'notifications'
     ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end;
$$;
