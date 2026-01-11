import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getLocationFromHeaders } from "./detect.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400', // Cache preflight for 24 hours
};

// Simple in-memory rate limiter (resets on function cold start)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 200; // requests per minute
const RATE_WINDOW = 60000; // 1 minute in ms

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (entry.count >= RATE_LIMIT) {
    return false;
  }

  entry.count++;
  return true;
}

// Clean up old entries periodically (prevent memory leak)
function cleanupRateLimitMap() {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupRateLimitMap, 5 * 60 * 1000);

// Input validation constants
const MAX_URL_LENGTH = 2000;
const MAX_EVENT_NAME_LENGTH = 100;
const MAX_PROPERTIES_SIZE = 10240; // 10KB

// Parse user agent to extract browser, OS, and device type
function parseUserAgent(ua: string): { browser: string; os: string; device_type: string } {
  let browser = 'Unknown';
  let os = 'Unknown';
  let device_type = 'desktop';

  // Detect browser
  if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Opera') || ua.includes('OPR/')) browser = 'Opera';

  // Detect OS
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS X') || ua.includes('Macintosh')) os = 'macOS';
  else if (ua.includes('Linux') && !ua.includes('Android')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  // Detect device type
  if (ua.includes('Mobile') || ua.includes('Android') && !ua.includes('Tablet')) {
    device_type = 'mobile';
  } else if (ua.includes('Tablet') || ua.includes('iPad')) {
    device_type = 'tablet';
  }

  return { browser, os, device_type };
}

// Generate a cryptographic hash for visitor fingerprinting using SHA-256
async function generateVisitorId(ip: string, ua: string): Promise<string> {
  const str = `${ip}-${ua}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  // Use first 16 hex characters for a unique 64-bit identifier
  return hashArray.slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Extract geo data from various proxy headers (Implementation moved to detect.ts)


// Extract language from Accept-Language header
function extractLanguage(req: Request): string | null {
  const acceptLanguage = req.headers.get('accept-language') || '';

  // Parse Accept-Language header (e.g., "en-US,en;q=0.9,es;q=0.8")
  if (!acceptLanguage) return null;

  // Get the primary language code (first part before any comma or semicolon)
  const primaryLang = acceptLanguage.split(',')[0]?.split(';')[0]?.trim();

  // Return just the language code (e.g., "en" from "en-US")
  return primaryLang?.split('-')[0]?.toLowerCase() || null;
}

serve(async (req) => {
  const origin = req.headers.get('origin') || 'no-origin';
  const contentType = req.headers.get('content-type') || 'no-content-type';
  console.log(`Incoming request: ${req.method} from ${origin}, content-type: ${contentType}`);

  // Log all relevant headers for debugging geo issues
  const geoHeaders = {
    'cf-ipcountry': req.headers.get('cf-ipcountry'),
    'cf-ipcity': req.headers.get('cf-ipcity'),
    'x-vercel-ip-country': req.headers.get('x-vercel-ip-country'),
    'x-vercel-ip-city': req.headers.get('x-vercel-ip-city'),
    'accept-language': req.headers.get('accept-language'),
  };
  console.log('Geo headers:', JSON.stringify(geoHeaders));

  // Handle CORS preflight with explicit 204 status
  if (req.method === 'OPTIONS') {
    console.log('Returning CORS preflight response');
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Get client IP for rate limiting - check multiple headers
  const clientIp = req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown';

  // Check rate limit
  if (!checkRateLimit(clientIp)) {
    console.warn(`Rate limit exceeded for IP: ${clientIp}`);
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' },
    });
  }

  try {
    const rawBody = await req.text();
    console.log(`Body received (${rawBody.length} bytes)`);

    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('Failed to parse body as JSON:', parseError);
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { site_id, url, referrer, event_name = 'pageview', properties = {}, skip_origin_check = false, language: bodyLanguage } = body;

    // Validate required fields
    if (!site_id) {
      return new Response(JSON.stringify({ error: 'site_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate site_id format (should be a reasonable length)
    if (typeof site_id !== 'string' || site_id.length > 50) {
      return new Response(JSON.stringify({ error: 'Invalid site_id format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate URL length
    if (url && (typeof url !== 'string' || url.length > MAX_URL_LENGTH)) {
      return new Response(JSON.stringify({ error: 'URL too long (max 2000 chars)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate event_name
    if (event_name && (typeof event_name !== 'string' || event_name.length > MAX_EVENT_NAME_LENGTH)) {
      return new Response(JSON.stringify({ error: 'Event name too long (max 100 chars)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate referrer length
    if (referrer && (typeof referrer !== 'string' || referrer.length > MAX_URL_LENGTH)) {
      return new Response(JSON.stringify({ error: 'Referrer too long (max 2000 chars)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate properties size
    if (properties) {
      const propsString = JSON.stringify(properties);
      if (propsString.length > MAX_PROPERTIES_SIZE) {
        return new Response(JSON.stringify({ error: 'Properties too large (max 10KB)' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Get headers for geo and user agent
    const userAgent = req.headers.get('user-agent') || '';

    // Extract geo data from multiple header sources using helper
    const location = getLocationFromHeaders(req.headers);
    let geoCountry = location?.country || null;
    let geoCity = location?.city || null;

    // Extract language: prefer client-side (navigator.language) then fallback to header
    const headerLanguage = extractLanguage(req);
    const primaryLanguage = bodyLanguage || headerLanguage;

    // If no geo data found (e.g. localhost or direct access), try database lookup
    // only if clientIp is available and not localhost/private
    if (!geoCountry && clientIp && clientIp !== 'unknown' && !clientIp.startsWith('127.') && !clientIp.startsWith('192.168.') && !clientIp.startsWith('10.')) {
      try {
        console.log(`No geo headers found for IP ${clientIp}, attempting database lookup...`);
        // Create Supabase client for geo lookup (using service role for RLS bypass)
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const geoSupabase = createClient(supabaseUrl, supabaseServiceKey);
        
        const { data: geoData, error: geoError } = await geoSupabase.rpc('lookup_geoip', { 
          ip_address: clientIp 
        });
        
        if (geoError) {
          console.warn('GeoIP lookup RPC error:', geoError.message);
        } else if (geoData && geoData.length > 0) {
          geoCountry = geoData[0].country || null;
          geoCity = geoData[0].city || null;
          console.log('Database geo lookup successful:', { geoCountry, geoCity });
        } else {
          console.log('No geo data found in database for IP:', clientIp);
        }
      } catch (e) {
        console.warn('Database geo lookup failed:', e);
      }
    }

    // Log extracted data for debugging
    console.log(`Geo data: country=${geoCountry}, city=${geoCity}, language=${primaryLanguage}`);

    // Parse user agent
    const { browser, os, device_type } = parseUserAgent(userAgent);

    // Get request origin for validation
    const reqOrigin = req.headers.get('origin');

    // Generate visitor and session IDs (now async with crypto)
    const visitor_id = await generateVisitorId(clientIp, userAgent);
    const session_id = body.session_id || `${visitor_id}-${Date.now()}`;

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // First verify the site exists and get domain for origin validation
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('id, domain')
      .eq('tracking_id', site_id)
      .maybeSingle();

    if (siteError) {
      // Log only error code, not full details to prevent schema leakage
      console.error('Site verification failed', { code: siteError?.code, hint: siteError?.hint });
      return new Response(JSON.stringify({ error: 'Database error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!site) {
      return new Response(JSON.stringify({ error: 'Invalid site_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate origin matches site domain (if domain is configured and origin is present)
    // Skip origin check for:
    // - Test events (test_connection)
    // - Explicit bypass flag (for development)
    // - sendBeacon requests (may not have origin header)
    // - When no origin header is present (server-side or sendBeacon)
    const isTestEvent = event_name === 'test_connection';
    const shouldValidateOrigin = reqOrigin && site.domain && !skip_origin_check && !isTestEvent;

    if (shouldValidateOrigin) {
      try {
        const originHost = new URL(reqOrigin).hostname.toLowerCase();
        // Clean up the domain - remove protocol and www prefix
        let siteDomain = site.domain.toLowerCase()
          .replace(/^(https?:\/\/)/i, '')
          .replace(/^www\./i, '')
          .replace(/\/.*$/, '') // Remove any path
          .trim();

        // Check if origin matches the configured domain (with or without www)
        const isValidOrigin = originHost === siteDomain ||
          originHost === `www.${siteDomain}` ||
          originHost.endsWith(`.${siteDomain}`) ||
          siteDomain.includes(originHost) || // Handle subdomain cases
          originHost.includes('lovable.app') || // Allow Lovable preview domains
          originHost.includes('localhost'); // Allow localhost for development

        if (!isValidOrigin) {
          console.warn(`Origin mismatch: ${originHost} vs ${siteDomain} for site ${site_id}`);
          // Log but allow for now - strict mode can be enabled later
          // This allows tracking to work while users set up their domains
          console.log(`Allowing request despite origin mismatch for development convenience`);
        }
      } catch (e) {
        // If URL parsing fails, log but allow (could be server-side request)
        console.warn(`Could not parse origin: ${reqOrigin}`, e);
      }
    } else if (!reqOrigin) {
      // sendBeacon requests may not include origin header - this is normal
      console.log(`No origin header present for ${event_name} event - likely sendBeacon`);
    }

    // Insert the event
    const { error: insertError } = await supabase
      .from('events')
      .insert({
        site_id: site.id,
        event_name,
        url,
        referrer,
        visitor_id,
        session_id,
        browser,
        os,
        device_type,
        country: geoCountry,
        city: geoCity,
        language: primaryLanguage,
        properties,
      });

    if (insertError) {
      // Log only error code, not full details to prevent schema leakage
      console.error('Event insert failed', { code: insertError?.code, hint: insertError?.hint });
      return new Response(JSON.stringify({ error: 'Failed to record event' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Note: Usage tracking is handled by the frontend useUsage hook
    // which counts events directly for simplicity and accuracy

    console.log(`Event recorded: ${event_name} for site ${site_id}, geo: ${geoCountry}/${geoCity}, lang: ${primaryLanguage}`);

    // Return success with minimal response
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
