import {
  BarChart3,
  MousePointerClick,
  GitBranch,
  Users,
  Zap,
  Shield,
  Code2,
  Globe,
  LayoutTemplate,
  Target,
  UserPlus,
  Download,
  Route,
  Layers,
  Command,
  Check,
  Search,
  ArrowRight,
  TrendingDown,
  Smartphone,
  Languages,
  Filter,
  Database,
  Share2,
  Lightbulb,
  Link2,
  Image,
  GitCompare,
  DollarSign,
  Workflow,
  Magnet,
  Cookie,
  Upload,
  Mail,
  Twitter,
  Bell,
  Globe2,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// --- Illustrations ---

const RealtimeIllustration = () => (
  <div className="absolute inset-x-4 bottom-4 top-16 bg-background/50 rounded-lg border border-border/50 overflow-hidden flex flex-col p-4 shadow-sm">
    <div className="flex items-center gap-2 mb-4">
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        <span className="text-xs font-medium">Live Users</span>
      </div>
      <div className="ml-auto font-mono text-lg font-bold">142</div>
    </div>
    <div className="flex-1 flex items-end justify-between gap-1">
      {[40, 65, 30, 80, 55, 90, 45, 70, 35, 60, 25].map((h, i) => (
        <motion.div
          key={i}
          initial={{ height: 0 }}
          whileInView={{ height: `${h}%` }}
          transition={{ duration: 0.5, delay: i * 0.05 }}
          className="w-full bg-primary/20 rounded-t-sm relative group"
        >
          <div className="absolute inset-x-0 bottom-0 bg-primary/40 h-full rounded-t-sm group-hover:bg-primary/60 transition-colors" style={{ height: '40%' }}></div>
        </motion.div>
      ))}
    </div>
  </div>
);

const EventsIllustration = () => (
  <div className="absolute inset-4 top-16 bg-slate-950 rounded-lg border border-border/50 p-4 font-mono text-xs text-slate-300 shadow-md">
    <div className="flex gap-1.5 mb-3">
      <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
      <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
    </div>
    <div className="space-y-1">
      <p><span className="text-purple-400">await</span> <span className="text-blue-400">metric</span>.<span className="text-yellow-300">track</span>(<span className="text-green-300">'signup'</span>, {'{'}</p>
      <p className="pl-4"><span className="text-sky-300">plan</span>: <span className="text-green-300">'pro'</span>,</p>
      <p className="pl-4"><span className="text-sky-300">source</span>: <span className="text-green-300">'landing'</span></p>
      <p>{'})'}</p>
    </div>
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.3 }}
      className="absolute bottom-4 right-4 bg-green-500/10 text-green-500 px-2 py-1 rounded text-[10px] flex items-center gap-1"
    >
      <Check className="h-3 w-3" /> Sent
    </motion.div>
  </div>
);

