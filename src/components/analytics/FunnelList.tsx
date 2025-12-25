import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Plus, MoreVertical, Pencil, Trash2, GitBranch, ChevronRight } from "lucide-react";
import { useFunnels, useDeleteFunnel, Funnel } from "@/hooks/useFunnels";
import { FunnelBuilder } from "./FunnelBuilder";
import { format } from "date-fns";
import { Link } from "react-router-dom";

interface FunnelListProps {
  siteId: string;
}

export function FunnelList({ siteId }: FunnelListProps) {
  const { data: funnels, isLoading } = useFunnels(siteId);
  const deleteFunnel = useDeleteFunnel();
  
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingFunnel, setEditingFunnel] = useState<Funnel | undefined>();
  const [deletingFunnel, setDeletingFunnel] = useState<Funnel | undefined>();

  const handleEdit = (funnel: Funnel) => {
    setEditingFunnel(funnel);
    setShowBuilder(true);
  };

  const handleDelete = async () => {
    if (deletingFunnel) {
      await deleteFunnel.mutateAsync({ id: deletingFunnel.id, siteId });
      setDeletingFunnel(undefined);
    }
  };

  const handleBuilderClose = (open: boolean) => {
    setShowBuilder(open);
    if (!open) {
      setEditingFunnel(undefined);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Funnels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="skeleton h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Funnels
          </CardTitle>
          <Button size="sm" onClick={() => setShowBuilder(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Funnel
          </Button>
        </CardHeader>
        <CardContent>
          {!funnels || funnels.length === 0 ? (
            <div className="text-center py-8">
              <GitBranch className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground mb-4">No funnels created yet</p>
              <Button variant="outline" onClick={() => setShowBuilder(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Funnel
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {funnels.map((funnel) => (
                <div
                  key={funnel.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Link
                    to={`/dashboard/funnels/${funnel.id}`}
                    className="flex-1 min-w-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <GitBranch className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-medium text-foreground truncate">
                          {funnel.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {funnel.steps.length} steps • {funnel.time_window_days}d window
                        </p>
                      </div>
                    </div>
                  </Link>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      {format(new Date(funnel.created_at), "MMM d, yyyy")}
                    </span>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(funnel)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeletingFunnel(funnel)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Link to={`/dashboard/funnels/${funnel.id}`}>
                      <Button variant="ghost" size="icon">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <FunnelBuilder
        siteId={siteId}
        funnel={editingFunnel}
        open={showBuilder}
        onOpenChange={handleBuilderClose}
      />

      <AlertDialog open={!!deletingFunnel} onOpenChange={() => setDeletingFunnel(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Funnel</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingFunnel?.name}"? This action cannot be undone.
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
    </>
  );
}
