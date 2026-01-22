import { Github, Heart, Users, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OpenSource() {
  return (
    <section className="py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-sm font-medium mb-8">
            <Heart className="h-4 w-4 text-red-500" />
            <span>Open Source</span>
          </div>

          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Powered by{" "}
            <span className="text-primary">open source</span>
          </h2>

          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            mmmetric is proudly open source and MIT licensed. Thousands of developers
            worldwide can share and contribute to make analytics better for everyone.
          </p>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="bg-card border border-border rounded-xl">
              <div className="p-6 flex flex-col items-center">
                <Github className="h-6 w-6 text-primary mb-2" />
                <span className="text-2xl font-bold">100%</span>
                <span className="text-sm text-muted-foreground">Open Source</span>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl">
              <div className="p-6 flex flex-col items-center">
                <Users className="h-6 w-6 text-primary mb-2" />
                <span className="text-2xl font-bold">MIT</span>
                <span className="text-sm text-muted-foreground">Licensed</span>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl">
              <div className="p-6 flex flex-col items-center">
                <Star className="h-6 w-6 text-primary mb-2" />
                <span className="text-2xl font-bold">Self-host</span>
                <span className="text-sm text-muted-foreground">Your Data</span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="outline" asChild>
              <a
                href="https://github.com/dailydimaz/mmmetric"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="h-5 w-5 mr-2" />
                View on GitHub
              </a>
            </Button>
            <Button variant="ghost" asChild>
              <a
                href="https://github.com/dailydimaz/mmmetric/blob/main/CONTRIBUTING.md"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Heart className="h-5 w-5 mr-2" />
                Contribute
              </a>
            </Button>
          </div>

          {/* Migration CTA */}
          <div className="mt-8 p-4 rounded-lg bg-primary/5 border border-primary/20 max-w-md mx-auto">
            <p className="text-sm text-muted-foreground mb-3">
              Already self-hosting? Migrate your data to the cloud seamlessly.
            </p>
            <Button variant="outline" size="sm" asChild>
              <a href="/migrate">
                Migrate to Cloud →
              </a>
            </Button>
          </div>

          {/* Quote */}
          <div className="mt-16 p-8 rounded-2xl bg-card border border-border max-w-2xl mx-auto">
            <blockquote className="text-lg italic text-muted-foreground">
              "Open source allows everyone to verify exactly how their data is handled.
              No black boxes, no hidden tracking, just transparent analytics."
            </blockquote>
            <p className="mt-4 text-sm text-muted-foreground/60">
              — Built with privacy in mind
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
