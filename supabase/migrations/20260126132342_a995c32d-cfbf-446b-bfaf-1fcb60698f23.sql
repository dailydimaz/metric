-- ============================================
-- FEATURE 1: White Labeling
-- Add branding columns to sites table
-- ============================================
ALTER TABLE public.sites
ADD COLUMN IF NOT EXISTS brand_color text,
ADD COLUMN IF NOT EXISTS brand_logo_url text,
ADD COLUMN IF NOT EXISTS custom_domain text UNIQUE,
ADD COLUMN IF NOT EXISTS custom_css text,
ADD COLUMN IF NOT EXISTS remove_branding boolean DEFAULT false;

-- ============================================
-- FEATURE 2: Custom Alerts
-- ============================================
CREATE TYPE public.alert_type AS ENUM ('traffic_spike', 'traffic_drop', 'uptime');
CREATE TYPE public.alert_metric AS ENUM ('visitors', 'pageviews', 'bounce_rate');
CREATE TYPE public.alert_comparison AS ENUM ('gt', 'lt');
CREATE TYPE public.alert_channel AS ENUM ('email', 'slack', 'webhook');

CREATE TABLE public.alerts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    name text NOT NULL,
    type public.alert_type NOT NULL,
    metric public.alert_metric NOT NULL,
    threshold integer NOT NULL,
    comparison public.alert_comparison NOT NULL,
    channel public.alert_channel NOT NULL,
    channel_config jsonb DEFAULT '{}'::jsonb,
    is_enabled boolean DEFAULT true,
    last_triggered_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site owners can manage alerts"
ON public.alerts FOR ALL
USING (is_site_owner(site_id) OR has_team_role(site_id, 'admin'::text));

CREATE POLICY "Team viewers can view alerts"
ON public.alerts FOR SELECT
USING (has_team_role(site_id, 'viewer'::text));

-- ============================================
-- FEATURE 3: Roll-up Reporting (Site Groups)
-- ============================================
CREATE TABLE public.site_groups (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    user_id uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.site_group_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id uuid NOT NULL REFERENCES public.site_groups(id) ON DELETE CASCADE,
    site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(group_id, site_id)
);

ALTER TABLE public.site_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own site groups"
ON public.site_groups FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage members of own groups"
ON public.site_group_members FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.site_groups
    WHERE site_groups.id = site_group_members.group_id
    AND site_groups.user_id = auth.uid()
));

-- ============================================
-- FEATURE 4: Tag Manager
-- ============================================
CREATE TYPE public.tag_type AS ENUM ('custom_html', 'google_analytics', 'facebook_pixel', 'google_tag_manager', 'custom_script');

CREATE TABLE public.tags (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    name text NOT NULL,
    type public.tag_type NOT NULL,
    config jsonb DEFAULT '{}'::jsonb,
    trigger_rules jsonb DEFAULT '[]'::jsonb,
    is_enabled boolean DEFAULT true,
    load_priority integer DEFAULT 100,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site owners can manage tags"
ON public.tags FOR ALL
USING (is_site_owner(site_id) OR has_team_role(site_id, 'admin'::text));

CREATE POLICY "Team editors can manage tags"
ON public.tags FOR ALL
USING (has_team_role(site_id, 'editor'::text));

CREATE POLICY "Team viewers can view tags"
ON public.tags FOR SELECT
USING (has_team_role(site_id, 'viewer'::text));

-- ============================================
-- FEATURE 5: Log Analytics
-- ============================================
CREATE TYPE public.log_import_status AS ENUM ('pending', 'processing', 'completed', 'failed');

CREATE TABLE public.log_imports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    user_id uuid NOT NULL,
    file_name text NOT NULL,
    file_url text NOT NULL,
    file_size bigint DEFAULT 0,
    status public.log_import_status NOT NULL DEFAULT 'pending',
    rows_processed bigint DEFAULT 0,
    rows_failed bigint DEFAULT 0,
    error_message text,
    started_at timestamptz,
    completed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.log_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site owners can manage log imports"
ON public.log_imports FOR ALL
USING (is_site_owner(site_id) OR auth.uid() = user_id);

-- ============================================
-- FEATURE 7: Heatmaps
-- ============================================
CREATE TABLE public.heatmap_clicks (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    session_id text,
    visitor_id text,
    url_path text NOT NULL,
    x integer NOT NULL,
    y integer NOT NULL,
    viewport_w integer NOT NULL,
    viewport_h integer NOT NULL,
    element_selector text,
    element_text text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.heatmap_scrolls (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    session_id text,
    visitor_id text,
    url_path text NOT NULL,
    max_scroll_percentage integer NOT NULL,
    viewport_h integer,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for heatmap performance
CREATE INDEX idx_heatmap_clicks_site_url ON public.heatmap_clicks(site_id, url_path, created_at);
CREATE INDEX idx_heatmap_scrolls_site_url ON public.heatmap_scrolls(site_id, url_path, created_at);

ALTER TABLE public.heatmap_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.heatmap_scrolls ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts for tracking
CREATE POLICY "Anyone can insert heatmap clicks"
ON public.heatmap_clicks FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM sites WHERE sites.id = heatmap_clicks.site_id));

CREATE POLICY "Anyone can insert heatmap scrolls"
ON public.heatmap_scrolls FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM sites WHERE sites.id = heatmap_scrolls.site_id));

