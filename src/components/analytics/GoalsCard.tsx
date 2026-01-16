import { useState } from "react";
import { Target, TrendingUp, Plus, Trash2 } from "lucide-react";
import { useGoalStats, useDeleteGoal, GoalStats } from "@/hooks/useGoals";
import { DateRange } from "@/hooks/useAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";

interface GoalsCardProps {
  siteId: string;
  dateRange: DateRange;
  onCreateGoal: () => void;
}

function GoalRow({ goalStats, onDelete }: { goalStats: GoalStats; onDelete: () => void }) {
  return (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg group border border-transparent hover:border-border transition-colors">
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate text-sm">{goalStats.goal.name}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{goalStats.goal.event_name}</span>
          {goalStats.goal.url_match && (
            <>
              <span>•</span>
              <span className="truncate">{goalStats.goal.url_match}</span>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="font-bold text-lg">{goalStats.conversions}</p>
          <p className="text-xs text-muted-foreground">conversions</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-emerald-600">
            <TrendingUp className="h-4 w-4" />
            <span className="font-bold">{goalStats.conversionRate.toFixed(1)}%</span>
          </div>
          <p className="text-xs text-muted-foreground">rate</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function GoalsCard({ siteId, dateRange, onCreateGoal }: GoalsCardProps) {
  const { data: goalStats, isLoading } = useGoalStats({ siteId, dateRange });
  const deleteGoal = useDeleteGoal();
  const { toast } = useToast();
  const [goalToDelete, setGoalToDelete] = useState<{ id: string; name: string } | null>(null);

  const confirmDelete = async () => {
    if (!goalToDelete) return;

    try {
      await deleteGoal.mutateAsync({ id: goalToDelete.id, siteId });
      toast({
        title: "Goal deleted",
        description: `"${goalToDelete.name}" has been removed.`,
      });
      setGoalToDelete(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete goal.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-semibold">Goals & Conversions</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onCreateGoal}>
            <Plus className="h-4 w-4 mr-2" />
            Add Goal
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 pt-2">
            {isLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))
            ) : goalStats && goalStats.length > 0 ? (
              goalStats.map((stats) => (
                <GoalRow
                  key={stats.goal.id}
                  goalStats={stats}
                  onDelete={() => setGoalToDelete({ id: stats.goal.id, name: stats.goal.name })}
                />
              ))
            ) : (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-3">
                  Track conversions by creating goals
                </p>
                <Button size="sm" onClick={onCreateGoal}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Goal
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!goalToDelete} onOpenChange={(open) => !open && setGoalToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete goal?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-medium text-foreground">"{goalToDelete?.name}"</span>?
              This will stop tracking conversions for this goal. Historic data will remain.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
