import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Download, Loader2, FileJson, FileText, Database, Cloud, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { isBillingEnabled } from "@/lib/billing";

type ExportFormat = "json" | "csv";

interface ExportSection {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

const exportSections: ExportSection[] = [
  {
    id: "profile",
    name: "Profile Data",
    description: "Your account information and settings",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    id: "sites",
    name: "Sites",
    description: "All your tracked websites",
    icon: <Database className="h-4 w-4" />,
  },
  {
    id: "events",
    name: "Analytics Events",
    description: "All tracked events and pageviews",
    icon: <Database className="h-4 w-4" />,
  },
  {
    id: "goals",
    name: "Goals",
    description: "Your conversion goals",
    icon: <Database className="h-4 w-4" />,
  },
  {
    id: "funnels",
    name: "Funnels",
    description: "Your funnel configurations",
    icon: <Database className="h-4 w-4" />,
  },
];

export function DataExport() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentSection, setCurrentSection] = useState("");

  // Only show data export for self-hosted users (to migrate to cloud)
  if (isBillingEnabled()) {
    return null;
  }

  const exportData = async (format: ExportFormat) => {
    if (!user) return;
    
    setExporting(true);
    setProgress(0);
    
    try {
      const exportedData: Record<string, any> = {
        exported_at: new Date().toISOString(),
        user_id: user.id,
        user_email: user.email,
      };

      // Export profile
      setCurrentSection("Profile Data");
      setProgress(10);
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      exportedData.profile = profile;

      // Export sites
      setCurrentSection("Sites");
      setProgress(30);
      const { data: sites } = await supabase
        .from("sites")
        .select("*")
        .eq("user_id", user.id);
      exportedData.sites = sites || [];

      if (sites && sites.length > 0) {
        const siteIds = sites.map(s => s.id);

        // Export events (limited to recent 10000)
        setCurrentSection("Analytics Events");
        setProgress(50);
        const { data: events } = await supabase
          .from("events")
          .select("*")
          .in("site_id", siteIds)
          .order("created_at", { ascending: false })
          .limit(10000);
        exportedData.events = events || [];

        // Export goals
        setCurrentSection("Goals");
        setProgress(70);
        const { data: goals } = await supabase
          .from("goals")
          .select("*")
          .in("site_id", siteIds);
        exportedData.goals = goals || [];

        // Export funnels
        setCurrentSection("Funnels");
        setProgress(85);
        const { data: funnels } = await supabase
          .from("funnels")
          .select("*")
          .in("site_id", siteIds);
        exportedData.funnels = funnels || [];
      }

      // Export login history
      setCurrentSection("Login History");
      setProgress(95);
      const { data: loginHistory } = await supabase
        .from("login_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      exportedData.login_history = loginHistory || [];

      setProgress(100);

      // Download file
      if (format === "json") {
        downloadJSON(exportedData);
      } else {
        downloadCSV(exportedData);
      }

      toast({
        title: "Export complete",
        description: "Your data has been downloaded",
      });
    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error.message || "Failed to export data",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
      setProgress(0);
      setCurrentSection("");
    }
  };

  const downloadJSON = (data: Record<string, any>) => {
    const content = JSON.stringify(data, null, 2);
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `metric-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCSV = (data: Record<string, any>) => {
    // Create separate CSV for each section
    const zip: string[] = [];
    
    Object.entries(data).forEach(([key, value]) => {
      if (Array.isArray(value) && value.length > 0) {
        const headers = Object.keys(value[0]).join(",");
        const rows = value.map(row => 
          Object.values(row).map(v => 
            typeof v === "string" ? `"${v.replace(/"/g, '""')}"` : v
          ).join(",")
        ).join("\n");
        zip.push(`--- ${key.toUpperCase()} ---\n${headers}\n${rows}\n\n`);
      } else if (typeof value === "object" && value !== null) {
        const headers = Object.keys(value).join(",");
        const row = Object.values(value).map(v => 
          typeof v === "string" ? `"${v.replace(/"/g, '""')}"` : v
        ).join(",");
        zip.push(`--- ${key.toUpperCase()} ---\n${headers}\n${row}\n\n`);
      }
    });

    const content = zip.join("");
    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `metric-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Data Export
        </CardTitle>
        <CardDescription>
          Download all your data for backup or GDPR compliance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Your export will include:
          </p>
          <ul className="space-y-2">
            {exportSections.map((section) => (
              <li key={section.id} className="flex items-center gap-2 text-sm">
                {section.icon}
                <span className="font-medium">{section.name}</span>
                <span className="text-muted-foreground">- {section.description}</span>
              </li>
            ))}
          </ul>
        </div>

        {exporting && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Exporting {currentSection}...
              </span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => exportData("json")}
            disabled={exporting}
            className="flex-1"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileJson className="h-4 w-4 mr-2" />
            )}
            Export as JSON
          </Button>
          <Button
            variant="outline"
            onClick={() => exportData("csv")}
            disabled={exporting}
            className="flex-1"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            Export as CSV
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Note: Large datasets may take a moment to export. Events are limited to the most recent 10,000 records.
        </p>

        {/* Migration CTA */}
        <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Cloud className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Ready for the Cloud?</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Export your data and use our migration wizard to seamlessly transfer to mmmetric Cloud.
          </p>
          <Button variant="outline" size="sm" asChild>
            <a href="https://mmmetric.lovable.app/migrate" target="_blank" rel="noopener noreferrer">
              Start Migration <ArrowRight className="h-3 w-3 ml-1" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
