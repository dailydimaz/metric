import { Link } from "react-router-dom";
import { ArrowRight, Shield, Zap, BarChart3, CheckCircle2, Eye, Users, MousePointerClick, TrendingUp, Clock, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { AreaChart, Area, ResponsiveContainer, CartesianGrid, Tooltip } from "recharts";

const mockChartData = Array.from({ length: 24 }).map((_, i) => ({
  name: i.toString(),
  visitors: Math.floor(Math.random() * 100) + 50,
  pageviews: Math.floor(Math.random() * 150) + 80,
}));

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
              v0.1.1 is now live in public beta
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
              <Link to="/live" className="btn btn-ghost btn-lg w-full sm:w-auto hover:bg-base-200/50">
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
          className="mt-20 relative max-w-6xl mx-auto"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-base-100 via-transparent to-transparent z-10 pointer-events-none" />

          <div className="relative rounded-xl border border-base-content/10 bg-base-100 shadow-2xl overflow-hidden ring-1 ring-base-content/5">
            {/* Window Controls & Header - Mimicking Dashboard Header */}
            <div className="flex items-center gap-4 px-4 py-3 border-b border-base-content/10 bg-base-200/50 backdrop-blur-sm">
              <div className="flex gap-1.5 mr-4">
                <div className="h-3 w-3 rounded-full bg-error/80" />
                <div className="h-3 w-3 rounded-full bg-warning/80" />
                <div className="h-3 w-3 rounded-full bg-success/80" />
              </div>

              <div className="flex-1 flex items-center justify-between">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-base-100 border border-base-content/5 text-sm font-medium">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  mmmetric.lovable.app
                </div>

                {/* Mock Date Picker */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-base-content/10 bg-base-100 text-xs font-medium text-base-content/70">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Last 7 days</span>
                </div>
              </div>
            </div>

            {/* Dashboard Content */}
            <div className="p-6 bg-base-100/50 backdrop-blur-xl">
              {/* Stats Grid - Matching StatsCards.tsx style */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { title: "Total Views", value: "48.2k", change: 12.5, icon: Eye },
                  { title: "Unique Visitors", value: "12.8k", change: 8.2, icon: Users },
                  { title: "Bounce Rate", value: "42.3%", change: -3.1, icon: MousePointerClick, isInverse: true },
                  { title: "Avg. Session", value: "2m 14s", change: 4.5, icon: Clock },
                ].map((stat, i) => (
                  <div key={i} className="bg-base-100 p-4 rounded-2xl border border-base-content/5 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div className="p-2 bg-primary/10 rounded-xl text-primary">
                        <stat.icon className="h-4 w-4" />
                      </div>
                      <div className={`flex items-center gap-1 text-xs font-medium ${(stat.isInverse ? stat.change < 0 : stat.change > 0) ? 'text-success' : 'text-error'
                        }`}>
                        <TrendingUp className="h-3 w-3" />
                        {Math.abs(stat.change)}%
                      </div>
                    </div>
                    <div className="text-2xl font-bold tracking-tight mb-1">{stat.value}</div>
                    <div className="text-xs text-base-content/50 font-medium">{stat.title}</div>
                  </div>
                ))}
              </div>

              {/* Main Chart - Using Recharts to match VisitorChart.tsx */}
              <div className="rounded-2xl border border-base-content/5 bg-base-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 p-4 border-b border-base-content/5">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                  <h3 className="font-semibold text-sm">Traffic Overview</h3>
                </div>
                <div className="p-4 h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mockChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPageviewsHero" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorVisitorsHero" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: '0.5rem',
                          fontSize: '12px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        }}
                        cursor={{ stroke: 'hsl(var(--foreground))', strokeWidth: 1, opacity: 0.1 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="pageviews"
                        stroke="hsl(var(--primary))"
                        fill="url(#colorPageviewsHero)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="visitors"
                        stroke="hsl(var(--secondary))"
                        fill="url(#colorVisitorsHero)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
