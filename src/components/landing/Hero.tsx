import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Zap, BarChart3 } from "lucide-react";

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,hsl(var(--primary)/0.15),transparent)]" />
      
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm">
            <span className="flex h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="text-muted-foreground">Now in public beta</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Analytics that respect
            <br />
            <span className="text-primary">your users' privacy</span>
          </h1>

          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Simple, powerful web analytics without compromising user privacy. 
            GDPR compliant, lightweight, and beautifully designed.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link to="/auth?mode=signup">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
              <Link to="#demo">View Live Demo</Link>
            </Button>
          </div>

          {/* Trust badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-muted-foreground">
            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-success" />
              <span>GDPR Compliant</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Zap className="h-4 w-4 text-warning" />
              <span>{"<"}1KB Script</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <BarChart3 className="h-4 w-4 text-info" />
              <span>Real-time Data</span>
            </div>
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="mt-20 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
          <div className="rounded-xl border bg-card shadow-2xl shadow-primary/5 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-destructive/60" />
                <div className="h-3 w-3 rounded-full bg-warning/60" />
                <div className="h-3 w-3 rounded-full bg-success/60" />
              </div>
              <div className="flex-1 text-center">
                <div className="inline-flex items-center gap-2 rounded-md bg-muted px-3 py-1 text-xs text-muted-foreground">
                  <BarChart3 className="h-3 w-3" />
                  dashboard.metric.io
                </div>
              </div>
            </div>
            <div className="p-6 bg-gradient-to-br from-muted/20 to-muted/5">
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: "Unique Visitors", value: "12,847", change: "+12%" },
                  { label: "Page Views", value: "48,291", change: "+8%" },
                  { label: "Bounce Rate", value: "42.3%", change: "-3%" },
                  { label: "Avg. Duration", value: "3m 24s", change: "+15%" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-lg border bg-card p-4">
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="mt-1 text-2xl font-semibold">{stat.value}</p>
                    <p className="mt-1 text-xs text-success">{stat.change}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 h-48 rounded-lg border bg-card flex items-end justify-between p-4 gap-2">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t bg-primary/80"
                    style={{ height: `${Math.random() * 70 + 20}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}