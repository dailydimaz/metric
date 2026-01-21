import { useState, useRef } from "react";
import { Upload, FileJson, Loader2, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useDataImport } from "@/hooks/useDataImport";
import { useSites } from "@/hooks/useSites";
import { useSubscription } from "@/hooks/useSubscription";
import { isBillingEnabled } from "@/lib/billing";
import { formatDistanceToNow } from "date-fns";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getStatusIcon(status: string) {
  switch (status) {
    case "completed":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-destructive" />;
    case "processing":
      return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "completed":
      return <Badge variant="default" className="bg-green-500">Completed</Badge>;
    case "failed":
      return <Badge variant="destructive">Failed</Badge>;
    case "processing":
      return <Badge variant="secondary">Processing</Badge>;
    default:
      return <Badge variant="outline">Pending</Badge>;
  }
}

export function DataImport() {
  const { sites } = useSites();
  const { subscription } = useSubscription();
  const { importJobs, uploading, startImport } = useDataImport();
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Only show for cloud users
  if (!isBillingEnabled()) {
    return null;
  }

  // Check if user has paid subscription
  const isPaidUser = subscription && subscription.plan !== "free";

  const handleFileSelect = async (file: File) => {
    if (!selectedSiteId) {
      return;
    }

    if (!file.name.endsWith(".json")) {
      return;
    }

    startImport.mutate({ file, targetSiteId: selectedSiteId });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (!isPaidUser || !selectedSiteId) return;

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Data Import
        </CardTitle>
        <CardDescription>
          Import analytics data from a self-hosted instance or another export
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isPaidUser ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Paid Feature</AlertTitle>
            <AlertDescription>
              Data Import is available on Pro, Business, and higher plans.
              Upgrade your subscription to import your analytics data.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Site Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Site</label>
              <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a site to import data into" />
                </SelectTrigger>
                <SelectContent>
                  {sites?.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name} {site.domain && `(${site.domain})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Events, goals, and funnels will be imported to this site
              </p>
            </div>

            {/* Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25"
              } ${!selectedSiteId || uploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => {
                if (selectedSiteId && !uploading) {
                  fileInputRef.current?.click();
                }
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleInputChange}
                className="hidden"
                disabled={!selectedSiteId || uploading}
              />
              
              {uploading ? (
                <div className="space-y-2">
                  <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary" />
                  <p className="text-sm font-medium">Processing file...</p>
                </div>
              ) : (
                <>
                  <FileJson className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm font-medium mb-1">
                    Drop your export file here, or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports JSON export files from mmmetric self-hosted
                  </p>
                </>
              )}
            </div>

            {/* Import Instructions */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-medium">How to export from self-hosted</h4>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Log into your self-hosted mmmetric instance</li>
                <li>Go to Settings → Data Export</li>
                <li>Click "Export as JSON" to download your data</li>
                <li>Upload the JSON file here</li>
              </ol>
            </div>

            {/* Import History */}
            {importJobs && importJobs.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Recent Imports</h4>
                <div className="space-y-2">
                  {importJobs.map((job) => (
                    <div
                      key={job.id}
                      className="border rounded-lg p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(job.status)}
                          <span className="text-sm font-medium truncate max-w-[200px]">
                            {job.file_name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({formatBytes(job.file_size)})
                          </span>
                        </div>
                        {getStatusBadge(job.status)}
                      </div>

                      {job.status === "processing" && job.total_records > 0 && (
                        <div className="space-y-1">
                          <Progress
                            value={
                              (job.processed_records / job.total_records) * 100
                            }
                          />
                          <p className="text-xs text-muted-foreground">
                            {job.processed_records.toLocaleString()} /{" "}
                            {job.total_records.toLocaleString()} records
                          </p>
                        </div>
                      )}

                      {job.status === "completed" && (
                        <p className="text-xs text-muted-foreground">
                          Imported {job.processed_records.toLocaleString()} records
                          {job.failed_records > 0 && (
                            <span className="text-destructive">
                              {" "}
                              ({job.failed_records} failed)
                            </span>
                          )}
                        </p>
                      )}

                      {job.status === "failed" && job.error_message && (
                        <p className="text-xs text-destructive">
                          Error: {job.error_message}
                        </p>
                      )}

                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(job.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
