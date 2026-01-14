-- Create links table for short link tracking
CREATE TABLE public.links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  original_url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_links_slug ON public.links(slug);
CREATE INDEX idx_links_site_id ON public.links(site_id);
CREATE INDEX idx_links_user_id ON public.links(user_id);

-- Enable Row Level Security
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view links for own sites"
ON public.links
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM sites
    WHERE sites.id = links.site_id AND sites.user_id = auth.uid()
  )
);

CREATE POLICY "Team members can view site links"
ON public.links
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM team_members
    WHERE team_members.site_id = links.site_id AND team_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create links for own sites"
ON public.links
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM sites
    WHERE sites.id = links.site_id AND sites.user_id = auth.uid()
  )
);

CREATE POLICY "Editors can create links"
ON public.links
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  has_team_role(site_id, 'editor'::text)
);

CREATE POLICY "Users can delete own links"
ON public.links
FOR DELETE
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM sites
    WHERE sites.id = links.site_id AND sites.user_id = auth.uid()
  )
);