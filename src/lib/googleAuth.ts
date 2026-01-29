import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

/**
 * Checks if the current domain is a Lovable platform domain (preview/project domains)
 * vs a custom domain (like mmmetric.lovable.app which is a published custom subdomain)
 */
function isLovablePlatformDomain(): boolean {
  const hostname = window.location.hostname;
  
  // These are the internal Lovable domains where auth-bridge works
  // Note: *.lovable.app subdomains that are custom (like mmmetric.lovable.app) 
  // are considered custom domains and need direct OAuth
  const platformPatterns = [
    /^.*-preview--.*\.lovable\.app$/,  // Preview URLs: id-preview--xxx.lovable.app
    /^.*\.lovableproject\.com$/,        // Project domains
    /^localhost$/,                       // Local development
  ];
  
  return platformPatterns.some(pattern => pattern.test(hostname));
}

/**
 * Validates that an OAuth URL is from a trusted provider
 */
function validateOAuthUrl(url: string): boolean {
  try {
    const oauthUrl = new URL(url);

    // Only allow http(s) URLs (block javascript:, data:, etc.)
    if (!['https:', 'http:'].includes(oauthUrl.protocol)) return false;

    // Provider endpoints
    const providerHosts = new Set(["accounts.google.com", "appleid.apple.com"]);
    if (providerHosts.has(oauthUrl.hostname)) return true;

    // OAuth initiation typically starts at our auth service endpoint (then redirects to provider).
    // Allow only known auth infrastructure hosts + known authorize paths.
    const allowedHostSuffixes = [
      ".supabase.co",
      ".supabase.com",
      ".lovable.app",
      ".lovableproject.com",
      ".lovable.dev",
    ];
    const hostOk = allowedHostSuffixes.some((suffix) => oauthUrl.hostname === suffix.slice(1) || oauthUrl.hostname.endsWith(suffix));
    if (!hostOk) return false;

    const allowedPaths = [
      "/auth/v1/authorize",
      "/~oauth/initiate",
    ];
    return allowedPaths.some((p) => oauthUrl.pathname === p || oauthUrl.pathname.startsWith(p + "/"));
  } catch {
    return false;
  }
}

export interface GoogleAuthResult {
  error?: Error | null;
  redirected?: boolean;
}

/**
 * Initiates Google OAuth sign-in, handling both Lovable platform domains
 * and custom domains appropriately
 */
export async function signInWithGoogle(redirectPath: string = "/"): Promise<GoogleAuthResult> {
  const redirectTo = `${window.location.origin}${redirectPath}`;
  
  // For Lovable platform domains, use the managed OAuth flow
  if (isLovablePlatformDomain()) {
    return lovable.auth.signInWithOAuth("google", {
      redirect_uri: redirectTo,
    });
  }
  
  // For custom domains, bypass auth-bridge by getting OAuth URL directly
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: true, // Critical: prevents automatic redirect by auth-bridge
    },
  });

  if (error) {
    return { error };
  }

  // Validate OAuth URL before redirect (security: prevent open redirect)
  if (data?.url) {
    if (!validateOAuthUrl(data.url)) {
      return { error: new Error("Invalid OAuth redirect URL") };
    }
    window.location.href = data.url; // Manual redirect
    return { redirected: true };
  }

  return { error: new Error("No OAuth URL received") };
}
