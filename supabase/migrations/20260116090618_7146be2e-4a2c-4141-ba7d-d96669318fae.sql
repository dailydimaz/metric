-- ============================================================
-- HIGH PERFORMANCE ANALYTICS: STEP 1 - Extensions & Partitioning (Fixed)
-- Using native declarative partitioning without pg_partman
-- ============================================================

-- Enable pg_cron for scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- ============================================================
-- Create partitioned events table (events_partitioned)
-- Using RANGE partitioning on created_at (monthly partitions)
-- ============================================================

CREATE TABLE public.events_partitioned (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL,
    event_name TEXT NOT NULL DEFAULT 'pageview',
    url TEXT,
    referrer TEXT,
    device_type TEXT,
    browser TEXT,
    os TEXT,
    country TEXT,
    city TEXT,
    session_id TEXT,
    visitor_id TEXT,
    language TEXT,
    properties JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create monthly partitions manually (past 12 months + future 6 months)
CREATE TABLE public.events_y2025m01 PARTITION OF public.events_partitioned
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE public.events_y2025m02 PARTITION OF public.events_partitioned
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
CREATE TABLE public.events_y2025m03 PARTITION OF public.events_partitioned
    FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');
CREATE TABLE public.events_y2025m04 PARTITION OF public.events_partitioned
    FOR VALUES FROM ('2025-04-01') TO ('2025-05-01');
CREATE TABLE public.events_y2025m05 PARTITION OF public.events_partitioned
    FOR VALUES FROM ('2025-05-01') TO ('2025-06-01');
CREATE TABLE public.events_y2025m06 PARTITION OF public.events_partitioned
    FOR VALUES FROM ('2025-06-01') TO ('2025-07-01');
CREATE TABLE public.events_y2025m07 PARTITION OF public.events_partitioned
    FOR VALUES FROM ('2025-07-01') TO ('2025-08-01');
CREATE TABLE public.events_y2025m08 PARTITION OF public.events_partitioned
    FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');
CREATE TABLE public.events_y2025m09 PARTITION OF public.events_partitioned
    FOR VALUES FROM ('2025-09-01') TO ('2025-10-01');
CREATE TABLE public.events_y2025m10 PARTITION OF public.events_partitioned
    FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');
CREATE TABLE public.events_y2025m11 PARTITION OF public.events_partitioned
    FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');
CREATE TABLE public.events_y2025m12 PARTITION OF public.events_partitioned
    FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');
CREATE TABLE public.events_y2026m01 PARTITION OF public.events_partitioned
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE public.events_y2026m02 PARTITION OF public.events_partitioned
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE public.events_y2026m03 PARTITION OF public.events_partitioned
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE public.events_y2026m04 PARTITION OF public.events_partitioned
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE public.events_y2026m05 PARTITION OF public.events_partitioned
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE public.events_y2026m06 PARTITION OF public.events_partitioned
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

-- Default partition for any data outside defined ranges
CREATE TABLE public.events_default PARTITION OF public.events_partitioned DEFAULT;

-- Create lightweight indexes on partitions (BRIN for time-based queries)
CREATE INDEX idx_events_part_site_time ON public.events_partitioned USING BRIN (site_id, created_at);
CREATE INDEX idx_events_part_lookup ON public.events_partitioned (site_id, event_name, created_at DESC);
CREATE INDEX idx_events_part_visitor ON public.events_partitioned (site_id, visitor_id, created_at DESC);

-- Enable RLS on partitioned table
ALTER TABLE public.events_partitioned ENABLE ROW LEVEL SECURITY;

-- Copy RLS policies from original events table
CREATE POLICY "Anyone can insert events_partitioned" 
ON public.events_partitioned 
FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM sites WHERE sites.id = events_partitioned.site_id));

CREATE POLICY "Team members can view site events_partitioned" 
ON public.events_partitioned 
FOR SELECT 
USING (EXISTS (SELECT 1 FROM team_members WHERE team_members.site_id = events_partitioned.site_id AND team_members.user_id = auth.uid()));

CREATE POLICY "Users can view events_partitioned for own sites" 
ON public.events_partitioned 
FOR SELECT 
USING (EXISTS (SELECT 1 FROM sites WHERE sites.id = events_partitioned.site_id AND sites.user_id = auth.uid()));

-- ============================================================
-- Rollup Tables for Pre-aggregated Analytics
-- ============================================================

-- Hourly site-level stats (main rollup)
CREATE TABLE public.analytics_hourly (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    hour_timestamp TIMESTAMPTZ NOT NULL,
    pageviews BIGINT NOT NULL DEFAULT 0,
    unique_visitors BIGINT NOT NULL DEFAULT 0,
    sessions BIGINT NOT NULL DEFAULT 0,
    bounces BIGINT NOT NULL DEFAULT 0,
    total_session_duration BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (site_id, hour_timestamp)
);

