-- Fix: Restrict customer_email access to site owners and admins only
-- Drop existing viewer policy and create a more restrictive one

-- Drop the existing viewer policy that exposes customer_email
DROP POLICY IF EXISTS "Team viewers can view shopify orders" ON public.shopify_orders;

-- Create a function to return shopify orders with email visibility based on role
-- This allows viewers to see orders but NOT customer emails
CREATE OR REPLACE FUNCTION public.get_shopify_orders_for_site(p_site_id uuid)
RETURNS TABLE (
  id uuid,
  site_id uuid,
  shopify_order_id text,
  order_number text,
  amount numeric,
  currency text,
  status text,
  customer_email text,
  line_items jsonb,
  discount_codes jsonb,
  shipping_total numeric,
  tax_total numeric,
  order_created_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is site owner or admin - they can see emails
  IF is_site_owner(p_site_id) OR has_team_role(p_site_id, 'admin') THEN
    RETURN QUERY
    SELECT 
      so.id,
      so.site_id,
      so.shopify_order_id,
      so.order_number,
      so.amount,
      so.currency,
      so.status,
      so.customer_email,
      so.line_items,
      so.discount_codes,
      so.shipping_total,
      so.tax_total,
      so.order_created_at,
      so.created_at,
      so.updated_at
    FROM shopify_orders so
    WHERE so.site_id = p_site_id;
  -- Check if user is a viewer - they can see orders but NOT emails
  ELSIF has_team_role(p_site_id, 'viewer') THEN
    RETURN QUERY
    SELECT 
      so.id,
      so.site_id,
      so.shopify_order_id,
      so.order_number,
      so.amount,
      so.currency,
      so.status,
      NULL::text AS customer_email,  -- Hide email from viewers
      so.line_items,
      so.discount_codes,
      so.shipping_total,
      so.tax_total,
      so.order_created_at,
      so.created_at,
      so.updated_at
    FROM shopify_orders so
    WHERE so.site_id = p_site_id;
  ELSE
    -- No access
    RETURN;
  END IF;
END;
$$;

-- Create new policy for viewers that uses column-level security via the function
-- Remove direct table access for viewers - they must use the function
-- Site owners still have direct SELECT access with full data

COMMENT ON FUNCTION public.get_shopify_orders_for_site IS 'Returns shopify orders with customer_email hidden for viewer-role team members. Use this function instead of direct table queries to protect PII.';
