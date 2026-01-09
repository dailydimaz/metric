-- Create segments table for saving commonly used filters
CREATE TABLE public.segments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.segments ENABLE ROW LEVEL SECURITY;

-- Site owners can manage segments
CREATE POLICY "Site owners can manage segments"
ON public.segments
FOR ALL
USING (EXISTS (
  SELECT 1 FROM sites 
  WHERE sites.id = segments.site_id 
  AND sites.user_id = auth.uid()
));

-- Team members with editor+ role can manage segments
CREATE POLICY "Editors can manage segments"
ON public.segments
FOR ALL
USING (has_team_role(site_id, 'editor'));

-- Team viewers can view segments
CREATE POLICY "Team viewers can view segments"
ON public.segments
FOR SELECT
USING (has_team_role(site_id, 'viewer'));

-- Create index for faster lookups
CREATE INDEX idx_segments_site_id ON public.segments(site_id);
CREATE INDEX idx_segments_user_id ON public.segments(user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_segments_updated_at
BEFORE UPDATE ON public.segments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();