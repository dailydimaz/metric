import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const tiers = [
  {
    name: "Hobby",
    price: "Free",
    description: "Perfect for personal projects and small sites.",
    events: "Up to 10K events/mo",
    features: [
      "1 website",
      "Core web analytics",
      "7-day data retention",
      "Email support"
    ],
    cta: "Start Free",
    highlighted: false
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    description: "For growing businesses that need more insights.",
    events: "Up to 100K events/mo",
    features: [
      "Unlimited websites",
      "Custom event tracking",
      "Funnel analysis",
      "1-year data retention",
      "API access",
      "Priority support"
    ],
    cta: "Start Free Trial",
    highlighted: true
  },
  {
    name: "Business",
    price: "$79",
    period: "/month",
    description: "For teams that need advanced analytics.",
    events: "Up to 1M events/mo",
    features: [
      "Everything in Pro",
      "Retention cohorts",
      "Team collaboration",
      "2-year data retention",
      "Custom dashboards",
      "Slack integration",
      "Dedicated support"
    ],
    cta: "Contact Sales",
    highlighted: false
  }
];

export function Pricing() {
  return (
    <section id="pricing" className="py-24">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Simple, usage-based pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start free, scale as you grow. Only pay for what you use.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {tiers.map((tier) => (
            <div 
              key={tier.name}
              className={`relative rounded-2xl border p-8 ${
                tier.highlighted 
                  ? "border-primary bg-card shadow-xl shadow-primary/10 scale-105" 
                  : "bg-card"
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center rounded-full bg-primary px-4 py-1 text-xs font-medium text-primary-foreground">
                    Most Popular
                  </span>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold">{tier.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{tier.description}</p>
              </div>

              <div className="mt-6">
                <span className="text-4xl font-bold">{tier.price}</span>
                {tier.period && (
                  <span className="text-muted-foreground">{tier.period}</span>
                )}
              </div>

              <p className="mt-2 text-sm font-medium text-primary">{tier.events}</p>

              <ul className="mt-8 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm">
                    <Check className="h-4 w-4 text-success flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                className="w-full mt-8" 
                variant={tier.highlighted ? "default" : "outline"}
                asChild
              >
                <Link to="/auth?mode=signup">{tier.cta}</Link>
              </Button>
            </div>
          ))}
        </div>

        <p className="mt-12 text-center text-sm text-muted-foreground">
          Need more than 1M events? <a href="#" className="text-primary hover:underline">Contact us</a> for custom pricing.
        </p>
      </div>
    </section>
  );
}