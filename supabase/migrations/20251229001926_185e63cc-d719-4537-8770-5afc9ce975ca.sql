-- Fix: Remove team members' ability to view Slack webhook URLs
-- Webhook URLs are credentials that should only be visible to site owners
-- Team members don't need to view integration settings

DROP POLICY IF EXISTS "Team members can view site slack integrations" ON public.slack_integrations;