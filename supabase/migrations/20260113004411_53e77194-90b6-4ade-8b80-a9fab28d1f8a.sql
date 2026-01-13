-- Create insights table for custom reports
CREATE TABLE public.insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  date_range JSONB NOT NULL DEFAULT '{"preset": "7d"}'::jsonb,
  widgets JSONB NOT NULL DEFAULT '["visitors", "pageviews", "top_pages"]'::jsonb,
  share_token TEXT UNIQUE DEFAULT encode(extensions.gen_random_bytes(16), 'hex'::text),
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view insights for own sites"
ON public.insights FOR SELECT
USING (EXISTS (
  SELECT 1 FROM sites WHERE sites.id = insights.site_id AND sites.user_id = auth.uid()
));

CREATE POLICY "Team viewers can view site insights"
ON public.insights FOR SELECT
USING (has_team_role(site_id, 'viewer'::text));

CREATE POLICY "Users can create insights for own sites"
ON public.insights FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM sites WHERE sites.id = insights.site_id AND sites.user_id = auth.uid()
) OR has_team_role(site_id, 'editor'::text));

CREATE POLICY "Editors can update insights"
ON public.insights FOR UPDATE
USING (is_site_owner(site_id) OR has_team_role(site_id, 'editor'::text));

CREATE POLICY "Editors can delete insights"
ON public.insights FOR DELETE
USING (is_site_owner(site_id) OR has_team_role(site_id, 'editor'::text));

-- Create function to get public insight by share token
CREATE OR REPLACE FUNCTION public.get_shared_insight(_share_token TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  filters JSONB,
  date_range JSONB,
  widgets JSONB,
  site_id UUID
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id, i.name, i.description, i.filters, i.date_range, i.widgets, i.site_id
  FROM public.insights i
  WHERE i.share_token = _share_token AND i.is_public = true;
END;
$$;

-- Trigger for updated_at
CREATE TRIGGER update_insights_updated_at
BEFORE UPDATE ON public.insights
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();