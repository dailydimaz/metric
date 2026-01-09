-- Create a function to get breakdown stats dynamically
create or replace function get_breakdown_stats(
  _site_id uuid,
  _start_date timestamptz,
  _end_date timestamptz,
  _group_by text,
  _filter_column text default null,
  _filter_value text default null
)
returns table (
  value text,
  visitors bigint,
  pageviews bigint,
  bounce_rate numeric,
  avg_duration numeric
)
language plpgsql
security definer
as $$
declare
  query text;
begin
  -- Validate _group_by column to prevent SQL injection
  if _group_by not in ('browser', 'os', 'device_type', 'country', 'city', 'language', 'referrer') then
    raise exception 'Invalid group by column';
  end if;

  -- Validate _filter_column if provided
  if _filter_column is not null and _filter_column not in ('browser', 'os', 'device_type', 'country', 'city', 'language', 'referrer') then
    raise exception 'Invalid filter column';
  end if;

  query := format('
    with stats as (
      select
        %I as group_key,
        count(distinct session_id) as visitors,
        count(*) as pageviews,
        count(distinct case when is_bounce then session_id end) as bounced_sessions,
        avg(duration) as avg_duration
      from events_with_sessions
      where site_id = %L
      and created_at >= %L
      and created_at <= %L
      %s
      group by 1
    )
    select
      coalesce(group_key, ''(none)'') as value,
      visitors,
      pageviews,
      round(cast(bounced_sessions::float / nullif(visitors, 0) * 100 as numeric), 1) as bounce_rate,
      round(cast(avg_duration as numeric), 1) as avg_duration
    from stats
    order by visitors desc
    limit 100
  ', 
    _group_by, 
    _site_id, 
    _start_date, 
    _end_date,
    case 
      when _filter_column is not null and _filter_value is not null 
      then format('and %I = %L', _filter_column, _filter_value)
      else ''
    end
  );

  return query execute query;
end;
$$;
