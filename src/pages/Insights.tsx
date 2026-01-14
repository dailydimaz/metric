import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { InsightsList } from "@/components/analytics/InsightsList";
import { InsightsBuilder } from "@/components/analytics/InsightsBuilder";
import { Insight } from "@/hooks/useInsights";

type View = "list" | "create" | "edit" | "view";

export default function Insights() {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();
  const [view, setView] = useState<View>("list");
  const [selectedInsight, setSelectedInsight] = useState<Insight | undefined>();

  if (!siteId) {
    return null;
  }

  const handleView = (insight: Insight) => {
    // Navigate to the insight view with applied filters and date range
    const params = new URLSearchParams();

    // Add date range
    if (insight.date_range.preset) {
      params.set("range", insight.date_range.preset);
    } else if (insight.date_range.startDate && insight.date_range.endDate) {
      params.set("from", insight.date_range.startDate);
      params.set("to", insight.date_range.endDate);
    }

    // Add filters
    if (insight.filters.country) params.set("country", insight.filters.country);
    if (insight.filters.browser) params.set("browser", insight.filters.browser);
    if (insight.filters.os) params.set("os", insight.filters.os);
    if (insight.filters.device) params.set("device", insight.filters.device);

    // Add widgets
    if (insight.widgets && insight.widgets.length > 0) {
      params.set("widgets", insight.widgets.join(","));
    }

    navigate(`/dashboard/sites/${siteId}?${params.toString()}`);
  };

  const handleEdit = (insight: Insight) => {
    setSelectedInsight(insight);
    setView("edit");
  };

  const handleBack = () => {
    setView("list");
    setSelectedInsight(undefined);
  };

  const handleSave = () => {
    setView("list");
    setSelectedInsight(undefined);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        {view === "list" && (
          <InsightsList
            siteId={siteId}
            onCreateNew={() => setView("create")}
            onView={handleView}
            onEdit={handleEdit}
          />
        )}

        {(view === "create" || view === "edit") && (
          <InsightsBuilder
            siteId={siteId}
            insight={selectedInsight}
            onBack={handleBack}
            onSave={handleSave}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
