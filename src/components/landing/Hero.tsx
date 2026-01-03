import { Link } from "react-router-dom";
import { ArrowRight, Shield, Zap, BarChart3, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export function Hero() {
  return (
    <section className="relative pt-32 pb-24 overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 -z-10 bg-base-100">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl blur-[100px] opacity-50 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full mix-blend-multiply animate-blob" />
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-secondary/20 rounded-full mix-blend-multiply animate-blob animation-delay-2000" />
          <div className="absolute -bottom-32 left-1/2 w-[500px] h-[500px] bg-accent/20 rounded-full mix-blend-multiply animate-blob animation-delay-4000" />
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="badge badge-lg badge-outline gap-2 mb-8 px-4 py-3 text-sm font-medium border-primary/20 bg-primary/5 text-primary">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              v2.0 is now live in public beta
            </div>

            <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl mb-6 bg-clip-text text-transparent bg-gradient-to-r from-base-content via-base-content/90 to-base-content/70">
              Analytics that respect
              <span className="block text-primary bg-clip-text bg-gradient-to-r from-primary to-secondary">your users' privacy</span>
            </h1>

            <p className="mt-8 text-xl text-base-content/80 max-w-2xl mx-auto leading-relaxed">
              Simple, powerful web analytics without compromising user privacy.
              <span className="font-semibold text-base-content"> GDPR compliant</span>,
              <span className="font-semibold text-base-content"> lightweight</span>, and
              <span className="font-semibold text-base-content"> beautifully designed</span>.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth?mode=signup" className="btn btn-primary btn-lg shadow-lg hover:shadow-primary/20 hover:scale-105 transition-all duration-300 w-full sm:w-auto px-8">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link to="#demo" className="btn btn-ghost btn-lg w-full sm:w-auto hover:bg-base-200/50">
                View Live Demo
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-base-content/60">
              {[
                { icon: Shield, text: "GDPR Compliant" },
                { icon: Zap, text: "< 1KB Script" },
                { icon: BarChart3, text: "Real-time Data" },
                { icon: CheckCircle2, text: "No Cookies" }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm font-medium">
                  <item.icon className="h-4 w-4 text-primary" />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-20 relative max-w-5xl mx-auto"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-base-100 via-transparent to-transparent z-10 pointer-events-none" />

          <div className="relative rounded-xl border border-base-content/10 bg-base-100 shadow-2xl overflow-hidden ring-1 ring-base-content/5">
            {/* Window Controls */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-base-content/10 bg-base-200/50 backdrop-blur-sm">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-error/80" />
                <div className="h-3 w-3 rounded-full bg-warning/80" />
                <div className="h-3 w-3 rounded-full bg-success/80" />
              </div>
              <div className="flex-1 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-base-100 border border-base-content/5 text-xs text-base-content/50 font-medium">
                  <BarChart3 className="h-3 w-3" />
                  metric.lovable.app
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 bg-base-100/50 backdrop-blur-xl">
              <div className="grid grid-cols-4 gap-4 mb-8">
                {[
                  { label: "Unique Visitors", value: "12,847", change: "+12.5%", trend: "up" },
                  { label: "Page Views", value: "48,291", change: "+8.2%", trend: "up" },
                  { label: "Bounce Rate", value: "42.3%", change: "-3.1%", trend: "down" },
                  { label: "Live Users", value: "24", change: "+4", trend: "up" },
                ].map((stat, i) => (
                  <div key={i} className="p-4 rounded-xl border border-base-content/10 bg-base-100/50 hover:bg-base-100 transition-colors">
                    <div className="text-sm text-base-content/60 mb-1">{stat.label}</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{stat.value}</span>
                      <span className={`text-xs font-medium ${stat.trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {stat.change}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Fake Chart */}
              <div className="relative h-64 w-full rounded-xl border border-base-content/10 bg-base-100/50 p-6 flex items-end gap-1 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
                {Array.from({ length: 48 }).map((_, i) => {
                  const height = 30 + Math.random() * 60;
                  return (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ duration: 1, delay: 0.5 + i * 0.02 }}
                      className="flex-1 min-w-[4px] rounded-t-sm bg-primary/80"
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
