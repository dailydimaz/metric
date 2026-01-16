import { Link } from "react-router-dom";
import { ArrowRight, Shield, Zap, BarChart3, CheckCircle2, Eye, Users, MousePointerClick, TrendingUp, Clock, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { AreaChart, Area, ResponsiveContainer, CartesianGrid, Tooltip } from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const mockChartData = Array.from({ length: 24 }).map((_, i) => ({
  name: i.toString(),
  visitors: Math.floor(Math.random() * 100) + 50,
  pageviews: Math.floor(Math.random() * 150) + 80,
}));



export function Hero() {
  return (
    <section className="relative pt-32 pb-24 overflow-hidden bg-background selection:bg-primary/20">
      {/* Dynamic Background */}
      <div className="absolute inset-0 -z-10 bg-background overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl opacity-40 pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] animate-pulse-glow" />
          <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-secondary/30 rounded-full blur-[100px] animate-blob animation-delay-2000" />
          <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-accent/20 rounded-full blur-[120px] animate-blob animation-delay-4000" />
        </div>
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.02]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center"
          >
            <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <Badge variant="outline" className="gap-2 mb-8 px-4 py-1.5 text-sm font-medium border-primary/20 bg-primary/5 text-primary rounded-full hover:bg-primary/10 transition-colors cursor-default">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                v0.1.1 is now live in public beta
              </Badge>
            </div>

            <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl mb-8 text-foreground animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              Analytics that respect
              <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-600 to-indigo-600 pb-2">
                your users' privacy
              </span>
            </h1>

            <p className="mt-4 text-xl text-muted-foreground/90 max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              Simple, powerful web analytics without compromising user privacy.
              <span className="font-semibold text-foreground"> GDPR compliant</span>,
              <span className="font-semibold text-foreground"> lightweight</span>, and
              <span className="font-semibold text-foreground"> beautifully designed</span>.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <Link to="/auth?mode=signup">
                <Button size="lg" className="shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 transition-all duration-300 w-full sm:w-auto text-lg px-8 h-12 bg-primary text-primary-foreground font-semibold rounded-full">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/live">
                <Button variant="outline" size="lg" className="shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 w-full sm:w-auto text-lg h-12 rounded-full bg-background/50 backdrop-blur-sm border-border">
                  View Live Demo
                </Button>
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-muted-foreground animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
              {[
                { icon: Shield, text: "GDPR Compliant" },
                { icon: Zap, text: "< 1KB Script" },
                { icon: BarChart3, text: "Real-time Data" },
                { icon: CheckCircle2, text: "No Cookies" }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm font-medium hover:text-foreground transition-colors cursor-default">
                  <div className="p-1 rounded-full bg-primary/10">
                    <item.icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40, rotateX: 10 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, delay: 0.2, type: "spring", stiffness: 50 }}
          className="mt-24 relative max-w-6xl mx-auto perspective-1000"
        >
          {/* Glow behind preview */}
          <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-blue-500/20 to-purple-500/20 rounded-[2.5rem] get-blur-3xl opacity-40 blur-3xl -z-10" />

          <div className="relative rounded-2xl border border-border/40 bg-background/40 backdrop-blur-xl shadow-2xl overflow-hidden ring-1 ring-white/10 transform transition-transform hover:scale-[1.01] duration-700">
            {/* Window Controls & Header */}
            <div className="flex items-center gap-4 px-6 py-4 border-b border-border/40 bg-muted/30 backdrop-blur-md">
              <div className="flex gap-2 mr-4">
                <div className="h-3 w-3 rounded-full bg-[#FF5F56] border border-[#E0443E]/50 shadow-inner" />
                <div className="h-3 w-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]/50 shadow-inner" />
                <div className="h-3 w-3 rounded-full bg-[#27C93F] border border-[#1AAB29]/50 shadow-inner" />
              </div>

              <div className="flex-1 flex items-center justify-between">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-background/50 border border-border/50 text-xs font-medium text-foreground/80 shadow-sm backdrop-blur-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  mmmetric.lovable.app
                </div>

                {/* Mock Actions */}
                <div className="hidden sm:flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted/50 border border-border/50" />
                </div>
              </div>
            </div>

            {/* Dashboard Content */}
            <div className="p-8 bg-gradient-to-b from-background/40 to-background/80 backdrop-blur-sm">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                {[
                  { title: "Total Views", value: "48.2k", change: 12.5, icon: Eye },
                  { title: "Unique Visitors", value: "12.8k", change: 8.2, icon: Users },
                  { title: "Bounce Rate", value: "42.3%", change: -3.1, icon: MousePointerClick, isInverse: true },
                  { title: "Avg. Session", value: "2m 14s", change: 4.5, icon: Clock },
                ].map((stat, i) => (
                  <Card key={i} className="p-5 rounded-xl border-border/40 bg-card/40 backdrop-blur-md shadow-sm hover:shadow-md hover:bg-card/60 transition-all duration-300 group">
                    <div className="flex justify-between items-start mb-3">
                      <div className="p-2.5 bg-primary/10 rounded-lg text-primary group-hover:scale-110 transition-transform duration-300">
                        <stat.icon className="h-4.5 w-4.5" />
                      </div>
                      <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 h-5 font-semibold ${(stat.isInverse ? stat.change < 0 : stat.change > 0)
                        ? 'text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20'
                        : 'text-rose-500 bg-rose-500/10 hover:bg-rose-500/20'
                        }`}>
                        {stat.change > 0 ? '+' : ''}{stat.change}%
                      </Badge>
                    </div>
                    <div className="text-3xl font-bold tracking-tight mb-1 text-foreground font-display">{stat.value}</div>
                    <div className="text-xs text-muted-foreground font-medium">{stat.title}</div>
                  </Card>
                ))}
              </div>

              {/* Main Chart */}
              <div className="rounded-xl border border-border/40 bg-card/40 backdrop-blur-md shadow-sm overflow-hidden p-1">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-md text-primary">
                      <BarChart3 className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-foreground">Traffic Overview</h3>
                      <p className="text-xs text-muted-foreground">Visitors vs Pageviews</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-8 w-24 bg-muted/30 rounded-md" />
                  </div>
                </div>
                <div className="p-6 h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mockChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPageviewsHero" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorVisitorsHero" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: '0.75rem',
                          fontSize: '12px',
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                          padding: '12px'
                        }}
                        itemStyle={{ padding: 0 }}
                        cursor={{ stroke: 'hsl(var(--foreground))', strokeWidth: 1, opacity: 0.1, strokeDasharray: '4 4' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="pageviews"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fill="url(#colorPageviewsHero)"
                        animationDuration={1500}
                      />
                      <Area
                        type="monotone"
                        dataKey="visitors"
                        stroke="hsl(var(--foreground))"
                        strokeOpacity={0.5}
                        strokeWidth={2}
                        fill="url(#colorVisitorsHero)"
                        animationDuration={1500}
                        animationBegin={300}
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
