import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Upload, Shield, Zap, Database, Cloud, ArrowRight, FileJson } from "lucide-react";
import { MigrationStep } from "./MigrationStep";
import { ExportPreview } from "./ExportPreview";
import { MigrationProgress } from "./MigrationProgress";
import { useAuth } from "@/hooks/useAuth";
import { useSites } from "@/hooks/useSites";
import { useDataImport } from "@/hooks/useDataImport";
import { SignInForm } from "@/components/auth/SignInForm";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { cn } from "@/lib/utils";

interface ExportData {
  exportedAt?: string;
  version?: string;
  profile?: Record<string, unknown>;
  sites?: Array<Record<string, unknown>>;
  events?: Array<Record<string, unknown>>;
  goals?: Array<Record<string, unknown>>;
  funnels?: Array<Record<string, unknown>>;
}

const STEPS = [
  { id: 1, title: "Welcome" },
  { id: 2, title: "Upload" },
  { id: 3, title: "Account" },
  { id: 4, title: "Import" },
];

export function MigrationWizard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { sites } = useSites();
  const { importJobs, startImport, uploading } = useDataImport();

  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [exportData, setExportData] = useState<ExportData | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const [dragActive, setDragActive] = useState(false);

  // Get the latest import job for tracking progress
  const latestJob = importJobs?.[0] ?? null;

  const handleFileUpload = useCallback(async (uploadedFile: File) => {
    setFile(uploadedFile);
    setParseError(null);
    setExportData(null);

    try {
      const text = await uploadedFile.text();
      const data = JSON.parse(text) as ExportData;

      // Basic validation
      if (!data || typeof data !== "object") {
        throw new Error("Invalid export file format");
      }

      setExportData(data);
    } catch (error) {
      setParseError(
        error instanceof SyntaxError
          ? "Invalid JSON file. Please upload a valid mmmetric export file."
          : "Could not parse the export file. Please ensure it's a valid mmmetric export."
      );
    }
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, [handleFileUpload]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleStartImport = async () => {
    if (!file || !selectedSiteId) return;

    try {
      await startImport.mutateAsync({ file, targetSiteId: selectedSiteId });
    } catch {
      // Error handled by mutation
    }
  };

  const goToNext = () => {
    // Skip auth step if already logged in
    if (step === 2 && user) {
      setStep(4);
    } else {
      setStep((s) => Math.min(s + 1, 4));
    }
  };

  const goToBack = () => {
    // Skip auth step when going back if logged in
    if (step === 4 && user) {
      setStep(2);
    } else {
      setStep((s) => Math.max(s - 1, 1));
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((s, i) => (
        <div key={s.id} className="flex items-center">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
              step >= s.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            {step > s.id ? <CheckCircle2 className="h-4 w-4" /> : s.id}
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={cn(
                "w-12 h-0.5 mx-1",
                step > s.id ? "bg-primary" : "bg-muted"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <MigrationStep
      title="Migrate to mmmetric Cloud"
      description="Seamlessly transfer your self-hosted analytics data"
      onNext={goToNext}
      showBack={false}
      nextLabel="Get Started"
    >
      <div className="space-y-6">
        <p className="text-center text-muted-foreground">
          This wizard will guide you through migrating your analytics data from your
          self-hosted mmmetric instance to the cloud version.
        </p>

        <div className="grid md:grid-cols-3 gap-4">
          <Card className="bg-muted/30 border-border/50">
            <CardContent className="p-4 text-center">
              <Database className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="font-medium">Your Data</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Events, goals, funnels & sites
              </p>
            </CardContent>
          </Card>
          <Card className="bg-muted/30 border-border/50">
            <CardContent className="p-4 text-center">
              <Shield className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="font-medium">Secure Transfer</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Encrypted end-to-end
              </p>
            </CardContent>
          </Card>
          <Card className="bg-muted/30 border-border/50">
            <CardContent className="p-4 text-center">
              <Zap className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="font-medium">Quick Setup</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Usually under 5 minutes
              </p>
            </CardContent>
          </Card>
        </div>

        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            <strong>What you'll need:</strong> A JSON export file from your self-hosted instance.
            You can generate this from Settings → Data Export.
          </AlertDescription>
        </Alert>
      </div>
    </MigrationStep>
  );

  const renderStep2 = () => (
    <MigrationStep
      title="Upload Your Export"
      description="Upload the JSON file exported from your self-hosted instance"
      onNext={goToNext}
      onBack={goToBack}
      nextDisabled={!exportData}
      nextLabel={user ? "Start Import" : "Continue"}
    >
      <div className="space-y-6">
        <div
          className={cn(
            "border-2 border-dashed rounded-xl p-8 text-center transition-colors",
            dragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50",
            file && !parseError && "border-green-500 bg-green-500/5"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {file ? (
            <div className="space-y-2">
              <FileJson className="h-12 w-12 mx-auto text-primary" />
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFile(null);
                  setExportData(null);
                  setParseError(null);
                }}
              >
                Choose different file
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <p className="font-medium">Drag and drop your export file</p>
                <p className="text-sm text-muted-foreground">or click to browse</p>
              </div>
              <Label htmlFor="file-upload">
                <Input
                  id="file-upload"
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleInputChange}
                />
                <Button variant="outline" asChild>
                  <span>Select File</span>
                </Button>
              </Label>
            </div>
          )}
        </div>

        <ExportPreview data={exportData} error={parseError} />
      </div>
    </MigrationStep>
  );

  const renderStep3 = () => (
    <MigrationStep
      title="Create Your Account"
      description="Sign up or sign in to mmmetric Cloud"
      onBack={goToBack}
      showNext={false}
    >
      <div className="max-w-sm mx-auto">
        <div className="flex gap-2 mb-6">
          <Button
            variant={authMode === "signup" ? "default" : "outline"}
            className="flex-1"
            onClick={() => setAuthMode("signup")}
          >
            Sign Up
          </Button>
          <Button
            variant={authMode === "signin" ? "default" : "outline"}
            className="flex-1"
            onClick={() => setAuthMode("signin")}
          >
            Sign In
          </Button>
        </div>

        {/* Wrapper to hide the toggle mode links since we have tabs above */}
        <div className="[&_p:last-child]:hidden">

          {authMode === "signup" ? (
            <SignUpForm 
              onToggleMode={() => setAuthMode("signin")} 
              onSuccess={() => setStep(4)} 
            />
          ) : (
            <SignInForm 
              onToggleMode={() => setAuthMode("signup")} 
              onForgotPassword={() => window.open("/auth?mode=forgot", "_blank")}
              onSuccess={() => setStep(4)} 
            />
          )}
        </div>
      </div>
    </MigrationStep>
  );

  const renderStep4 = () => {
    const isImporting = latestJob?.status === "pending" || latestJob?.status === "processing";
    const isComplete = latestJob?.status === "completed";

    return (
      <MigrationStep
        title={isComplete ? "Migration Complete!" : "Import Your Data"}
        description={
          isComplete
            ? "Your analytics data has been successfully migrated"
            : "Select a target site and start the import"
        }
        onBack={!isImporting && !isComplete ? goToBack : undefined}
        showBack={!isImporting && !isComplete}
        showNext={isComplete}
        nextLabel="Go to Dashboard"
        onNext={() => navigate("/dashboard")}
      >
        {!isImporting && !latestJob ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Target Site</Label>
              <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a site to import data to" />
                </SelectTrigger>
                <SelectContent>
                  {sites?.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name} ({site.domain})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Events will be imported into this site's analytics
              </p>
            </div>

            {sites?.length === 0 && (
              <Alert>
                <AlertDescription>
                  You don't have any sites yet. Please create a site first from the dashboard.
                </AlertDescription>
              </Alert>
            )}

            <Button
              className="w-full"
              size="lg"
              onClick={handleStartImport}
              disabled={!selectedSiteId || uploading || !file}
            >
              {uploading ? (
                <>Uploading...</>
              ) : (
                <>
                  <Cloud className="h-4 w-4 mr-2" />
                  Start Migration
                </>
              )}
            </Button>
          </div>
        ) : (
          <MigrationProgress job={latestJob} />
        )}

        {isComplete && (
          <div className="mt-6 text-center">
            <Button onClick={() => navigate("/dashboard")} size="lg">
              Go to Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </MigrationStep>
    );
  };

  return (
    <div className="max-w-2xl mx-auto">
      {renderStepIndicator()}

      <Card className="border-border/50 shadow-xl">
        <CardContent className="p-8">
          <AnimatePresence mode="wait">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
