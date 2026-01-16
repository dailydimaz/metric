import { useState } from "react";
import { X, Target, Loader2 } from "lucide-react";
import { useCreateGoal } from "@/hooks/useGoals";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GoalSetupProps {
  siteId: string;
  onClose: () => void;
}

export function GoalSetup({ siteId, onClose }: GoalSetupProps) {
  const [name, setName] = useState("");
  const [eventName, setEventName] = useState("pageview");
  const [urlMatch, setUrlMatch] = useState("");
  const [matchType, setMatchType] = useState<"exact" | "contains" | "starts_with" | "regex">("contains");

  const createGoal = useCreateGoal();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for this goal.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createGoal.mutateAsync({
        site_id: siteId,
        name: name.trim(),
        event_name: eventName,
        url_match: urlMatch.trim() || null,
        match_type: matchType,
      });

      toast({
        title: "Goal created",
        description: `"${name}" is now tracking conversions.`,
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create goal. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Create Goal
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Goal Name</Label>
            <Input
              placeholder="e.g., Sign Up Completed"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Event Type</Label>
            <Select value={eventName} onValueChange={setEventName}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pageview">Pageview</SelectItem>
                <SelectItem value="click">Click</SelectItem>
                <SelectItem value="signup">Sign Up</SelectItem>
                <SelectItem value="purchase">Purchase</SelectItem>
                <SelectItem value="download">Download</SelectItem>
                <SelectItem value="form_submit">Form Submit</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[0.8rem] text-muted-foreground">
              Select the event type to track as a conversion
            </p>
          </div>

          <div className="space-y-2">
            <Label>URL Pattern (optional)</Label>
            <Input
              placeholder="e.g., /thank-you"
              value={urlMatch}
              onChange={(e) => setUrlMatch(e.target.value)}
            />
          </div>

          {urlMatch && (
            <div className="space-y-2">
              <Label>Match Type</Label>
              <Select value={matchType} onValueChange={(val: any) => setMatchType(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contains">Contains</SelectItem>
                  <SelectItem value="exact">Exact Match</SelectItem>
                  <SelectItem value="starts_with">Starts With</SelectItem>
                  <SelectItem value="regex">Regex</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="bg-muted rounded-lg p-3 text-sm text-muted-foreground">
            <p>
              <strong>Goal will track:</strong>{" "}
              {eventName === "pageview" ? "page views" : `${eventName} events`}
              {urlMatch && ` where URL ${matchType.replace("_", " ")} "${urlMatch}"`}
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createGoal.isPending}
            >
              {createGoal.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Goal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
