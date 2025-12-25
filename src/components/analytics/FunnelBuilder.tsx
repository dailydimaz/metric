import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Trash2, GripVertical, ArrowDown } from "lucide-react";
import { FunnelStep, useCreateFunnel, useUpdateFunnel, Funnel } from "@/hooks/useFunnels";

interface FunnelBuilderProps {
  siteId: string;
  funnel?: Funnel;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FunnelBuilder({ siteId, funnel, open, onOpenChange }: FunnelBuilderProps) {
  const [name, setName] = useState(funnel?.name || "");
  const [description, setDescription] = useState(funnel?.description || "");
  const [timeWindowDays, setTimeWindowDays] = useState(funnel?.time_window_days || 7);
  const [steps, setSteps] = useState<FunnelStep[]>(
    funnel?.steps || [
      { id: crypto.randomUUID(), event_name: "pageview", url_match: "", match_type: "contains" },
    ]
  );

  const createFunnel = useCreateFunnel();
  const updateFunnel = useUpdateFunnel();

  const addStep = () => {
    setSteps([
      ...steps,
      { id: crypto.randomUUID(), event_name: "pageview", url_match: "", match_type: "contains" },
    ]);
  };

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index));
    }
  };

  const updateStep = (index: number, updates: Partial<FunnelStep>) => {
    setSteps(steps.map((step, i) => (i === index ? { ...step, ...updates } : step)));
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    if (steps.length < 2) return;

    try {
      if (funnel) {
        await updateFunnel.mutateAsync({
          id: funnel.id,
          name,
          description,
          steps,
          time_window_days: timeWindowDays,
        });
      } else {
        await createFunnel.mutateAsync({
          site_id: siteId,
          name,
          description,
          steps,
          time_window_days: timeWindowDays,
        });
      }
      onOpenChange(false);
      // Reset form
      setName("");
      setDescription("");
      setSteps([{ id: crypto.randomUUID(), event_name: "pageview", url_match: "", match_type: "contains" }]);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isLoading = createFunnel.isPending || updateFunnel.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{funnel ? "Edit Funnel" : "Create Funnel"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Funnel Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Funnel Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Signup Flow"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Track users from landing to signup"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeWindow">Time Window (days)</Label>
              <Select
                value={timeWindowDays.toString()}
                onValueChange={(v) => setTimeWindowDays(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="3">3 days</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Users must complete all steps within this time window
              </p>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            <Label>Funnel Steps</Label>
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div key={step.id}>
                  <div className="flex items-start gap-3 p-4 border border-border rounded-lg bg-card">
                    <div className="flex items-center gap-2 pt-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground w-6">
                        {index + 1}.
                      </span>
                    </div>

                    <div className="flex-1 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Event Name</Label>
                          <Select
                            value={step.event_name}
                            onValueChange={(v) => updateStep(index, { event_name: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pageview">Pageview</SelectItem>
                              <SelectItem value="click">Click</SelectItem>
                              <SelectItem value="signup">Signup</SelectItem>
                              <SelectItem value="login">Login</SelectItem>
                              <SelectItem value="purchase">Purchase</SelectItem>
                              <SelectItem value="custom">Custom Event</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Match Type</Label>
                          <Select
                            value={step.match_type}
                            onValueChange={(v) =>
                              updateStep(index, { match_type: v as FunnelStep["match_type"] })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="contains">Contains</SelectItem>
                              <SelectItem value="exact">Exact Match</SelectItem>
                              <SelectItem value="starts_with">Starts With</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">URL Match (optional)</Label>
                        <Input
                          value={step.url_match || ""}
                          onChange={(e) => updateStep(index, { url_match: e.target.value })}
                          placeholder="e.g., /pricing or /signup"
                        />
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeStep(index)}
                      disabled={steps.length <= 1}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {index < steps.length - 1 && (
                    <div className="flex justify-center py-2">
                      <ArrowDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <Button variant="outline" onClick={addStep} className="w-full" disabled={steps.length >= 10}>
              <Plus className="h-4 w-4 mr-2" />
              Add Step
            </Button>

            {steps.length < 2 && (
              <p className="text-xs text-destructive">A funnel needs at least 2 steps</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || steps.length < 2 || isLoading}
          >
            {isLoading ? "Saving..." : funnel ? "Update Funnel" : "Create Funnel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
