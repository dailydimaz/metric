import { Link } from "react-router-dom";
import {
  Check,
  Clock,
  BarChart3,
  Users,
  TrendingDown,
  Globe,
  Smartphone,
  Languages,
  Filter,
  Zap,
  UserPlus,
  MousePointer,
  Database,
  Target,
  Share2,
  Lightbulb,
  Layers,
  Link2,
  Image,
  GitCompare,
  Workflow,
  DollarSign,
  Route,
  Magnet,
  Shield,
  Cookie,
  HardDrive,
  Cloud,
  Gauge,
  Upload,
  Download,
  Mail,
  ArrowLeft,
  Sparkles,
  ShoppingBag,
  Search,
  Twitter,
  Code2,
  Globe2,
  LayoutTemplate,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Feature {
  name: string;
  description: string;
  icon: typeof Check;
  implemented: boolean;
  difficulty: "easy" | "medium" | "hard";
  category: "analytics" | "insights" | "privacy" | "cloud";
}

const features: Feature[] = [
  // IMPLEMENTED - Easy
  {
    name: "Page Views",
    description: "Track which pages get the most traffic",
    icon: BarChart3,
    implemented: true,
    difficulty: "easy",
    category: "analytics",
  },
  {
    name: "Visitors",
    description: "Get detailed visitor information like device, browser, OS",
    icon: Users,
    implemented: true,
    difficulty: "easy",
    category: "analytics",
  },
  {
    name: "Bounce Rate",
    description: "See which pages keep visitors engaged",
    icon: TrendingDown,
    implemented: true,
    difficulty: "easy",
    category: "analytics",
  },
  {
    name: "Traffic Sources",
    description: "See where your traffic comes from",
    icon: Globe,
    implemented: true,
    difficulty: "easy",
    category: "analytics",
  },
  {
    name: "Location",
    description: "Country, city, and region breakdowns",
    icon: Globe,
    implemented: true,
    difficulty: "easy",
    category: "analytics",
  },
  {
    name: "Devices",
    description: "Popular devices used by visitors",
    icon: Smartphone,
    implemented: true,
    difficulty: "easy",
    category: "analytics",
  },
  {
    name: "Languages",
    description: "Most popular languages among visitors",
    icon: Languages,
    implemented: true,
    difficulty: "easy",
    category: "analytics",
  },
  {
    name: "Realtime Data",
    description: "Data available in seconds, not days",
    icon: Zap,
    implemented: true,
    difficulty: "easy",
    category: "analytics",
  },
  {
    name: "No Cookies",
    description: "No cookie banner required",
    icon: Cookie,
    implemented: true,
    difficulty: "easy",
    category: "privacy",
  },
  {
    name: "GDPR & CCPA",
    description: "Fully compliant with privacy laws",
    icon: Shield,
    implemented: true,
    difficulty: "easy",
    category: "privacy",
  },

  // IMPLEMENTED - Medium
  {
    name: "Custom Events",
    description: "Track signups, checkouts, and more",
    icon: MousePointer,
    implemented: true,
    difficulty: "medium",
    category: "analytics",
  },
  {
    name: "Insight Properties",
    description: "Deep dive into custom event properties",
    icon: Lightbulb,
    implemented: true,
    difficulty: "medium",
    category: "analytics",
  },
  {
    name: "UTM Tracking",
    description: "Measure campaign effectiveness",
    icon: Target,
    implemented: true,
    difficulty: "medium",
    category: "analytics",
  },
  {
    name: "Teams",
    description: "Share website access with team members",
    icon: UserPlus,
    implemented: true,
    difficulty: "medium",
    category: "analytics",
  },
  {
    name: "Data Export",
    description: "Export all your analytics data",
    icon: Download,
    implemented: true,
    difficulty: "medium",
    category: "cloud",
  },

  // IMPLEMENTED - Hard
  {
    name: "Funnels",
    description: "Understand conversion and drop-off rates",
    icon: Workflow,
    implemented: true,
    difficulty: "hard",
    category: "insights",
  },
  {
    name: "Retention",
    description: "Track how often users return",
    icon: TrendingDown,
    implemented: true,
    difficulty: "hard",
    category: "insights",
  },
  {
    name: "Goals",
    description: "Track goals for pageviews and events",
    icon: Target,
    implemented: true,
    difficulty: "hard",
    category: "insights",
  },

  // NOT IMPLEMENTED - Easy
  {
    name: "Filtering",
    description: "Apply filters like country, browser, URL",
    icon: Filter,
    implemented: true,
    difficulty: "easy",
    category: "analytics",
  },
  {
    name: "Data Anonymization",
    description: "All visitor data anonymized",
    icon: Shield,
    implemented: true,
    difficulty: "easy",
    category: "privacy",
  },

  // NOT IMPLEMENTED - Medium

  {
    name: "Public Dashboards",
    description: "Share stats via secure unique URL",
    icon: Share2,
    implemented: true,
    difficulty: "medium",
    category: "insights",
  },
  {
    name: "Segments",
    description: "Save commonly used filters",
    icon: Layers,
    implemented: true,
    difficulty: "medium",
    category: "insights",
  },
  {
    name: "Compare",
    description: "Compare metrics against previous periods",
    icon: GitCompare,
    implemented: true,
    difficulty: "medium",
    category: "insights",
  },
  {
    name: "Links",
    description: "Monitor clicks on specific URLs",
    icon: Link2,
    implemented: true,
    difficulty: "medium",
    category: "analytics",
  },
  {
    name: "Pixels",
    description: "Embed tracking pixels anywhere",
    icon: Image,
    implemented: true,
    difficulty: "medium",
    category: "analytics",
  },
  {
    name: "Data Import",
    description: "Import existing analytics data",
    icon: Upload,
    implemented: false,
    difficulty: "medium",
    category: "cloud",
  },

  // NOT IMPLEMENTED - Hard
  {
    name: "Insights",
    description: "Build custom insights for specific sites",
    icon: Lightbulb,
    implemented: true,
    difficulty: "hard",
    category: "insights",
  },
  {
    name: "Cohorts",
    description: "Group users based on specific actions",
    icon: Users,
    implemented: true,
    difficulty: "hard",
    category: "insights",
  },
  {
    name: "Breakdown",
    description: "Dive deeper with segments and filters",
    icon: Database,
    implemented: false,
    difficulty: "hard",
    category: "insights",
  },
  {
    name: "Journey",
    description: "Visualize how users navigate your site",
    icon: Route,
    implemented: false,
    difficulty: "hard",
    category: "insights",
  },
  {
    name: "Revenue",
    description: "Track ecommerce and spending data",
    icon: DollarSign,
    implemented: false,
    difficulty: "hard",
    category: "insights",
  },
  {
    name: "Attribution",
    description: "See what drives conversions",
    icon: Magnet,
    implemented: false,
    difficulty: "hard",
    category: "insights",
  },
  {
    name: "Email Reports",
    description: "Send scheduled email summaries",
    icon: Mail,
    implemented: false,
    difficulty: "hard",
    category: "cloud",
  },
  {
    name: "High Performance",
    description: "Optimized for billions of records",
    icon: Gauge,
    implemented: false,
    difficulty: "hard",
    category: "cloud",
  },
  {
    name: "Shopify Integration",
    description: "Connect Shopify for automatic revenue tracking",
    icon: ShoppingBag,
    implemented: false,
    difficulty: "hard",
    category: "cloud",
  },
  {
    name: "Google Search Console",
    description: "Visualize SEO keywords and organic traffic",
    icon: Search,
    implemented: false,
    difficulty: "medium",
    category: "insights",
  },
  {
    name: "X (Twitter) Analytics",
    description: "Track mentions and link clicks from X",
    icon: Twitter,
    implemented: true,
    difficulty: "medium",
    category: "analytics",
  },
  {
    name: "Public API",
    description: "Access your data programmatically",
    icon: Code2,
    implemented: true,
    difficulty: "medium",
    category: "cloud",
  },
  {
    name: "Cross-domain Tracking",
    description: "Unified analytics across multiple domains",
    icon: Globe2,
    implemented: true,
    difficulty: "hard",
    category: "analytics",
  },
  {
    name: "White Labeling",
    description: "Custom branding and logo for your dashboard",
    icon: LayoutTemplate,
    implemented: false,
    difficulty: "medium",
    category: "cloud",
  },
  {
    name: "Webhooks",
    description: "Slack/Discord notifications for traffic spikes",
    icon: Bell,
    implemented: true,
    difficulty: "medium",
    category: "cloud",
  },
  {
    name: "GA Import",
    description: "Import historical data from Google Analytics",
    icon: Database,
    implemented: false,
    difficulty: "hard",
    category: "cloud",
  },
];

// Sort: implemented first, then by difficulty (easy -> medium -> hard)
const difficultyOrder = { easy: 0, medium: 1, hard: 2 };
const sortedFeatures = [...features].sort((a, b) => {
  if (a.implemented !== b.implemented) return a.implemented ? -1 : 1;
  return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
});

const categoryColors = {
  analytics: "from-primary/20 to-primary/5 border-primary/20",
  insights: "from-secondary/20 to-secondary/5 border-secondary/20",
  privacy: "from-success/20 to-success/5 border-success/20",
  cloud: "from-info/20 to-info/5 border-info/20",
};

const categoryLabels = {
  analytics: "Analytics",
  insights: "Insights",
  privacy: "Privacy",
  cloud: "Cloud",
};

const difficultyBadge = {
  easy: "bg-green-500 hover:bg-green-600 border-none text-white",
  medium: "bg-yellow-500 hover:bg-yellow-600 border-none text-white",
  hard: "bg-red-500 hover:bg-red-600 border-none text-white",
};



export default function Roadmap() {
  const implementedCount = features.filter((f) => f.implemented).length;
  const totalCount = features.length;
  const progress = Math.round((implementedCount / totalCount) * 100);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <BarChart3 className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold">mmmetric</span>
            </Link>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            Feature Roadmap
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Building the Future of
            <span className="text-primary"> Privacy Analytics</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            We're building a comprehensive analytics platform. Here's our progress and what's coming next.
          </p>

          {/* Progress Bar */}
          <div className="bg-muted/50 rounded-2xl p-6 max-w-md mx-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm font-bold text-primary">
                {implementedCount}/{totalCount} features
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div
                className="bg-gradient-to-r from-primary to-secondary h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">{progress}% complete</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Easy</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Hard</span>
          </div>
          <div className="divider divider-horizontal"></div>
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-green-500" />
            <span>Implemented</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>Planned</span>
          </div>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.name}
                className={`
                  relative group rounded-2xl border p-5 transition-all duration-300
                  bg-gradient-to-br ${categoryColors[feature.category]}
                  ${feature.implemented
                    ? "opacity-100 hover:scale-[1.02] hover:shadow-lg"
                    : "opacity-70 hover:opacity-90"
                  }
                `}
              >
                {/* Status indicator */}
                <div className="absolute top-3 right-3">
                  {feature.implemented ? (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-700">
                      <Check className="h-4 w-4" />
                    </div>
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <Clock className="h-4 w-4" />
                    </div>
                  )}
                </div>

                {/* Icon */}
                <div
                  className={`
                  flex h-10 w-10 items-center justify-center rounded-xl mb-3
                  ${feature.implemented ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}
                `}
                >
                  <Icon className="h-5 w-5" />
                </div>

                {/* Content */}
                <h3 className="font-semibold mb-1">{feature.name}</h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{feature.description}</p>

                {/* Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={feature.difficulty === 'easy' ? 'default' : feature.difficulty === 'medium' ? 'secondary' : 'destructive'} className={feature.difficulty === 'easy' ? 'bg-green-500 hover:bg-green-600' : feature.difficulty === 'medium' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}>{feature.difficulty}</Badge>
                  <Badge variant="outline">{categoryLabels[feature.category]}</Badge>
                </div>
              </div>
            );
          })}
        </div>

        {/* Stats Section */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(categoryLabels).map(([key, label]) => {
            const categoryFeatures = features.filter((f) => f.category === (key as keyof typeof categoryLabels));
            const implemented = categoryFeatures.filter((f) => f.implemented).length;
            return (
              <div key={key} className="bg-muted/50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-primary">
                  {implemented}/{categoryFeatures.length}
                </div>
                <div className="text-sm text-muted-foreground">{label}</div>
              </div>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Want to contribute?</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            mmmetric is open source. Help us build the best privacy-first analytics platform.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button asChild>
              <a
                href="https://github.com/dailydimaz/mmmetric"
                target="_blank"
                rel="noopener noreferrer"
              >
                View on GitHub
              </a>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/auth">
                Get Started Free
              </Link>
            </Button>
          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-border py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} mmmetric Analytics. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