CREATE INDEX idx_analytics_hourly_lookup ON public.analytics_hourly USING BRIN (site_id, hour_timestamp);

-- Hourly page-level stats
CREATE TABLE public.analytics_pages_hourly (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    hour_timestamp TIMESTAMPTZ NOT NULL,
    url TEXT NOT NULL,
    pageviews BIGINT NOT NULL DEFAULT 0,
    unique_visitors BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (site_id, hour_timestamp, url)
);

CREATE INDEX idx_analytics_pages_lookup ON public.analytics_pages_hourly USING BRIN (site_id, hour_timestamp);

-- Hourly referrer stats
CREATE TABLE public.analytics_referrers_hourly (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    hour_timestamp TIMESTAMPTZ NOT NULL,
    referrer TEXT NOT NULL,
    visits BIGINT NOT NULL DEFAULT 0,
    unique_visitors BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (site_id, hour_timestamp, referrer)
);

CREATE INDEX idx_analytics_referrers_lookup ON public.analytics_referrers_hourly USING BRIN (site_id, hour_timestamp);

-- Hourly geo stats
CREATE TABLE public.analytics_geo_hourly (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    hour_timestamp TIMESTAMPTZ NOT NULL,
    country TEXT NOT NULL,
    city TEXT,
    visits BIGINT NOT NULL DEFAULT 0,
    unique_visitors BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (site_id, hour_timestamp, country, city)
);

CREATE INDEX idx_analytics_geo_lookup ON public.analytics_geo_hourly USING BRIN (site_id, hour_timestamp);

-- Hourly device stats
CREATE TABLE public.analytics_devices_hourly (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    hour_timestamp TIMESTAMPTZ NOT NULL,
    device_type TEXT,
    browser TEXT,
    os TEXT,
    visits BIGINT NOT NULL DEFAULT 0,
    unique_visitors BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (site_id, hour_timestamp, device_type, browser, os)
);

CREATE INDEX idx_analytics_devices_lookup ON public.analytics_devices_hourly USING BRIN (site_id, hour_timestamp);

-- Hourly language stats
CREATE TABLE public.analytics_languages_hourly (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    hour_timestamp TIMESTAMPTZ NOT NULL,
    language TEXT NOT NULL,
    visits BIGINT NOT NULL DEFAULT 0,
    unique_visitors BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (site_id, hour_timestamp, language)
);

CREATE INDEX idx_analytics_languages_lookup ON public.analytics_languages_hourly USING BRIN (site_id, hour_timestamp);

-- Aggregation watermark (tracks last aggregated timestamp per site)
CREATE TABLE public.analytics_aggregation_watermark (
    site_id UUID PRIMARY KEY REFERENCES public.sites(id) ON DELETE CASCADE,
    last_aggregated_at TIMESTAMPTZ NOT NULL DEFAULT '1970-01-01'::timestamptz,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on rollup tables
ALTER TABLE public.analytics_hourly ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_pages_hourly ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_referrers_hourly ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_geo_hourly ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_devices_hourly ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_languages_hourly ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_aggregation_watermark ENABLE ROW LEVEL SECURITY;

-- RLS policies for rollup tables (SELECT only via SECURITY DEFINER functions)
CREATE POLICY "Users can view own site analytics_hourly" ON public.analytics_hourly 
FOR SELECT USING (is_site_owner(site_id) OR has_team_role(site_id, 'viewer'));

CREATE POLICY "Users can view own site analytics_pages_hourly" ON public.analytics_pages_hourly 
FOR SELECT USING (is_site_owner(site_id) OR has_team_role(site_id, 'viewer'));

CREATE POLICY "Users can view own site analytics_referrers_hourly" ON public.analytics_referrers_hourly 
FOR SELECT USING (is_site_owner(site_id) OR has_team_role(site_id, 'viewer'));

CREATE POLICY "Users can view own site analytics_geo_hourly" ON public.analytics_geo_hourly 
FOR SELECT USING (is_site_owner(site_id) OR has_team_role(site_id, 'viewer'));

CREATE POLICY "Users can view own site analytics_devices_hourly" ON public.analytics_devices_hourly 
FOR SELECT USING (is_site_owner(site_id) OR has_team_role(site_id, 'viewer'));

CREATE POLICY "Users can view own site analytics_languages_hourly" ON public.analytics_languages_hourly 
FOR SELECT USING (is_site_owner(site_id) OR has_team_role(site_id, 'viewer'));

CREATE POLICY "Users can view own site aggregation_watermark" ON public.analytics_aggregation_watermark 
FOR SELECT USING (is_site_owner(site_id) OR has_team_role(site_id, 'viewer'));