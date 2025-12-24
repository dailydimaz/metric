import { 
  BarChart3, 
  MousePointerClick, 
  GitBranch, 
  Users, 
  Zap, 
  Shield,
  Code2,
  Globe
} from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    description: "See visitors on your site right now. Track page views, sessions, and engagement as it happens."
  },
  {
    icon: MousePointerClick,
    title: "Event Tracking",
    description: "Track button clicks, form submissions, and any custom events with a simple API call."
  },
  {
    icon: GitBranch,
    title: "Funnel Analysis",
    description: "Understand your conversion funnel. See where users drop off and optimize your flow."
  },
  {
    icon: Users,
    title: "Retention Cohorts",
    description: "Track user retention over time. See how well you keep users engaged week after week."
  },
  {
    icon: Zap,
    title: "Lightweight Script",
    description: "Under 1KB gzipped. Won't slow down your site. No impact on Core Web Vitals."
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "No cookies needed. GDPR, CCPA, and PECR compliant out of the box. Your users' data stays private."
  },
  {
    icon: Code2,
    title: "Simple Integration",
    description: "One line of code to get started. Works with any website or app. React, Vue, Next.js supported."
  },
  {
    icon: Globe,
    title: "Geo Analytics",
    description: "See where your visitors come from. Country, city, and language breakdowns."
  }
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to understand your users
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            From basic page views to advanced funnel analysis, Metric gives you the insights you need without the complexity.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div 
              key={feature.title}
              className="group relative rounded-xl border bg-card p-6 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}