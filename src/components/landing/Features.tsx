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
    <section id="features" className="py-24 bg-base-200/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to understand your users
          </h2>
          <p className="mt-4 text-lg text-base-content/70">
            From basic page views to advanced funnel analysis, mmmetric gives you the insights you need without the complexity.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div 
              key={feature.title}
              className="card bg-base-100 border border-base-300 hover:shadow-lg transition-all duration-300 group"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="card-body">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-content transition-colors">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="card-title text-base mt-4">{feature.title}</h3>
                <p className="text-sm text-base-content/70 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
