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
import { motion } from "framer-motion";

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
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export function Features() {
  return (
    <section id="features" className="py-24 bg-base-200/50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to understand your users
          </h2>
          <p className="mt-4 text-lg text-base-content/70">
            From basic page views to advanced funnel analysis, mmmetric gives you the insights you need without the complexity.
          </p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={item}
              className="group relative p-6 bg-base-100 rounded-2xl border border-base-content/5 hover:border-primary/20 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300" />

              <div className="relative z-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mt-4 mb-2">{feature.title}</h3>
                <p className="text-sm text-base-content/70 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
