-- Create funnels table for funnel analysis
CREATE TABLE public.funnels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  time_window_days INTEGER DEFAULT 7,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.funnels ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only manage funnels for their own sites
CREATE POLICY "Users can view funnels for own sites"
ON public.funnels
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.sites
  WHERE sites.id = funnels.site_id
  AND sites.user_id = auth.uid()
));

CREATE POLICY "Users can create funnels for own sites"
ON public.funnels
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.sites
  WHERE sites.id = funnels.site_id
  AND sites.user_id = auth.uid()
));

CREATE POLICY "Users can update funnels for own sites"
ON public.funnels
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.sites
  WHERE sites.id = funnels.site_id
  AND sites.user_id = auth.uid()
));

CREATE POLICY "Users can delete funnels for own sites"
ON public.funnels
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.sites
  WHERE sites.id = funnels.site_id
  AND sites.user_id = auth.uid()
));

-- Add trigger for updated_at
CREATE TRIGGER update_funnels_updated_at
  BEFORE UPDATE ON public.funnels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();