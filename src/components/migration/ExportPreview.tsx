import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Database, Flag, GitBranch, Globe } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ExportData {
  exportedAt?: string;
  version?: string;
  profile?: Record<string, unknown>;
  sites?: Array<Record<string, unknown>>;
  events?: Array<Record<string, unknown>>;
  goals?: Array<Record<string, unknown>>;
  funnels?: Array<Record<string, unknown>>;
}

interface ExportPreviewProps {
  data: ExportData | null;
  error?: string | null;
}

export function ExportPreview({ data, error }: ExportPreviewProps) {
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return null;
  }

  const stats = [
    {
      label: "Sites",
      value: data.sites?.length ?? 0,
      icon: Globe,
    },
    {
      label: "Events",
      value: data.events?.length ?? 0,
      icon: Database,
    },
    {
      label: "Goals",
      value: data.goals?.length ?? 0,
      icon: Flag,
    },
    {
      label: "Funnels",
      value: data.funnels?.length ?? 0,
      icon: GitBranch,
    },
  ];

  const hasData = stats.some((s) => s.value > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        <span>Valid export file detected</span>
        {data.exportedAt && (
          <Badge variant="secondary" className="ml-auto">
            Exported: {new Date(data.exportedAt).toLocaleDateString()}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-muted/50">
            <CardContent className="p-4 text-center">
              <stat.icon className="h-5 w-5 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!hasData && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This export file appears to be empty. Make sure you exported data from your self-hosted instance.
          </AlertDescription>
        </Alert>
      )}

      {(data.events?.length ?? 0) > 10000 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Large dataset detected ({data.events?.length?.toLocaleString()} events). Import may take several minutes.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
