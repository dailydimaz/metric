import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";

interface ImportJob {
  id: string;
  status: string;
  total_records: number;
  processed_records: number;
  failed_records: number;
  created_at: string;
}

interface MigrationProgressProps {
  job: ImportJob | null;
}

export function MigrationProgress({ job }: MigrationProgressProps) {
  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Clock className="h-12 w-12 mb-4 opacity-50" />
        <p>Waiting to start import...</p>
      </div>
    );
  }

  const progress = job.total_records > 0
    ? Math.round((job.processed_records / job.total_records) * 100)
    : 0;

  const getStatusIcon = () => {
    switch (job.status) {
      case "completed":
        return <CheckCircle2 className="h-12 w-12 text-green-500" />;
      case "failed":
        return <XCircle className="h-12 w-12 text-destructive" />;
      case "processing":
        return <Loader2 className="h-12 w-12 text-primary animate-spin" />;
      default:
        return <Clock className="h-12 w-12 text-muted-foreground" />;
    }
  };

  const getStatusBadge = () => {
    switch (job.status) {
      case "completed":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Completed</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "processing":
        return <Badge className="bg-primary/10 text-primary border-primary/20">Processing</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center py-8">
        {getStatusIcon()}
        <div className="mt-4">{getStatusBadge()}</div>
      </div>

      {job.status === "processing" && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            {job.processed_records.toLocaleString()} of {job.total_records.toLocaleString()} records processed
          </p>
        </div>
      )}

      {job.status === "completed" && (
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-green-600">Migration Complete!</p>
          <p className="text-sm text-muted-foreground">
            Successfully imported {job.processed_records.toLocaleString()} records
          </p>
          {job.failed_records > 0 && (
            <p className="text-sm text-amber-600">
              {job.failed_records} records could not be imported
            </p>
          )}
        </div>
      )}

      {job.status === "failed" && (
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-destructive">Migration Failed</p>
          <p className="text-sm text-muted-foreground">
            Please try again or contact support if the issue persists.
          </p>
        </div>
      )}
    </div>
  );
}
