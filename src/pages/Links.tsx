import { useState } from "react";
import { useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { CreateLinkDialog } from "@/components/links/CreateLinkDialog";
import { useLinks, getShortUrl, useLinkClicks } from "@/hooks/useLinks";
import { isBillingEnabled } from "@/lib/billing";
import { formatDistanceToNow } from "date-fns";
import {
  Link2,
  Plus,
  Trash2,
  Copy,
  ExternalLink,
  Loader2,
  MousePointerClick,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

function LinkClickCount({ linkId, siteId }: { linkId: string; siteId: string }) {
  const { data: clicks, isLoading } = useLinkClicks(linkId, siteId);
  
  if (isLoading) return <Skeleton className="h-4 w-8" />;
  
  return (
    <span className="flex items-center gap-1 text-sm">
      <MousePointerClick className="h-3 w-3" />
      {clicks || 0}
    </span>
  );
}

export default function Links() {
  const { siteId } = useParams<{ siteId: string }>();
  const { links, isLoading, deleteLink } = useLinks(siteId || null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<string | null>(null);

  // Feature gate for cloud-only
  if (!isBillingEnabled()) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Link2 className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Links Feature</h2>
          <p className="text-muted-foreground max-w-md">
            Short link tracking is available on MMMetric Cloud. Self-hosted installations
            can use the Campaign Builder for UTM link creation.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (!siteId) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Please select a site first.</p>
        </div>
      </DashboardLayout>
    );
  }

  const handleCopy = async (slug: string) => {
    const shortUrl = getShortUrl(slug);
    await navigator.clipboard.writeText(shortUrl);
    toast.success("Short link copied to clipboard!");
  };

  const handleDelete = async () => {
    if (!linkToDelete) return;
    await deleteLink.mutateAsync(linkToDelete);
    setDeleteDialogOpen(false);
    setLinkToDelete(null);
  };

  const confirmDelete = (linkId: string) => {
    setLinkToDelete(linkId);
    setDeleteDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Short Links</h1>
            <p className="text-muted-foreground">
              Create trackable short links for your campaigns
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Link
          </Button>
        </div>

        {/* Links Table */}
        <Card>
          <CardHeader>
            <CardTitle>Your Links</CardTitle>
            <CardDescription>
              All short links for this site. Click counts update in real-time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 flex-1" />
                    <Skeleton className="h-10 w-20" />
                  </div>
                ))}
              </div>
            ) : links && links.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Short Link</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Clicks</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {links.map((link) => (
                    <TableRow key={link.id}>
                      <TableCell className="font-mono text-sm">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[150px]">{link.slug}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleCopy(link.slug)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <a
                          href={link.original_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-primary hover:underline truncate max-w-[200px]"
                        >
                          {new URL(link.original_url).hostname}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm truncate max-w-[150px]">
                        {link.description || "-"}
                      </TableCell>
                      <TableCell>
                        <LinkClickCount linkId={link.id} siteId={siteId} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(link.created_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => confirmDelete(link.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <Link2 className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="font-semibold mb-1">No links yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first short link to start tracking clicks.
                </p>
                <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Link
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Dialog */}
      <CreateLinkDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        siteId={siteId}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Link</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this short link? This action cannot be undone
              and the link will stop working immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLink.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
