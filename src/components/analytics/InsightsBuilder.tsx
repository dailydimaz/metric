import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Save,
  Filter,
  Calendar,
  LayoutGrid,
  Sparkles,
} from "lucide-react";
import { useInsights, Insight, InsightFilters, InsightDateRange } from "@/hooks/useInsights";

interface InsightsBuilderProps {
  siteId: string;
  insight?: Insight;
  onBack: () => void;
  onSave: () => void;
}

const WIDGET_OPTIONS = [
  { id: "visitors", label: "Unique Visitors", description: "Total unique visitors" },
  { id: "pageviews", label: "Page Views", description: "Total page views" },
  { id: "bounce_rate", label: "Bounce Rate", description: "Single-page session percentage" },
  { id: "avg_duration", label: "Avg. Session Duration", description: "Average time on site" },
  { id: "top_pages", label: "Top Pages", description: "Most visited pages" },
  { id: "top_referrers", label: "Top Referrers", description: "Traffic sources" },
  { id: "geo_stats", label: "Geographic Stats", description: "Visitors by country" },
  { id: "device_stats", label: "Device Stats", description: "Browser, OS, device breakdown" },
  { id: "visitor_chart", label: "Visitor Chart", description: "Time series visualization" },
];

const DATE_PRESETS = [
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "12m", label: "Last 12 months" },
  { value: "custom", label: "Custom Range" },
];

export function InsightsBuilder({ siteId, insight, onBack, onSave }: InsightsBuilderProps) {
  const { createInsight, updateInsight } = useInsights(siteId);
  const isEditing = !!insight;

  const [name, setName] = useState(insight?.name || "");
  const [description, setDescription] = useState(insight?.description || "");
  const [dateRange, setDateRange] = useState<InsightDateRange>(
    insight?.date_range || { preset: "7d" }
  );
  const [filters, setFilters] = useState<InsightFilters>(insight?.filters || {});
  const [widgets, setWidgets] = useState<string[]>(
    insight?.widgets || ["visitors", "pageviews", "top_pages", "visitor_chart"]
  );

  const toggleWidget = (widgetId: string) => {
    setWidgets((prev) =>
      prev.includes(widgetId)
        ? prev.filter((w) => w !== widgetId)
        : [...prev, widgetId]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) return;

    const data = {
      name: name.trim(),
      description: description.trim() || undefined,
      filters,
      date_range: dateRange,
      widgets,
    };

    if (isEditing) {
      await updateInsight.mutateAsync({ id: insight.id, ...data });
    } else {
      await createInsight.mutateAsync({ site_id: siteId, ...data });
    }
    onSave();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Insights
        </Button>
        <Button
          onClick={handleSave}
          disabled={!name.trim() || createInsight.isPending || updateInsight.isPending}
        >
          <Save className="h-4 w-4 mr-2" />
          {isEditing ? "Update" : "Save"} Insight
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            {isEditing ? "Edit Insight" : "Create New Insight"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="filters">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </TabsTrigger>
              <TabsTrigger value="widgets">
                <LayoutGrid className="h-4 w-4 mr-2" />
                Widgets
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Weekly Traffic Report"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this insight tracks..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date Range
                </Label>
                <Select
                  value={dateRange.preset || "custom"}
                  onValueChange={(value) => {
                    if (value === "custom") {
                      setDateRange({ startDate: "", endDate: "" });
                    } else {
                      setDateRange({ preset: value });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DATE_PRESETS.map((preset) => (
                      <SelectItem key={preset.value} value={preset.value}>
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {!dateRange.preset && (
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={dateRange.startDate || ""}
                        onChange={(e) =>
                          setDateRange({ ...dateRange, startDate: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={dateRange.endDate || ""}
                        onChange={(e) =>
                          setDateRange({ ...dateRange, endDate: e.target.value })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="filters" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Filter the data shown in this insight. Leave empty to include all data.
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input
                    placeholder="e.g., US"
                    value={filters.country || ""}
                    onChange={(e) =>
                      setFilters({ ...filters, country: e.target.value || undefined })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Browser</Label>
                  <Input
                    placeholder="e.g., Chrome"
                    value={filters.browser || ""}
                    onChange={(e) =>
                      setFilters({ ...filters, browser: e.target.value || undefined })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Operating System</Label>
                  <Input
                    placeholder="e.g., Windows"
                    value={filters.os || ""}
                    onChange={(e) =>
                      setFilters({ ...filters, os: e.target.value || undefined })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Device Type</Label>
                  <Select
                    value={filters.device || "all"}
                    onValueChange={(value) =>
                      setFilters({ ...filters, device: value === "all" ? undefined : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any device" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any device</SelectItem>
                      <SelectItem value="desktop">Desktop</SelectItem>
                      <SelectItem value="mobile">Mobile</SelectItem>
                      <SelectItem value="tablet">Tablet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>URL Contains</Label>
                  <Input
                    placeholder="e.g., /blog"
                    value={filters.url || ""}
                    onChange={(e) =>
                      setFilters({ ...filters, url: e.target.value || undefined })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Referrer Contains</Label>
                  <Input
                    placeholder="e.g., google.com"
                    value={filters.referrerPattern || ""}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        referrerPattern: e.target.value || undefined,
                      })
                    }
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="widgets" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Choose which data widgets to include in this insight.
              </p>

              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {WIDGET_OPTIONS.map((widget) => (
                  <label
                    key={widget.id}
                    className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${widgets.includes(widget.id)
                        ? "bg-primary/5 border-primary"
                        : "hover:bg-accent"
                      }`}
                  >
                    <Checkbox
                      checked={widgets.includes(widget.id)}
                      onCheckedChange={() => toggleWidget(widget.id)}
                    />
                    <div>
                      <p className="font-medium">{widget.label}</p>
                      <p className="text-sm text-muted-foreground">{widget.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
