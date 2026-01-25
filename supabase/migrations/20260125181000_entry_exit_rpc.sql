-- Create RPC function to get entry and exit pages stats
create or replace function get_entry_exit_pages(
  _site_id uuid,
  _start_date timestamptz,
  _end_date timestamptz,
  _limit int default 10,
  _filters jsonb default '{}'
)
returns table (
  url text,
  entry_count bigint,
  exit_count bigint
)
language plpgsql
security definer
as $$
begin
  return query
  with session_boundaries as (
    select distinct on (session_id)
      session_id,
      first_value(url) over (partition by session_id order by created_at asc) as entry_url,
      first_value(url) over (partition by session_id order by created_at desc) as exit_url
    from events
    where site_id = _site_id
    and created_at >= _start_date
    and created_at <= _end_date
    and (
      _filters is null or _filters = '{}'::jsonb or (
        (_filters->>'url' is null or url = _filters->>'url')
        and (_filters->>'browser' is null or browser = _filters->>'browser')
        and (_filters->>'os' is null or os = _filters->>'os')
        and (_filters->>'device' is null or device_type = _filters->>'device')
        and (_filters->>'country' is null or country = _filters->>'country')
      )
    )
  ),
  entries as (
    select entry_url as url, count(*) as c from session_boundaries group by entry_url
  ),
  exits as (
    select exit_url as url, count(*) as c from session_boundaries group by exit_url
  )
  select
    coalesce(e.url, x.url) as url,
    coalesce(e.c, 0) as entry_count,
    coalesce(x.c, 0) as exit_count
  from entries e
  full outer join exits x on e.url = x.url
  order by (coalesce(e.c, 0) + coalesce(x.c, 0)) desc
  limit _limit;
end;
$$;
