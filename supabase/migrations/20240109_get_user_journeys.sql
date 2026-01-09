-- Create a function to analyze user journeys
create or replace function get_user_journeys(
  _site_id uuid,
  _start_date timestamptz,
  _end_date timestamptz
)
returns table (
  source text,
  target text,
  count bigint
)
language plpgsql
security definer
as $$
begin
  return query
  with events_cleaned as (
    -- Get relevant events, simple URL cleanup if needed
    select
      session_id,
      -- Simple path extraction (could be improved)
      regexp_replace(url, '\?.*$', '') as clean_url, 
      created_at
    from events
    where site_id = _site_id
    and created_at >= _start_date
    and created_at <= _end_date
    and event_name = 'pageview' -- Only pageviews matter for journey
  ),
  ordered_events as (
    select
      session_id,
      clean_url,
      lead(clean_url) over (partition by session_id order by created_at) as next_url
    from events_cleaned
  ),
  journeys as (
    select
      clean_url as source,
      next_url as target,
      count(*) as count
    from ordered_events
    where next_url is not null
    and clean_url != next_url -- Ignore refresh/same page
    group by 1, 2
  )
  select
    source,
    target,
    count
  from journeys
  order by count desc
  limit 50;
end;
$$;