CREATE POLICY "Site owners can view heatmap clicks"
ON public.heatmap_clicks FOR SELECT
USING (is_site_owner(site_id) OR has_team_role(site_id, 'viewer'::text));

CREATE POLICY "Site owners can view heatmap scrolls"
ON public.heatmap_scrolls FOR SELECT
USING (is_site_owner(site_id) OR has_team_role(site_id, 'viewer'::text));

-- ============================================
-- FEATURE 8: A/B Testing
-- ============================================
CREATE TYPE public.experiment_status AS ENUM ('draft', 'active', 'paused', 'ended');

CREATE TABLE public.experiments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    status public.experiment_status NOT NULL DEFAULT 'draft',
    target_url text NOT NULL,
    goal_event text NOT NULL DEFAULT 'pageview',
    goal_url text,
    traffic_percentage integer DEFAULT 100 CHECK (traffic_percentage >= 0 AND traffic_percentage <= 100),
    started_at timestamptz,
    ended_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.experiment_variants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id uuid NOT NULL REFERENCES public.experiments(id) ON DELETE CASCADE,
    name text NOT NULL,
    weight integer NOT NULL DEFAULT 50 CHECK (weight >= 0 AND weight <= 100),
    config jsonb DEFAULT '{}'::jsonb,
    is_control boolean DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.experiment_assignments (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    experiment_id uuid NOT NULL REFERENCES public.experiments(id) ON DELETE CASCADE,
    variant_id uuid NOT NULL REFERENCES public.experiment_variants(id) ON DELETE CASCADE,
    visitor_id text NOT NULL,
    converted boolean DEFAULT false,
    converted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(experiment_id, visitor_id)
);

CREATE INDEX idx_experiment_assignments_lookup ON public.experiment_assignments(experiment_id, visitor_id);

ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiment_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiment_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site owners can manage experiments"
ON public.experiments FOR ALL
USING (is_site_owner(site_id) OR has_team_role(site_id, 'editor'::text));

CREATE POLICY "Team viewers can view experiments"
ON public.experiments FOR SELECT
USING (has_team_role(site_id, 'viewer'::text));

CREATE POLICY "Experiment owners can manage variants"
ON public.experiment_variants FOR ALL
USING (EXISTS (
    SELECT 1 FROM experiments e
    WHERE e.id = experiment_variants.experiment_id
    AND (is_site_owner(e.site_id) OR has_team_role(e.site_id, 'editor'::text))
));

CREATE POLICY "Anyone can insert assignments"
ON public.experiment_assignments FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM experiments e
    WHERE e.id = experiment_assignments.experiment_id AND e.status = 'active'
));

CREATE POLICY "Site owners can view assignments"
ON public.experiment_assignments FOR SELECT
USING (EXISTS (
    SELECT 1 FROM experiments e
    WHERE e.id = experiment_assignments.experiment_id
    AND (is_site_owner(e.site_id) OR has_team_role(e.site_id, 'viewer'::text))
));

-- ============================================
-- FEATURE 9: Visitor Profiles (PII - Strict RLS)
-- ============================================
CREATE TABLE public.visitor_profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    visitor_id text NOT NULL,
    email text,
    name text,
    company text,
    custom_properties jsonb DEFAULT '{}'::jsonb,
    total_visits integer DEFAULT 1,
    total_pageviews integer DEFAULT 0,
    first_seen_at timestamptz NOT NULL DEFAULT now(),
    last_seen_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(site_id, visitor_id)
);

CREATE INDEX idx_visitor_profiles_email ON public.visitor_profiles(site_id, email) WHERE email IS NOT NULL;
CREATE INDEX idx_visitor_profiles_last_seen ON public.visitor_profiles(site_id, last_seen_at);

ALTER TABLE public.visitor_profiles ENABLE ROW LEVEL SECURITY;

-- Very strict RLS - only site owners and admins can access PII
CREATE POLICY "Site owners can manage visitor profiles"
ON public.visitor_profiles FOR ALL
USING (is_site_owner(site_id) OR has_team_role(site_id, 'admin'::text));

-- ============================================
-- FEATURE 10: SSO/SAML (Site-based)
-- ============================================
CREATE TABLE public.sso_providers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    domain text NOT NULL,
    provider_type text NOT NULL DEFAULT 'saml',
    metadata_xml text,
    entry_point text,
    issuer text,
    cert text,
    is_enabled boolean DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(site_id, domain)
);

ALTER TABLE public.sso_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site owners can manage SSO providers"
ON public.sso_providers FOR ALL
USING (is_site_owner(site_id));

-- ============================================
-- Update timestamps trigger for new tables
-- ============================================
CREATE TRIGGER update_alerts_updated_at
    BEFORE UPDATE ON public.alerts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_site_groups_updated_at
    BEFORE UPDATE ON public.site_groups
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tags_updated_at
    BEFORE UPDATE ON public.tags
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_log_imports_updated_at
    BEFORE UPDATE ON public.log_imports
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_experiments_updated_at
    BEFORE UPDATE ON public.experiments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_visitor_profiles_updated_at
    BEFORE UPDATE ON public.visitor_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sso_providers_updated_at
    BEFORE UPDATE ON public.sso_providers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();