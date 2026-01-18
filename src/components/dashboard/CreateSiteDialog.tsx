import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSites } from "@/hooks/useSites";
import { Loader2, Globe, Layout } from "lucide-react";
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
      <DialogContent className="sm:max-w-[425px] overflow-hidden border-border/60 shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/40 to-primary"></div>
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Globe className="h-5 w-5" />
            </div>
            Create a new site
          </DialogTitle>
          <DialogDescription className="pt-2">
            Add a new website or application to track with Metric.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Site name</Label>
            <div className="relative">
              <Input
                id="name"
                placeholder="My Website"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="pl-9 transition-all focus-visible:ring-primary/30"
              />
              <div className="absolute left-3 top-2.5 text-muted-foreground/50">
                <Layout className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="domain">Domain (optional)</Label>
            <div className="relative">
              <Input
                id="domain"
                placeholder="example.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="pl-9 transition-all focus-visible:ring-primary/30"
              />
              <div className="absolute left-3 top-2.5 text-muted-foreground/50">
                <Globe className="h-4 w-4" />
              </div>
            </div>
            <p className="text-[0.8rem] text-muted-foreground/80">
              The domain where your site is hosted
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
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
              className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
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
