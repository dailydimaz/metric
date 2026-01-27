import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple XML builder for SP metadata
function buildSpMetadata(entityId: string, acsUrl: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata" entityID="${entityId}">
  <SPSSODescriptor AuthnRequestsSigned="false" WantAssertionsSigned="true" protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</NameIDFormat>
    <AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${acsUrl}" index="0" isDefault="true"/>
  </SPSSODescriptor>
</EntityDescriptor>`;
}

// Simple SAML AuthnRequest builder
function buildAuthnRequest(issuer: string, acsUrl: string, destination: string): string {
  const id = `_${crypto.randomUUID()}`;
  const issueInstant = new Date().toISOString();
  
  const request = `<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="${id}" Version="2.0" IssueInstant="${issueInstant}" Destination="${destination}" AssertionConsumerServiceURL="${acsUrl}" ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">
  <saml:Issuer>${issuer}</saml:Issuer>
  <samlp:NameIDPolicy Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress" AllowCreate="true"/>
</samlp:AuthnRequest>`;

  return request;
}

// Parse SAML Response (simplified - production would use proper XML parsing)
function parseSamlResponse(samlResponse: string): { email: string; nameId: string; attributes: Record<string, string> } | null {
  try {
    // Decode base64
    const decoded = atob(samlResponse);
    
    // Extract email from NameID or attributes (simplified parsing)
    const nameIdMatch = decoded.match(/<saml:NameID[^>]*>([^<]+)<\/saml:NameID>/);
    const emailAttrMatch = decoded.match(/<saml:Attribute Name="(?:email|Email|mail|http:\/\/schemas\.xmlsoap\.org\/ws\/2005\/05\/identity\/claims\/emailaddress)"[^>]*>\s*<saml:AttributeValue[^>]*>([^<]+)<\/saml:AttributeValue>/i);
    
    const nameId = nameIdMatch?.[1] || "";
    const email = emailAttrMatch?.[1] || nameId;
    
    if (!email || !email.includes("@")) {
      console.error("No valid email found in SAML response");
      return null;
    }
    
    // Extract other attributes
    const attributes: Record<string, string> = {};
    const attrRegex = /<saml:Attribute Name="([^"]+)"[^>]*>\s*<saml:AttributeValue[^>]*>([^<]+)<\/saml:AttributeValue>/g;
    let match;
    while ((match = attrRegex.exec(decoded)) !== null) {
      attributes[match[1]] = match[2];
    }
    
    return { email, nameId, attributes };
  } catch (error) {
    console.error("Error parsing SAML response:", error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  
  // Expected paths: /sso-saml/metadata/:providerId, /sso-saml/login/:providerId, /sso-saml/acs/:providerId
  const action = pathParts[1]; // metadata, login, or acs
  const providerId = pathParts[2];

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const appUrl = Deno.env.get("APP_URL") || "https://mmmetric.lovable.app";
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    if (!providerId) {
      return new Response(JSON.stringify({ error: "Provider ID required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch provider configuration
    const { data: provider, error: providerError } = await supabase
      .from("sso_providers")
      .select("*")
      .eq("id", providerId)
      .single();

    if (providerError || !provider) {
      console.error("Provider not found:", providerError);
      return new Response(JSON.stringify({ error: "SSO provider not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const entityId = `${supabaseUrl}/functions/v1/sso-saml/metadata/${providerId}`;
    const acsUrl = `${supabaseUrl}/functions/v1/sso-saml/acs/${providerId}`;

    switch (action) {
      case "metadata": {
        // Return SP metadata XML
        const metadata = buildSpMetadata(entityId, acsUrl);
        return new Response(metadata, {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/xml",
          },
        });
      }

      case "login": {
        // Initiate SSO login - redirect to IdP
        if (!provider.is_enabled) {
          return new Response(JSON.stringify({ error: "SSO is not enabled for this provider" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (!provider.entry_point) {
          return new Response(JSON.stringify({ error: "IdP SSO URL not configured" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const authnRequest = buildAuthnRequest(entityId, acsUrl, provider.entry_point);
        const encodedRequest = btoa(authnRequest);
        
        // Redirect to IdP with SAML request
        const redirectUrl = new URL(provider.entry_point);
        redirectUrl.searchParams.set("SAMLRequest", encodedRequest);
        redirectUrl.searchParams.set("RelayState", appUrl);

        return new Response(null, {
          status: 302,
          headers: {
            ...corsHeaders,
            "Location": redirectUrl.toString(),
          },
        });
      }

      case "acs": {
        // Assertion Consumer Service - handle IdP response
        if (req.method !== "POST") {
          return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const formData = await req.formData();
        const samlResponse = formData.get("SAMLResponse") as string;
        const _relayState = (formData.get("RelayState") as string) || appUrl;

        if (!samlResponse) {
          return new Response(JSON.stringify({ error: "No SAML response received" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Parse SAML response
        const parsedResponse = parseSamlResponse(samlResponse);
        if (!parsedResponse) {
          console.error("Failed to parse SAML response");
          return new Response(null, {
            status: 302,
            headers: {
              ...corsHeaders,
              "Location": `${appUrl}/auth?error=sso_failed&message=Invalid SAML response`,
            },
          });
        }

        const { email, nameId: _nameId, attributes } = parsedResponse;
        console.log("SSO login for email:", email);

        // Verify email domain matches provider
        const emailDomain = email.split("@")[1]?.toLowerCase();
        if (emailDomain !== provider.domain.toLowerCase()) {
          console.error("Email domain mismatch:", emailDomain, "vs", provider.domain);
          return new Response(null, {
            status: 302,
            headers: {
              ...corsHeaders,
              "Location": `${appUrl}/auth?error=sso_failed&message=Email domain not allowed`,
            },
          });
        }

        // Check if user exists or create one
        let userId: string;
        
        // List users and find by email
        const { data: userList } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const existingUser = userList?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
        
        if (existingUser) {
          userId = existingUser.id;
          console.log("Existing user found:", userId);
        } else {
          // Create new user via SSO
          const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email,
            email_confirm: true,
            user_metadata: {
              sso_provider: provider.provider_type,
              sso_domain: provider.domain,
              full_name: attributes["displayName"] || attributes["name"] || email.split("@")[0],
            },
          });

          if (createError || !newUser?.user) {
            console.error("Error creating user:", createError);
            return new Response(null, {
              status: 302,
              headers: {
                ...corsHeaders,
                "Location": `${appUrl}/auth?error=sso_failed&message=Failed to create user`,
              },
            });
          }
          
          userId = newUser.user.id;
          console.log("New user created:", userId);

          // Create profile for new user
          await supabase.from("profiles").insert({
            id: userId,
            email,
            full_name: attributes["displayName"] || attributes["name"] || null,
          });
        }

        // Generate a magic link for the user to complete sign-in
        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
          type: "magiclink",
          email,
          options: {
            redirectTo: `${appUrl}/dashboard`,
          },
        });

        if (linkError || !linkData?.properties?.hashed_token) {
          console.error("Error generating magic link:", linkError);
          return new Response(null, {
            status: 302,
            headers: {
              ...corsHeaders,
              "Location": `${appUrl}/auth?error=sso_failed&message=Failed to generate session`,
            },
          });
        }

        // Record SSO session for audit
        await supabase.from("login_history").insert({
          user_id: userId,
          success: true,
          browser: req.headers.get("user-agent") || "SSO",
          country: attributes["country"] || null,
        });

        // Redirect to complete auth
        const tokenHash = linkData.properties.hashed_token;
        const authUrl = `${supabaseUrl}/auth/v1/verify?token=${tokenHash}&type=magiclink&redirect_to=${encodeURIComponent(`${appUrl}/dashboard`)}`;

        return new Response(null, {
          status: 302,
          headers: {
            ...corsHeaders,
            "Location": authUrl,
          },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error: unknown) {
    console.error("SSO SAML Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: "Internal server error", details: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
