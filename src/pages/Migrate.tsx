import { Link } from "react-router-dom";
import { ArrowLeft, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MigrationWizard } from "@/components/migration";
import { isBillingEnabled } from "@/lib/billing";

export default function Migrate() {
  // Only show migration wizard in cloud mode
  if (!isBillingEnabled()) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Cloud className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Migration Wizard</h1>
          <p className="text-muted-foreground mb-6">
            This feature is only available on mmmetric Cloud. To migrate your self-hosted
            data, please visit the cloud version at{" "}
            <a
              href="https://mmmetric.lovable.app/migrate"
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              mmmetric.lovable.app/migrate
            </a>
          </p>
          <Button asChild>
            <Link to="/">Go Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Cloud className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold">mmmetric</span>
            </Link>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 lg:px-8 py-16">
        <MigrationWizard />
      </main>
    </div>
  );
}
