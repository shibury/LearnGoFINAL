create or replace function public.get_chat_messages(limit_rows integer default 50)
returns table (
  id            uuid,
  user_id       uuid,
  message       text,
  created_at    timestamptz,
  author_name   text,
  author_avatar text
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    c.id,
    c.user_id,
    c.message,
    c.created_at,
    coalesce(
      nullif(nullif(trim(u.name), ''), 'Learner'),
      nullif(trim(account.raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(account.raw_user_meta_data ->> 'name'), ''),
      'Learner'
    ) as author_name,
    coalesce(
      nullif(trim(u.avatar_url), ''),
      nullif(trim(account.raw_user_meta_data ->> 'avatar_url'), ''),
      nullif(trim(account.raw_user_meta_data ->> 'picture'), '')
    ) as author_avatar
  from public.community_chats c
  left join public.users u on u.id = c.user_id
  left join auth.users account on account.id = c.user_id
  order by c.created_at desc
  limit least(greatest(limit_rows, 1), 200);
$$;

create or replace function public.get_chat_authors(user_ids uuid[])
returns table (
  id         uuid,
  name       text,
  avatar_url text
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    account.id,
    coalesce(
      nullif(nullif(trim(u.name), ''), 'Learner'),
      nullif(trim(account.raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(account.raw_user_meta_data ->> 'name'), ''),
      'Learner'
    ) as name,
    coalesce(
      nullif(trim(u.avatar_url), ''),
      nullif(trim(account.raw_user_meta_data ->> 'avatar_url'), ''),
      nullif(trim(account.raw_user_meta_data ->> 'picture'), '')
    ) as avatar_url
  from auth.users account
  left join public.users u on u.id = account.id
  where account.id = any(user_ids)
  limit 200;
$$;

revoke execute on function public.get_chat_messages(integer) from public, anon;
revoke execute on function public.get_chat_authors(uuid[]) from public, anon;
grant execute on function public.get_chat_messages(integer) to authenticated;
grant execute on function public.get_chat_authors(uuid[]) to authenticated;
