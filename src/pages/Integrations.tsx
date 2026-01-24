import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { IntegrationCard } from "@/components/integrations/IntegrationCard";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { BarChart3, Search, ShoppingBag } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

export default function Integrations() {
    const { siteId } = useParams();
    const navigate = useNavigate();

    const { data: integrations, isLoading } = useQuery({
        queryKey: ["integrations", siteId],
        queryFn: async () => {
            if (!siteId) return [];
            const { data, error } = await supabase
                .from("integrations")
                .select("*")
                .eq("site_id", siteId);

            if (error) throw error;
            return data;
        },
        enabled: !!siteId,
    });

    const isConnected = (provider: string) => {
        return integrations?.some((i) => i.provider === provider) ?? false;
    };

    const handleConnect = (provider: string) => {
        if (provider === "google_analytics") {
            // Navigate to import wizard (to be implemented)
            navigate(`/dashboard/sites/${siteId}/integrations/ga-import`);
        } else if (provider === "shopify") {
            // Placeholder for shopify flow
            toast.info("Shopify integration coming soon");
        } else if (provider === "google_search_console") {
            navigate(`/dashboard/sites/${siteId}/gsc`);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-8 animate-in fade-in duration-500">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Integrations
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Connect your favorite tools to supercharge your analytics.
                    </p>
                </div>

                {/* Coming Soon Section - All integrations require external credentials */}
                <div className="mt-4">
                    <h2 className="text-lg font-semibold text-muted-foreground mb-4">Coming Soon</h2>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <div className="relative">
                            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
                                <span className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">Coming Soon</span>
                            </div>
                            <IntegrationCard
                                title="Shopify"
                                description="Connect your Shopify store to track revenue, orders, and attribution automatically."
                                icon={<ShoppingBag className="w-6 h-6 text-green-500 opacity-50" />}
                                isConnected={false}
                                onConnect={() => {}}
                            />
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
                                <span className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">Coming Soon</span>
                            </div>
                            <IntegrationCard
                                title="Google Analytics Import"
                                description="Import your historical data from Universal Analytics or GA4 to maintain your data history."
                                icon={<BarChart3 className="w-6 h-6 text-orange-500 opacity-50" />}
                                isConnected={false}
                                onConnect={() => {}}
                            />
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
                                <span className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">Coming Soon</span>
                            </div>
                            <IntegrationCard
                                title="Google Search Console"
                                description="Monitor your organic search presence, keywords, and click-through rates."
                                icon={<Search className="w-6 h-6 text-blue-500 opacity-50" />}
                                isConnected={false}
                                onConnect={() => {}}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
