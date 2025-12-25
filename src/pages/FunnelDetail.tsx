import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangePicker } from "@/components/analytics/DateRangePicker";
import { FunnelChart } from "@/components/analytics/FunnelChart";
import { FunnelBuilder } from "@/components/analytics/FunnelBuilder";
import { useFunnelAnalytics, useDeleteFunnel } from "@/hooks/useFunnels";
import { ArrowLeft, Pencil, Trash2, Clock, GitBranch } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DateRange } from "@/hooks/useAnalytics";

export default function FunnelDetail() {
  const { funnelId } = useParams<{ funnelId: string }>();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [showBuilder, setShowBuilder] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data, isLoading } = useFunnelAnalytics(funnelId, dateRange);
  const deleteFunnel = useDeleteFunnel();

  const handleDelete = async () => {
    if (data?.funnel) {
      await deleteFunnel.mutateAsync({ 
        id: data.funnel.id, 
        siteId: data.funnel.site_id 
      });
      navigate(`/dashboard/sites/${data.funnel.site_id}`);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="skeleton h-8 w-48" />
          <div className="skeleton h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!data?.funnel) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <GitBranch className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Funnel not found</h2>
          <p className="text-muted-foreground mb-4">
            This funnel may have been deleted or you don't have access to it.
          </p>
          <Button onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const { funnel, stepAnalytics, totalVisitors, overallConversion } = data;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/dashboard/sites/${funnel.site_id}`)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{funnel.name}</h1>
              {funnel.description && (
                <p className="text-muted-foreground">{funnel.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DateRangePicker value={dateRange} onChange={setDateRange} />
            <Button variant="outline" size="icon" onClick={() => setShowBuilder(true)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <GitBranch className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Entered</p>
                  <p className="text-2xl font-bold">{totalVisitors.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <GitBranch className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Converted</p>
                  <p className="text-2xl font-bold">
                    {stepAnalytics[stepAnalytics.length - 1]?.visitors.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Time Window</p>
                  <p className="text-2xl font-bold">{funnel.time_window_days} days</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Funnel Visualization */}
        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <FunnelChart steps={stepAnalytics} />
          </CardContent>
        </Card>

        {/* Steps Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Step Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Step
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                      Visitors
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                      Conversion
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                      Drop-off
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stepAnalytics.map((step, index) => (
                    <tr key={step.step_index} className="border-b border-border last:border-0">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground">
                            {index + 1}.
                          </span>
                          <span className="text-sm font-medium">{step.step_name}</span>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4 text-sm">
                        {step.visitors.toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-4">
                        <span className="text-sm font-medium text-green-500">
                          {step.conversion_rate}%
                        </span>
                      </td>
                      <td className="text-right py-3 px-4">
                        {index > 0 && step.drop_off_rate > 0 ? (
                          <span className="text-sm text-destructive">
                            -{step.drop_off_rate}%
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <FunnelBuilder
        siteId={funnel.site_id}
        funnel={funnel}
        open={showBuilder}
        onOpenChange={setShowBuilder}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Funnel</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{funnel.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
