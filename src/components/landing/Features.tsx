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
  Download
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    description: "See visitors on your site right now. Track page views, sessions, and engagement as it happens.",
    className: "md:col-span-2 md:row-span-2",
  },
  {
    icon: MousePointerClick,
    title: "Event Tracking",
    description: "Track button clicks, form submissions, and any custom events with a simple API call.",
    className: "md:col-span-1",
  },
  {
    icon: GitBranch,
    title: "Funnel Analysis",
    description: "Understand your conversion funnel. See where users drop off and optimize your flow.",
    className: "md:col-span-1",
  },
  {
    icon: Users,
    title: "Retention Cohorts",
    description: "Track user retention over time. See how well you keep users engaged week after week.",
    className: "md:col-span-1",
  },
  {
    icon: Zap,
    title: "Lightweight Script",
    description: "Under 1KB gzipped. Won't slow down your site. No impact on Core Web Vitals.",
    className: "md:col-span-1",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "No cookies needed. GDPR, CCPA, and PECR compliant out of the box. Your users' data stays private.",
    className: "md:col-span-2",
  },
  {
    icon: Code2,
    title: "Simple Integration",
    description: "One line of code to get started. Works with any website or app. React, Vue, Next.js supported.",
    className: "md:col-span-1",
  },
  {
    icon: Globe,
    title: "Geo Analytics",
    description: "See where your visitors come from. Country, city, and language breakdowns.",
    className: "md:col-span-1",
  },
  {
    icon: LayoutTemplate,
    title: "Insight Properties",
    description: "Deep dive into your custom events. Analyze property breakdowns and distribution instantly.",
    className: "md:col-span-2",
  },
  {
    icon: Target,
    title: "UTM Tracking",
    description: "Measure campaign effectiveness automatically. Track sources, mediums, and campaigns.",
    className: "md:col-span-1",
  },
  {
    icon: UserPlus,
    title: "Team Collaboration",
    description: "Invite your team members to view dashboards and manage sites together.",
    className: "md:col-span-1",
  },
  {
    icon: Download,
    title: "Data Export",
    description: "Your data belongs to you. Export all your analytics data to CSV anytime.",
    className: "md:col-span-1",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1 }
};

export function Features() {
  return (
    <section id="features" className="py-24 bg-background relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary to-secondary opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
      </div>

      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="outline" className="mb-4 text-primary bg-primary/5 border-primary/20">Powerful Features</Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground mb-4">
            Everything you need to understand your users
          </h2>
          <p className="text-lg text-muted-foreground">
            From basic page views to advanced funnel analysis, mmmetric gives you the insights you need without the complexity.
          </p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-4 auto-rows-min gap-4"
        >
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              variants={item}
              className={feature.className}
            >
              <Card className={cn(
                "h-full group hover:shadow-xl transition-all duration-300 border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden relative",
                feature.className?.includes("col-span-2") ? "bg-gradient-to-br from-card/80 to-card/30" : ""
              )}>
                {/* Hover Highlight */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 mb-2">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg font-semibold">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground/70 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
