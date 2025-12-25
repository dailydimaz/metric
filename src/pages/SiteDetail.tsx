import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSites } from "@/hooks/useSites";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { 
  ArrowLeft, 
  Globe, 
  Clock, 
  Copy, 
  Check, 
  Trash2, 
  Settings,
  Code
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SiteDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const { sites, isLoading: sitesLoading, deleteSite, updateSite } = useSites();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDomain, setEditDomain] = useState("");

  const site = sites.find((s) => s.id === id);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (site) {
      setEditName(site.name);
      setEditDomain(site.domain || "");
    }
  }, [site]);

  const copyTrackingId = async () => {
    if (!site) return;
    await navigator.clipboard.writeText(site.tracking_id);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Tracking ID copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const copyScript = async () => {
    if (!site) return;
    const script = `<script defer src="https://metric.example.com/track.js" data-site="${site.tracking_id}"></script>`;
    await navigator.clipboard.writeText(script);
    toast({
      title: "Copied!",
      description: "Tracking script copied to clipboard",
    });
  };

  const handleDelete = async () => {
    if (!site) return;
    if (window.confirm(`Are you sure you want to delete "${site.name}"? This action cannot be undone.`)) {
      await deleteSite.mutateAsync(site.id);
      navigate("/dashboard");
    }
  };

  const handleSave = async () => {
    if (!site) return;
    await updateSite.mutateAsync({
      id: site.id,
      name: editName,
      domain: editDomain || undefined,
    });
    setIsEditing(false);
  };

  if (authLoading || sitesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!site) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-16">
          <h2 className="text-xl font-semibold">Site not found</h2>
          <p className="mt-2 text-base-content/70">This site doesn't exist or you don't have access to it.</p>
          <button className="btn btn-primary mt-6" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button 
            className="btn btn-ghost btn-sm btn-circle"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                className="input input-bordered text-2xl font-bold w-full max-w-xs"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                autoFocus
              />
            ) : (
              <h1 className="text-2xl font-bold tracking-tight">{site.name}</h1>
            )}
            <p className="text-base-content/70 flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {isEditing ? (
                <input
                  type="text"
                  className="input input-bordered input-sm"
                  value={editDomain}
                  onChange={(e) => setEditDomain(e.target.value)}
                  placeholder="example.com"
                />
              ) : (
                site.domain || "No domain set"
              )}
            </p>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button className="btn btn-ghost" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={handleSave}
                  disabled={updateSite.isPending}
                >
                  {updateSite.isPending ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    "Save"
                  )}
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-ghost" onClick={() => setIsEditing(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Edit
                </button>
                <button 
                  className="btn btn-error btn-outline" 
                  onClick={handleDelete}
                  disabled={deleteSite.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </button>
              </>
            )}
          </div>
        </div>

        {/* Site Info Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Tracking ID */}
          <div className="card bg-base-200">
            <div className="card-body">
              <h3 className="card-title text-sm font-medium text-base-content/70">
                Tracking ID
              </h3>
              <div className="flex items-center gap-2">
                <code className="flex-1 font-mono text-sm bg-base-300 px-3 py-2 rounded-lg truncate">
                  {site.tracking_id}
                </code>
                <button 
                  className="btn btn-ghost btn-sm btn-square"
                  onClick={copyTrackingId}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Timezone */}
          <div className="card bg-base-200">
            <div className="card-body">
              <h3 className="card-title text-sm font-medium text-base-content/70">
                Timezone
              </h3>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-base-content/70" />
                <span>{site.timezone || "UTC"}</span>
              </div>
            </div>
          </div>

          {/* Created */}
          <div className="card bg-base-200">
            <div className="card-body">
              <h3 className="card-title text-sm font-medium text-base-content/70">
                Created
              </h3>
              <span>
                {new Date(site.created_at).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Installation */}
        <div className="card bg-base-200">
          <div className="card-body">
            <h3 className="card-title">
              <Code className="h-5 w-5" />
              Installation
            </h3>
            <p className="text-base-content/70">
              Add this script to your website's <code className="bg-base-300 px-1 rounded">&lt;head&gt;</code> tag to start tracking:
            </p>
            <div className="mockup-code mt-4">
              <pre><code>{`<script defer src="https://metric.example.com/track.js" data-site="${site.tracking_id}"></script>`}</code></pre>
            </div>
            <div className="card-actions justify-end mt-4">
              <button className="btn btn-primary btn-sm" onClick={copyScript}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Script
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
