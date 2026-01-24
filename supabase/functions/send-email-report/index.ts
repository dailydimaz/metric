import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailReportRequest {
  user_id?: string;
  report_type: "weekly" | "monthly";
  force_all?: boolean;
}

interface SiteStats {
  site_name: string;
  domain: string;
  pageviews: number;
  visitors: number;
  bounce_rate: number;
  top_pages: { url: string; views: number }[];
  pageviews_change: number;
  visitors_change: number;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function getChangeIcon(change: number): string {
  if (change > 0) return "↑";
  if (change < 0) return "↓";
  return "→";
}

function getChangeColor(change: number): string {
  if (change > 0) return "#10b981";
  if (change < 0) return "#ef4444";
  return "#6b7280";
}

function generateEmailHtml(
  reportType: "weekly" | "monthly",
  userName: string,
  siteStats: SiteStats[]
): string {
  const periodLabel = reportType === "weekly" ? "This Week" : "This Month";
  const comparisonLabel = reportType === "weekly" ? "vs last week" : "vs last month";

  const siteSections = siteStats.map(site => `
    <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
      <h3 style="margin: 0 0 4px 0; font-size: 18px; color: #111827;">${site.site_name}</h3>
      <p style="margin: 0 0 16px 0; font-size: 14px; color: #6b7280;">${site.domain || 'No domain'}</p>
      
      <div style="display: flex; gap: 16px; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 120px;">
          <p style="margin: 0; font-size: 28px; font-weight: bold; color: #111827;">${formatNumber(site.pageviews)}</p>
          <p style="margin: 0; font-size: 12px; color: #6b7280;">
            Pageviews 
            <span style="color: ${getChangeColor(site.pageviews_change)};">
              ${getChangeIcon(site.pageviews_change)} ${Math.abs(site.pageviews_change).toFixed(1)}%
            </span>
          </p>
        </div>
        <div style="flex: 1; min-width: 120px;">
          <p style="margin: 0; font-size: 28px; font-weight: bold; color: #111827;">${formatNumber(site.visitors)}</p>
          <p style="margin: 0; font-size: 12px; color: #6b7280;">
            Visitors
            <span style="color: ${getChangeColor(site.visitors_change)};">
              ${getChangeIcon(site.visitors_change)} ${Math.abs(site.visitors_change).toFixed(1)}%
            </span>
          </p>
        </div>
        <div style="flex: 1; min-width: 120px;">
          <p style="margin: 0; font-size: 28px; font-weight: bold; color: #111827;">${site.bounce_rate.toFixed(1)}%</p>
          <p style="margin: 0; font-size: 12px; color: #6b7280;">Bounce Rate</p>
        </div>
      </div>

      ${site.top_pages.length > 0 ? `
        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #374151;">Top Pages</p>
          ${site.top_pages.slice(0, 5).map(page => `
            <div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px;">
              <span style="color: #4b5563; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 70%;">${page.url}</span>
              <span style="color: #6b7280; font-weight: 500;">${formatNumber(page.views)}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your ${periodLabel} Analytics Report</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="margin: 0 0 8px 0; font-size: 24px; color: #111827;">📊 ${periodLabel}'s Analytics</h1>
        <p style="margin: 0; color: #6b7280; font-size: 14px;">Hi ${userName}, here's how your sites performed ${comparisonLabel}</p>
      </div>

      ${siteStats.length > 0 ? siteSections : `
        <div style="text-align: center; padding: 40px 0; color: #6b7280;">
          <p>No analytics data available for this period.</p>
        </div>
      `}

      <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
        <a href="https://mmmetric.lovable.app/dashboard" 
           style="display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 500;">
          View Full Dashboard
        </a>
      </div>
    </div>

    <div style="text-align: center; margin-top: 24px; color: #9ca3af; font-size: 12px;">
      <p>You're receiving this because you have email reports enabled.</p>
      <p>
        <a href="https://mmmetric.lovable.app/settings" style="color: #6b7280;">Manage preferences</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

// deno-lint-ignore no-explicit-any
async function getSiteStatsForUser(
  supabase: any,
  userId: string,
  reportType: "weekly" | "monthly"
): Promise<SiteStats[]> {
  // Get user's sites
  const { data: sites, error: sitesError } = await supabase
    .from("sites")
    .select("id, name, domain")
    .eq("user_id", userId);

  if (sitesError || !sites || sites.length === 0) {
    console.log("No sites found for user:", userId, sitesError?.message);
    return [];
  }

  const now = new Date();
  const daysBack = reportType === "weekly" ? 7 : 30;
  
  const endDate = new Date(now);
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - daysBack);
  
  const prevEndDate = new Date(startDate);
  const prevStartDate = new Date(startDate);
  prevStartDate.setDate(prevStartDate.getDate() - daysBack);

  // deno-lint-ignore no-explicit-any
  const statsPromises = sites.map(async (site: any) => {
    try {
      // Get stats from RPC
      const { data: stats } = await supabase.rpc("get_site_stats", {
        _site_id: site.id,
        _start_date: startDate.toISOString(),
        _end_date: endDate.toISOString(),
        _prev_start_date: prevStartDate.toISOString(),
        _prev_end_date: prevEndDate.toISOString(),
        _filters: {},
      });

      // Get top pages
      const { data: topPages } = await supabase.rpc("get_top_pages", {
        _site_id: site.id,
        _start_date: startDate.toISOString(),
        _end_date: endDate.toISOString(),
        _limit: 5,
        _filters: {},
      });

      const stat = stats?.[0] || {};
      
      return {
        site_name: site.name,
        domain: site.domain || "",
        pageviews: Number(stat.total_pageviews) || 0,
        visitors: Number(stat.unique_visitors) || 0,
        bounce_rate: Number(stat.bounce_rate) || 0,
        pageviews_change: Number(stat.pageviews_change) || 0,
        visitors_change: Number(stat.visitors_change) || 0,
        // deno-lint-ignore no-explicit-any
        top_pages: (topPages || []).map((p: any) => ({
          url: p.url,
          views: Number(p.pageviews) || 0,
        })),
      };
    } catch (err) {
      console.error("Error fetching stats for site:", site.id, err);
      return {
        site_name: site.name,
        domain: site.domain || "",
        pageviews: 0,
        visitors: 0,
        bounce_rate: 0,
        pageviews_change: 0,
        visitors_change: 0,
        top_pages: [],
      };
    }
  });

  return Promise.all(statsPromises);
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body: EmailReportRequest = await req.json();
    const { user_id, report_type, force_all } = body;

    console.log("Email report request:", { user_id, report_type, force_all });

    // deno-lint-ignore no-explicit-any
    let usersToEmail: { id: string; email: string; full_name: string | null }[] = [];

    if (force_all) {
      // Get all users who have weekly_digest enabled
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .eq("weekly_digest", true);

      if (profilesError) {
        throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
      }

      // deno-lint-ignore no-explicit-any
      usersToEmail = (profiles || []).filter((p: any) => p.email);
      console.log(`Found ${usersToEmail.length} users with weekly_digest enabled`);
    } else if (user_id) {
      // Single user
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .eq("id", user_id)
        .single();

      if (profileError || !profile?.email) {
        throw new Error("User not found or no email");
      }

      usersToEmail = [profile];
    } else {
      throw new Error("Either user_id or force_all must be provided");
    }

    const results: { email: string; success: boolean; error?: string }[] = [];

    for (const user of usersToEmail) {
      try {
        // Get stats for this user
        const siteStats = await getSiteStatsForUser(supabase, user.id, report_type);

        // Generate email
        const html = generateEmailHtml(
          report_type,
          user.full_name || "there",
          siteStats
        );

        // Send email
        const subject = report_type === "weekly"
          ? "📊 Your Weekly Analytics Report"
          : "📊 Your Monthly Analytics Report";

        const { error: emailError } = await resend.emails.send({
          from: "mmmetric <reports@mmmetric.lovable.app>",
          to: [user.email],
          subject,
          html,
        });

        if (emailError) {
          console.error("Failed to send email to:", user.email, emailError);
          results.push({ email: user.email, success: false, error: String(emailError) });
        } else {
          console.log("Successfully sent email to:", user.email);
          results.push({ email: user.email, success: true });
        }
      } catch (err) {
        console.error("Error processing user:", user.id, err);
        results.push({ email: user.email, success: false, error: String(err) });
      }
    }

    const successCount = results.filter(r => r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        failed: results.length - successCount,
        results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("Error in send-email-report:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
