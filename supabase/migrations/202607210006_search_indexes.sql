create extension if not exists pg_trgm with schema extensions;

create index if not exists profiles_nickname_trgm_idx
on public.profiles
using gin (nickname gin_trgm_ops);

create index if not exists posts_title_trgm_idx
on public.posts
using gin (title gin_trgm_ops);

create index if not exists posts_body_trgm_idx
on public.posts
using gin (body gin_trgm_ops);

create index if not exists posts_tags_gin_idx
on public.posts
using gin (tags);