const FunnelIllustration = () => (
  <div className="absolute inset-x-8 top-20 bottom-8 flex flex-col justify-center gap-2">
    {[100, 75, 40].map((w, i) => (
      <div key={i} className="flex items-center gap-3">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${w}%` }}
          transition={{ duration: 0.8, delay: i * 0.2, ease: "easeOut" }}
          className={cn(
            "h-8 rounded-r-md flex items-center px-3 text-xs font-medium text-white shadow-sm",
            i === 0 ? "bg-primary" : i === 1 ? "bg-primary/70" : "bg-primary/40"
          )}
        >
          {i === 0 && "Page View"}
          {i === 1 && "Add to Cart"}
          {i === 2 && "Purchase"}
        </motion.div>
        <span className="text-xs text-muted-foreground">{i === 0 ? "100%" : i === 1 ? "75%" : "40%"}</span>
      </div>
    ))}
  </div>
);

const CohortIllustration = () => (
  <div className="absolute inset-x-4 bottom-4 bg-background rounded-md border border-border p-2 shadow-sm grid grid-cols-5 gap-1">
    {[...Array(20)].map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: i * 0.02 }}
        className={cn(
          "aspect-square rounded-[2px]",
          i < 5 ? "bg-primary/80" :
            i < 9 ? "bg-primary/60" :
              i < 12 ? "bg-primary/40" :
                i < 14 ? "bg-primary/20" : "bg-muted"
        )}
      />
    ))}
  </div>
);

const GeoIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
    <Globe className="w-48 h-48 text-primary" strokeWidth={0.5} />
    {/* Animated dots */}
    <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 3, repeat: Infinity }} className="absolute bg-primary rounded-full w-2 h-2 top-1/3 left-1/3" />
    <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 4, repeat: Infinity, delay: 1 }} className="absolute bg-primary rounded-full w-2 h-2 top-1/2 right-1/3" />
    <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }} className="absolute bg-primary rounded-full w-2 h-2 bottom-1/3 left-1/2" />
  </div>
);

const CommandIllustration = () => (
  <div className="absolute inset-x-8 top-16 h-10 bg-background rounded-lg border border-border shadow-lg flex items-center px-3 gap-2">
    <Search className="h-4 w-4 text-muted-foreground" />
    <div className="h-3 w-20 bg-muted rounded-full"></div>
    <div className="ml-auto flex gap-1">
      <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
        <span className="text-xs">⌘</span>K
      </kbd>
    </div>
  </div>
);

const JourneyIllustration = () => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-6">
    <svg viewBox="0 0 200 100" className="w-full h-full stroke-primary/30 fill-none" strokeWidth="2">
      <path d="M20,50 C60,50 60,20 100,20 C140,20 140,50 180,50" className="animate-draw-path" strokeDasharray="200" strokeDashoffset="0" />
      <circle cx="20" cy="50" r="4" className="fill-primary" />
      <circle cx="100" cy="20" r="4" className="fill-primary" />
      <circle cx="180" cy="50" r="4" className="fill-primary" />
    </svg>
  </div>
);

const BentoCard = ({ className, title, description, icon: Icon, illustration: Illustration, delay = 0 }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.5, delay }}
    className={cn(
      "group relative overflow-hidden rounded-3xl bg-card border border-border/40 transition-all hover:shadow-xl hover:border-border/80",
      className
    )}
  >
    {/* Gradient Background Effect on Hover */}
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

    <div className="relative h-full flex flex-col">
      {/* Content Top */}
      <div className="p-6">
        <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-bold tracking-tight text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-[90%]">
          {description}
        </p>
      </div>

      {/* Illustration Area */}
      <div className="flex-1 relative min-h-[140px] w-full overflow-hidden bg-muted/20 border-t border-border/20 group-hover:bg-muted/30 transition-colors">
        {Illustration && <Illustration />}
      </div>
    </div>
  </motion.div>
);


export function Features() {
  return (
    <section id="features" className="py-24 bg-background relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 md:px-8">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            Power-packed Features
          </Badge>
          <h2 className="text-4xl font-bold tracking-tight mb-4">
            Everything you need for <span className="text-primary">world-class analytics</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Simple enough for personal blogs, powerful enough for enterprise SaaS.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[minmax(280px,auto)]">
          {/* Large Card: Real-time - Row 1 */}
          <BentoCard
            className="md:col-span-2 md:row-span-2"
            icon={BarChart3}
            title="Real-time Traffic Insights"
            description="Watch your traffic spike in real-time. See exactly how many people are on your site right now, what pages they're viewing, and where they're coming from."
            illustration={RealtimeIllustration}
          />

          {/* Card: Events - Row 1 */}
          <BentoCard
            className="md:col-span-1 md:row-span-2"
            icon={MousePointerClick}
            title="Custom Events"
            description="Track any user action with a single line of code. Signups, purchases, button clicks - capture it all."
            illustration={EventsIllustration}
            delay={0.1}
          />

          {/* Card: Funnels - Row 1 */}
          <BentoCard
            className="md:col-span-1"
            icon={GitBranch}
            title="Funnel Analysis"
            description="Identify where users drop off in your conversion flows."
            illustration={FunnelIllustration}
            delay={0.2}
          />

          {/* Card: Cohorts - Row 2 */}
          <BentoCard
            className="md:col-span-1"
            icon={Users}
            title="Retention Cohorts"
            description="Measure sticky users and product retention over time."
            illustration={CohortIllustration}
            delay={0.3}
          />

          {/* Large Card: Privacy - Row 2 */}
          <BentoCard
            className="md:col-span-2"
            icon={Shield}
            title="Privacy-First & GDPR Compliant"
            description="No IP tracking. No fingerprints. No cookies. We respect your users' privacy so you don't need any annoying cookie banners."
            illustration={() => (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <Shield className="w-24 h-24 text-green-500/20" fill="currentColor" />
                  <Check className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-green-500" strokeWidth={3} />
                </div>
              </div>
            )}
            delay={0.1}
          />

          {/* Card: Geo - Row 2 */}
          <BentoCard
            className="md:col-span-1"
            icon={Globe}
            title="Global Reach"
            description="Detailed breakdown of countries, cities, and regions."
            illustration={GeoIllustration}
            delay={0.2}
          />

          {/* Card: Script */}
          <BentoCard
            className="md:col-span-1"
            icon={Zap}
            title="Ultralight Script"
            description="< 1KB script. Zero impact on your site's performance scores."
            illustration={() => (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-400 to-orange-500">1KB</span>
              </div>
            )}
            delay={0.3}
          />

          {/* Large Card: User Journeys - Row 3 */}
          <BentoCard
            className="md:col-span-2"
            icon={Route}
            title="User Journeys"
            description="Visualize the exact path users take through your website. optimized navigation flows based on real data."
            illustration={JourneyIllustration}
            delay={0.2}
          />

          {/* Card: Command Menu */}
          <BentoCard
            className="md:col-span-1"
            icon={Command}
            title="Command Menu"
            description="Navigate your entire dashboard without lifting your fingers."
            illustration={CommandIllustration}
            delay={0.3}
          />

          {/* Card: Team */}
          <BentoCard
            className="md:col-span-1"
            icon={UserPlus}
            title="Team Access"
            description="Invite your whole team. Share dashboards via public links."
            illustration={() => (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex -space-x-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shadow-sm">
                      U{i}
                    </div>
                  ))}
                  <div className="w-10 h-10 rounded-full border-2 border-background bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground shadow-sm">
                    +
                  </div>
                </div>
              </div>
            )}
            delay={0.4}
          />

          {/* Card: Project */}
          <BentoCard
            className="md:col-span-1"
            icon={LayoutTemplate}
            title="Unlimited Projects"
            description="Track as many websites as you want from a single account."
            illustration={() => (
              <div className="absolute inset-x-8 top-16 space-y-2 opacity-60">
                <div className="h-8 bg-background rounded border border-border/60 shadow-sm w-full"></div>
                <div className="h-8 bg-background rounded border border-border/60 shadow-sm w-[90%] mx-auto"></div>
                <div className="h-8 bg-background rounded border border-border/60 shadow-sm w-[80%] mx-auto"></div>
              </div>
            )}
            delay={0.5}
          />

          {/* Card: Export */}
          <BentoCard
            className="md:col-span-1"
            icon={Download}
            title="Data Ownership"
            description="It's your data. Export it to CSV or import from other tools anytime."
            illustration={() => (
              <div className="absolute inset-0 flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" className="pointer-events-none">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" size="sm" className="pointer-events-none">
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </Button>
              </div>
            )}
            delay={0.6}
          />

          {/* --- NEWLY ADDED FEATURES FROM ROADMAP --- */}

          {/* Card: Public Dashboards */}
          <BentoCard
            className="md:col-span-1"
            icon={Share2}
            title="Public Dashboards"
            description="Share your stats via a secure, password-protected public URL."
            illustration={() => (
              <div className="absolute inset-x-8 top-16 h-10 bg-background rounded-lg border border-border shadow-lg flex items-center px-3 gap-2">
                <Globe className="h-4 w-4 text-primary" />
                <div className="h-3 w-20 bg-muted rounded-full"></div>
                <div className="ml-auto">
                  <Badge variant="outline" className="text-[10px] h-5 px-1">Public</Badge>
                </div>
              </div>
            )}
            delay={0.2}
          />

          {/* Card: Comparison */}
          <BentoCard
            className="md:col-span-1"
            icon={GitCompare}
            title="Comparison Mode"
            description="Compare traffic and metrics against previous periods effortlessly."
            illustration={() => (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-24 h-12">
                  <div className="absolute inset-0 border-b-2 border-muted-foreground/30 transform skew-y-6"></div>
                  <div className="absolute inset-0 border-b-2 border-primary transform -skew-y-6 translate-y-2"></div>
                </div>
              </div>
            )}
            delay={0.3}
          />

          {/* Card: Filter & Segments */}
          <BentoCard
            className="md:col-span-1"
            icon={Filter}
            title="Advanced Filtering"
            description="Deep dive with filters and save them as Segments for quick access."
            illustration={() => (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-60">
                <div className="w-32 h-6 bg-background rounded-md border border-border flex items-center px-2">
                  <div className="w-4 h-4 rounded-full bg-primary/20"></div>
                </div>
                <div className="w-32 h-6 bg-background rounded-md border border-border flex items-center px-2">
                  <div className="w-4 h-4 rounded-full bg-secondary/20"></div>
                </div>
              </div>
            )}
            delay={0.4}
          />

          {/* Card: Tracking */}
          <BentoCard
            className="md:col-span-1"
            icon={Link2}
            title="Links & UTMs"
            description="Track outbound clicks, UTM campaigns, and marketing effectiveness."
            illustration={() => (
              <div className="absolute inset-0 flex items-center justify-center">
                <Link2 className="w-16 h-16 text-primary/10" />
                <Target className="w-8 h-8 text-primary absolute bottom-1/3 right-1/3" />
              </div>
            )}
            delay={0.5}
          />

          {/* Card: Revenue */}
          <BentoCard
            className="md:col-span-1"
            icon={DollarSign}
            title="Revenue Tracking"
            description="Track ecommerce revenue, average order value, and conversion goals."
            illustration={() => (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-5xl font-bold text-green-500/20">$</span>
                <TrendingDown className="w-8 h-8 text-green-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-180" />
              </div>
            )}
            delay={0.2}
          />

          {/* Card: Attribution */}
          <BentoCard
            className="md:col-span-1"
            icon={Magnet}
            title="Attribution Models"
            description="Understand the customer journey with First-touch and Linear models."
            illustration={() => (
              <div className="absolute inset-0 flex items-center justify-center gap-1">
                <div className="w-2 h-12 bg-muted rounded-full"></div>
                <div className="w-2 h-12 bg-muted rounded-full"></div>
                <div className="w-2 h-12 bg-primary rounded-full"></div>
              </div>
            )}
            delay={0.3}
          />

          {/* Card: Devices */}
          <BentoCard
            className="md:col-span-1"
            icon={Smartphone}
            title="Device & OS"
            description="Granular breakdown of what devices, browsers, and OS your users use."
            illustration={() => (
              <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-50">
                <Smartphone className="w-8 h-8" />
                <div className="w-12 h-8 border border-foreground rounded" />
              </div>
            )}
            delay={0.4}
          />

          {/* Card: Social */}
          <BentoCard
            className="md:col-span-1"
            icon={Twitter}
            title="Social Analytics"
            description="Track mentions and link clicks from social platforms like X (Twitter)."
            illustration={() => (
              <div className="absolute inset-0 flex items-center justify-center">
                <Twitter className="w-16 h-16 text-blue-400/20" fill="currentColor" />
              </div>
            )}
            delay={0.5}
          />

          {/* Card: API */}
          <BentoCard
            className="md:col-span-1"
            icon={Code2}
            title="API & Webhooks"
            description="Programmatic access to data and Slack/Discord alerts via webhooks."
            illustration={() => (
              <div className="absolute inset-0 flex items-center justify-center font-mono text-xs opacity-60">
                {'{ "data": [...] }'}
              </div>
            )}
            delay={0.2}
          />

          {/* Card: Email Reports */}
          <BentoCard
            className="md:col-span-1"
            icon={Mail}
            title="Email Reports"
            description="Get weekly or monthly summaries delivered straight to your inbox."
            illustration={() => (
              <div className="absolute inset-0 flex items-center justify-center">
                <Mail className="w-12 h-12 text-primary/20" />
                <div className="absolute top-1/2 right-1/3 w-3 h-3 bg-red-500 rounded-full border-2 border-background"></div>
              </div>
            )}
            delay={0.3}
          />

          {/* Card: Cross Domain */}
          <BentoCard
            className="md:col-span-1"
            icon={Globe2}
            title="Cross-domain"
            description="Unified analytics across multiple domains and subdomains."
            illustration={() => (
              <div className="absolute inset-0 flex items-center justify-center gap-4">
                <Globe className="w-8 h-8 text-primary/40" />
                <Link2 className="w-4 h-4 text-muted-foreground" />
                <Globe className="w-8 h-8 text-secondary/40" />
              </div>
            )}
            delay={0.4}
          />

          {/* Card: Insight Drilldown */}
          <BentoCard
            className="md:col-span-1"
            icon={Lightbulb}
            title="Insight Drilldown"
            description="Deep dive into custom event properties and parameters."
            illustration={() => (
              <div className="absolute inset-0 flex items-center justify-center">
                <Search className="w-10 h-10 text-primary/20" />
              </div>
            )}
            delay={0.5}
          />
        </div>
      </div>
    </section>
  );
}
