import { useState } from "react";
import {
    Clock,
    Copy,
    Check,
    Trash2,
    Settings,
    Code,
    Zap,
    CheckCircle,
    XCircle,
    Loader2,
    Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Site } from "@/hooks/useSites";
import { getAppUrl, getTrackingApiUrl, getPixelUrl } from "@/lib/config";
import { LogImportCard } from "@/components/settings/LogImportCard";
import { LookerStudioCard } from "@/components/settings/LookerStudioCard";

interface SiteSettingsPanelProps {
    site: Site;
    onEdit: () => void;
    onDelete: () => void;
    deletePending: boolean;
}

export function SiteSettingsPanel({ site, onEdit, onDelete, deletePending }: SiteSettingsPanelProps) {
    const [copied, setCopied] = useState(false);
    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const { toast } = useToast();

    // Generate tracking script with dynamic URLs
    const trackScriptUrl = `${getAppUrl()}/track.js`;
    const trackApiUrl = getTrackingApiUrl();
    const trackingScript = `<script defer src="${trackScriptUrl}" data-site="${site.tracking_id}" data-api="${trackApiUrl}"></script>`;

    const copyTrackingId = async () => {
        await navigator.clipboard.writeText(site.tracking_id);
        setCopied(true);
        toast({
            title: "Copied!",
            description: "Tracking ID copied to clipboard",
        });
        setTimeout(() => setCopied(false), 2000);
    };

    const copyScript = async () => {
        await navigator.clipboard.writeText(trackingScript);
        toast({
            title: "Copied!",
            description: "Add this script to your website's <head> tag to start tracking.",
        });
    };

    const testConnection = async () => {
        setTestStatus('testing');

        try {
            const response = await supabase.functions.invoke('track', {
                body: {
                    site_id: site.tracking_id,
                    event_name: 'test_connection',
                    url: '/test',
                    session_id: 'test_' + Date.now(),
                    properties: { test: true }
                }
            });

            if (response.error) {
                throw new Error(response.error.message);
            }

            await new Promise(resolve => setTimeout(resolve, 1500));

            const { data: events, error: queryError } = await supabase
                .from('events')
                .select('id')
                .eq('site_id', site.id)
                .eq('event_name', 'test_connection')
                .order('created_at', { ascending: false })
                .limit(1);

            if (queryError) throw queryError;

            if (events && events.length > 0) {
                setTestStatus('success');
                toast({
                    title: "Connection verified!",
                    description: "Test event was successfully received and recorded.",
                });
            } else {
                throw new Error('Event not found in database');
            }
        } catch (error) {
            console.error('Test connection error:', error);
            setTestStatus('error');
            toast({
                title: "Connection failed",
                description: "Could not verify tracking. Check your configuration.",
                variant: "destructive",
            });
        }

        setTimeout(() => setTestStatus('idle'), 5000);
    };

    return (
        <div className="bg-muted/30 border border-border animate-in fade-in slide-in-from-top-2 rounded-xl">
            <div className="p-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold">Site Settings</h3>
                    <div className="flex gap-2">
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={onEdit}>
                                <Settings className="h-4 w-4 mr-2" />
                                Edit
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/50"
                                onClick={onDelete}
                                disabled={deletePending}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Site Info Cards */}
                <div className="grid gap-4 md:grid-cols-3 mt-4">
                    {/* Tracking ID */}
                    <div className="bg-background/50 border border-border/50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-muted-foreground">Tracking ID</h4>
                        <div className="flex items-center gap-2 mt-2">
                            <code className="flex-1 font-mono text-sm bg-muted/50 px-3 py-2 rounded-lg truncate text-foreground">
                                {site.tracking_id}
                            </code>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={copyTrackingId}
                            >
                                {copied ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Timezone */}
                    <div className="bg-background/50 border border-border/50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-muted-foreground">Timezone</h4>
                        <div className="flex items-center gap-2 mt-2 text-foreground">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{site.timezone || "UTC"}</span>
                        </div>
                    </div>

                    {/* Created */}
                    <div className="bg-background/50 border border-border/50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-muted-foreground">Created</h4>
                        <span className="mt-2 block text-foreground">
                            {new Date(site.created_at).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </span>
                    </div>
                </div>

                {/* Installation */}
                <div className="mt-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Code className="h-4 w-4" />
                        <h4 className="text-sm font-medium">Installation</h4>
                    </div>
                    <p className="text-muted-foreground text-sm">
                        Add this script to your website's <code className="bg-muted px-1 rounded">&lt;head&gt;</code> tag:
                    </p>
                    <div className="mt-2 rounded-md bg-muted p-4 font-mono text-sm overflow-x-auto border border-border text-foreground">
                        <pre><code>{trackingScript}</code></pre>
                    </div>

                    {/* Cross-Domain Tracking */}
                    <div className="mt-3 p-3 bg-muted/30 rounded-lg border border-border/30">
                        <h5 className="text-xs font-medium text-muted-foreground mb-1">Cross-Domain Tracking (optional)</h5>
                        <p className="text-xs text-muted-foreground/80 mb-2">
                            To track users across multiple domains, add the <code className="bg-muted px-1 rounded">data-cross-domain</code> attribute:
                        </p>
                        <code className="text-xs bg-muted px-2 py-1 rounded block overflow-x-auto text-foreground">
                            data-cross-domain="otherdomain.com,anotherdomain.com"
                        </code>
                    </div>

                    <p className="text-muted-foreground/60 text-xs mt-2">
                        This lightweight script (~1KB) tracks page views, custom events, and UTM parameters while respecting user privacy.
                    </p>
                    <div className="flex justify-end gap-2 mt-2">
                        <Button
                            size="sm"
                            variant={testStatus === 'success' ? 'default' : testStatus === 'error' ? 'destructive' : 'outline'}
                            className={testStatus === 'success' ? 'bg-green-600 hover:bg-green-700' : ''}
                            onClick={testConnection}
                            disabled={testStatus === 'testing'}
                        >
                            {testStatus === 'testing' ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Testing...
                                </>
                            ) : testStatus === 'success' ? (
                                <>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Connected!
                                </>
                            ) : testStatus === 'error' ? (
                                <>
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Failed
                                </>
                            ) : (
                                <>
                                    <Zap className="h-4 w-4 mr-2" />
                                    Test Connection
                                </>
                            )}
                        </Button>
                        <Button size="sm" onClick={copyScript}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Script
                        </Button>
                    </div>
                </div>

                {/* Tracking Pixel */}
                <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-2 mb-2">
                        <ImageIcon className="h-4 w-4" />
                        <h4 className="text-sm font-medium">Tracking Pixel</h4>
                    </div>
                    <p className="text-muted-foreground text-sm">
                        Use this 1x1 image for tracking in emails or non-JS environments:
                    </p>
                    <div className="mt-2 rounded-md bg-muted p-4 font-mono text-sm overflow-x-auto border border-border text-foreground">
                        <pre><code>{`<img src="${getPixelUrl(site.tracking_id)}" alt="" />`}</code></pre>
                    </div>
                </div>

                {/* Log Analytics Import */}
                <div className="mt-4 pt-4 border-t border-border">
                    <LogImportCard siteId={site.id} />
                </div>

                {/* BI Tools / Looker Studio Connector */}
                <div className="mt-4 pt-4 border-t border-border">
                    <LookerStudioCard siteId={site.id} />
                </div>
            </div>
        </div>
    );
}
