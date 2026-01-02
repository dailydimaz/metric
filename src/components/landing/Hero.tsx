import { Link } from "react-router-dom";
import { ArrowRight, Shield, Zap, BarChart3 } from "lucide-react";

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,oklch(var(--p)/0.15),transparent)]" />
      
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="badge badge-outline gap-2 mb-6">
            <span className="flex h-2 w-2 rounded-full bg-success animate-pulse" />
            Now in public beta
          </div>

          {/* Headline */}
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Analytics that respect
            <br />
            <span className="text-primary">your users' privacy</span>
          </h1>

          <p className="mt-6 text-lg text-base-content/70 max-w-2xl mx-auto">
            Simple, powerful web analytics without compromising user privacy. 
            GDPR compliant, lightweight, and beautifully designed.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth?mode=signup" className="btn btn-primary btn-lg w-full sm:w-auto">
              Start Free Trial
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link to="#demo" className="btn btn-outline btn-lg w-full sm:w-auto">
              View Live Demo
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-base-content/70">
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
          <div className="absolute inset-0 bg-gradient-to-t from-base-100 via-transparent to-transparent z-10 pointer-events-none" />
          <div className="card bg-base-100 shadow-2xl border border-base-300">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-base-300 bg-base-200/30">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-error/60" />
                <div className="h-3 w-3 rounded-full bg-warning/60" />
                <div className="h-3 w-3 rounded-full bg-success/60" />
              </div>
              <div className="flex-1 text-center">
                <div className="badge badge-ghost gap-2">
                  <BarChart3 className="h-3 w-3" />
                  dashboard.mmmetric.io
                </div>
              </div>
            </div>
            <div className="card-body bg-gradient-to-br from-base-200/20 to-base-200/5">
              <div className="stats stats-vertical lg:stats-horizontal shadow w-full">
                {[
                  { label: "Unique Visitors", value: "12,847", change: "+12%" },
                  { label: "Page Views", value: "48,291", change: "+8%" },
                  { label: "Bounce Rate", value: "42.3%", change: "-3%" },
                  { label: "Avg. Duration", value: "3m 24s", change: "+15%" },
                ].map((stat) => (
                  <div key={stat.label} className="stat">
                    <div className="stat-title">{stat.label}</div>
                    <div className="stat-value text-2xl">{stat.value}</div>
                    <div className="stat-desc text-success">{stat.change}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 h-48 rounded-lg border border-base-300 bg-base-100 flex items-end justify-between p-4 gap-2">
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
