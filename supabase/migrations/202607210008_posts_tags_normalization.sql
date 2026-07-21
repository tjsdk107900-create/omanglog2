create or replace function public.normalize_post_tags(input_tags text[])
returns text[]
language sql
immutable
as $$
  select coalesce(array_agg(tag order by first_seen), '{}'::text[])
  from (
    select tag, first_seen
    from (
      select distinct on (normalized) normalized as tag, ord as first_seen
      from unnest(coalesce(input_tags, '{}'::text[])) with ordinality as raw(value, ord)
      cross join lateral (
        select left(
          lower(
            regexp_replace(
              regexp_replace(
                trim(both from regexp_replace(raw.value, '^#+', '')),
                '\s+',
                '-',
                'g'
              ),
              '[^[:alnum:]가-힣_-]',
              '',
              'g'
            )
          ),
          24
        ) as normalized
      ) cleaned
      where normalized <> ''
        and normalized ~ '[[:alnum:]가-힣]'
      order by normalized, ord
    ) deduped
    order by first_seen
    limit 8
  ) limited;
$$;

create or replace function public.set_normalized_post_tags()
returns trigger
language plpgsql
as $$
begin
  new.tags = public.normalize_post_tags(new.tags);
  return new;
end;
$$;

drop trigger if exists posts_normalize_tags_before_write on public.posts;
create trigger posts_normalize_tags_before_write
before insert or update of tags on public.posts
for each row
execute function public.set_normalized_post_tags();

update public.posts
set tags = public.normalize_post_tags(tags)
where tags is distinct from public.normalize_post_tags(tags);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'posts_tags_max_count_check'
      and conrelid = 'public.posts'::regclass
  ) then
    alter table public.posts
    add constraint posts_tags_max_count_check
    check (coalesce(array_length(tags, 1), 0) <= 8);
  end if;
end;
$$;

create index if not exists posts_tags_gin_idx
on public.posts
using gin (tags);
