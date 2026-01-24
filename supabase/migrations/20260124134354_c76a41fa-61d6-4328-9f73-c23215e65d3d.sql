-- Create enum for integration providers
CREATE TYPE public.integration_provider AS ENUM (
  'google_analytics',
  'shopify',
  'google_search_console'
);

-- Create integrations table for storing OAuth tokens and configuration
CREATE TABLE public.integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  provider integration_provider NOT NULL,
  access_token TEXT, -- Will be encrypted at application level
  refresh_token TEXT, -- Will be encrypted at application level
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb, -- For property_id, shop_url, etc.
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(site_id, provider)
);

-- Create shopify_orders table for revenue tracking
CREATE TABLE public.shopify_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  shopify_order_id TEXT NOT NULL,
  order_number TEXT,
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending',
  customer_email TEXT,
  line_items JSONB DEFAULT '[]'::jsonb,
  discount_codes JSONB DEFAULT '[]'::jsonb,
  shipping_total NUMERIC(12, 2) DEFAULT 0,
  tax_total NUMERIC(12, 2) DEFAULT 0,
  order_created_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(site_id, shopify_order_id)
);

-- Create gsc_stats table for Google Search Console data
CREATE TABLE public.gsc_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  url TEXT,
  keyword TEXT NOT NULL,
  clicks INTEGER NOT NULL DEFAULT 0,
  impressions INTEGER NOT NULL DEFAULT 0,
  position NUMERIC(5, 2),
  ctr NUMERIC(5, 4),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(site_id, date, keyword, url)
);

-- Create indexes for performance
CREATE INDEX idx_integrations_site_id ON public.integrations(site_id);
CREATE INDEX idx_integrations_provider ON public.integrations(provider);
CREATE INDEX idx_integrations_active ON public.integrations(site_id, is_active) WHERE is_active = true;

CREATE INDEX idx_shopify_orders_site_id ON public.shopify_orders(site_id);
CREATE INDEX idx_shopify_orders_created_at ON public.shopify_orders(site_id, order_created_at DESC);
CREATE INDEX idx_shopify_orders_status ON public.shopify_orders(site_id, status);

CREATE INDEX idx_gsc_stats_site_date ON public.gsc_stats(site_id, date DESC);
CREATE INDEX idx_gsc_stats_keyword ON public.gsc_stats(site_id, keyword);
CREATE INDEX idx_gsc_stats_lookup ON public.gsc_stats(site_id, date, keyword);

-- Enable RLS on all tables
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopify_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gsc_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for integrations table
CREATE POLICY "Site owners can view integrations"
  ON public.integrations FOR SELECT
  USING (is_site_owner(site_id));

CREATE POLICY "Site owners can create integrations"
  ON public.integrations FOR INSERT
  WITH CHECK (is_site_owner(site_id));

CREATE POLICY "Site owners can update integrations"
  ON public.integrations FOR UPDATE
  USING (is_site_owner(site_id));

CREATE POLICY "Site owners can delete integrations"
  ON public.integrations FOR DELETE
  USING (is_site_owner(site_id));

CREATE POLICY "Team admins can manage integrations"
  ON public.integrations FOR ALL
  USING (has_team_role(site_id, 'admin'));

-- RLS Policies for shopify_orders table
CREATE POLICY "Site owners can view shopify orders"
  ON public.shopify_orders FOR SELECT
  USING (is_site_owner(site_id));

CREATE POLICY "Team viewers can view shopify orders"
  ON public.shopify_orders FOR SELECT
  USING (has_team_role(site_id, 'viewer'));

-- Service role will insert orders via webhook, no user INSERT policy needed

-- RLS Policies for gsc_stats table
CREATE POLICY "Site owners can view gsc stats"
  ON public.gsc_stats FOR SELECT
  USING (is_site_owner(site_id));

CREATE POLICY "Team viewers can view gsc stats"
  ON public.gsc_stats FOR SELECT
  USING (has_team_role(site_id, 'viewer'));

-- Service role will insert stats via sync, no user INSERT policy needed

-- Create trigger for updated_at on integrations
CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON public.integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on shopify_orders
CREATE TRIGGER update_shopify_orders_updated_at
  BEFORE UPDATE ON public.shopify_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();