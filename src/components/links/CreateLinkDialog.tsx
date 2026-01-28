import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLinks, generateSlug, getShortUrl } from "@/hooks/useLinks";
import { Loader2, Link2, Shuffle } from "lucide-react";

interface CreateLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteId: string;
  initialUrl?: string;
}

export function CreateLinkDialog({
  open,
  onOpenChange,
  siteId,
  initialUrl = "",
}: CreateLinkDialogProps) {
  const [url, setUrl] = useState(initialUrl);
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const { createLink } = useLinks(siteId);

  // Update URL when initialUrl changes (e.g., when dialog reopens with new URL)
  useEffect(() => {
    if (open && initialUrl) {
      setUrl(initialUrl);
    }
  }, [open, initialUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) return;

    try {
      await createLink.mutateAsync({
        siteId,
        originalUrl: url.trim(),
        slug: slug.trim() || undefined,
        description: description.trim() || undefined,
      });
      
      // Reset form and close
      setUrl("");
      setSlug("");
      setDescription("");
      onOpenChange(false);
    } catch {
      // Error handled in hook
    }
  };

  const handleRandomSlug = () => {
    setSlug(generateSlug());
  };

  const previewUrl = slug ? getShortUrl(slug) : "Will be generated automatically";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Create Short Link
          </DialogTitle>
          <DialogDescription>
            Create a trackable short link that redirects to your destination URL.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">Destination URL *</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com/your-page"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Custom Slug (optional)</Label>
            <div className="flex gap-2">
              <Input
                id="slug"
                placeholder="my-link"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleRandomSlug}
                title="Generate random slug"
              >
                <Shuffle className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Preview: {previewUrl}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="What is this link for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createLink.isPending || !url.trim()}>
              {createLink.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Link
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
