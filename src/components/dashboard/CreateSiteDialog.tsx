import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSites } from "@/hooks/useSites";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateSiteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateSiteDialog({ open, onOpenChange }: CreateSiteDialogProps) {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const { createSite } = useSites();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const site = await createSite.mutateAsync({ name, domain });
      onOpenChange(false);
      setName("");
      setDomain("");
      navigate(`/dashboard/sites/${site.id}`);
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create a new site</DialogTitle>
          <DialogDescription>
            Add a new website or application to track with Metric.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Site name</Label>
            <Input
              id="name"
              placeholder="My Website"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="domain">Domain (optional)</Label>
            <Input
              id="domain"
              placeholder="example.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              The domain where your site is hosted
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name || createSite.isPending}
            >
              {createSite.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create site
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
