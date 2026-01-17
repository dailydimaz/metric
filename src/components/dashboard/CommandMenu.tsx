import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    Settings,
    LayoutDashboard,
    Moon,
    Sun,
    Laptop,
    Globe,
    Plus,
    Link,
    BarChart3,
    Target,
    TrendingUp,
    GitBranch,
    Users,
    FileText,
    HelpCircle,
    LogOut,
    Layers,
    Calendar,
    Filter,
} from "lucide-react";

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "@/components/ui/command";
import { useSites } from "@/hooks/useSites";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

export function CommandMenu() {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { sites } = useSites();
    const { setTheme, theme } = useTheme();
    const { user, signOut } = useAuth();
    const [recentSites, setRecentSites] = useState<string[]>([]);

    // Load recent sites from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem("mmmetric_recent_sites");
            if (saved) {
                setRecentSites(JSON.parse(saved));
            }
        } catch (e) {
            console.warn("Failed to load recent sites:", e);
        }
    }, []);

    // Track current site as recent
    useEffect(() => {
        const match = location.pathname.match(/\/dashboard\/sites\/([^/]+)/);
        if (match) {
            const siteId = match[1];
            setRecentSites((prev) => {
                const updated = [siteId, ...prev.filter((id) => id !== siteId)].slice(0, 5);
                try {
                    localStorage.setItem("mmmetric_recent_sites", JSON.stringify(updated));
                } catch (e) {
                    console.warn("Failed to save recent sites:", e);
                }
                return updated;
            });
        }
    }, [location.pathname]);

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const runCommand = useCallback((command: () => void) => {
        setOpen(false);
        command();
    }, []);

    const handleSignOut = useCallback(async () => {
        await signOut();
        navigate("/");
    }, [signOut, navigate]);

    if (!user) return null;

    // Get current site ID from URL if on site detail page
    const currentSiteMatch = location.pathname.match(/\/dashboard\/sites\/([^/]+)/);
    const currentSiteId = currentSiteMatch ? currentSiteMatch[1] : null;
    const currentSite = currentSiteId ? sites.find((s) => s.id === currentSiteId) : null;

    // Recent sites that exist
    const recentSiteObjects = recentSites
        .map((id) => sites.find((s) => s.id === id))
        .filter(Boolean)
        .slice(0, 3);

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput placeholder="Search sites, navigate, change settings..." />
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>

                {/* Quick Actions for Current Site */}
                {currentSite && (
                    <>
                        <CommandGroup heading={`Current: ${currentSite.name}`}>
                            <CommandItem onSelect={() => runCommand(() => navigate(`/dashboard/sites/${currentSiteId}?range=today`))}>
                                <Calendar className="mr-2 h-4 w-4" />
                                <span>View Today</span>
                                <CommandShortcut>Today</CommandShortcut>
                            </CommandItem>
                            <CommandItem onSelect={() => runCommand(() => navigate(`/dashboard/sites/${currentSiteId}?range=7d`))}>
                                <BarChart3 className="mr-2 h-4 w-4" />
                                <span>Last 7 Days</span>
                            </CommandItem>
                            <CommandItem onSelect={() => runCommand(() => navigate(`/dashboard/sites/${currentSiteId}?range=30d`))}>
                                <TrendingUp className="mr-2 h-4 w-4" />
                                <span>Last 30 Days</span>
                            </CommandItem>
                            <CommandItem onSelect={() => runCommand(() => navigate(`/dashboard/funnels?site=${currentSiteId}`))}>
                                <GitBranch className="mr-2 h-4 w-4" />
                                <span>View Funnels</span>
                            </CommandItem>
                            <CommandItem onSelect={() => runCommand(() => navigate(`/dashboard/insights?site=${currentSiteId}`))}>
                                <Layers className="mr-2 h-4 w-4" />
                                <span>View Insights</span>
                            </CommandItem>
                        </CommandGroup>
                        <CommandSeparator />
                    </>
                )}

                {/* Recent Sites */}
                {recentSiteObjects.length > 0 && !currentSite && (
                    <>
                        <CommandGroup heading="Recent">
                            {recentSiteObjects.map((site) => (
                                <CommandItem
                                    key={site!.id}
                                    value={`recent-${site!.name}`}
                                    onSelect={() => runCommand(() => navigate(`/dashboard/sites/${site!.id}`))}
                                    className="cursor-pointer"
                                >
                                    <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <span>{site!.name}</span>
                                    <Badge variant="secondary" className="ml-auto text-xs">Recent</Badge>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                        <CommandSeparator />
                    </>
                )}

                <CommandGroup heading="Navigation">
                    <CommandItem onSelect={() => runCommand(() => navigate("/dashboard"))}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                        <CommandShortcut>⌘D</CommandShortcut>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/dashboard/funnels"))}>
                        <GitBranch className="mr-2 h-4 w-4" />
                        <span>All Funnels</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/dashboard/insights"))}>
                        <Layers className="mr-2 h-4 w-4" />
                        <span>All Insights</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/dashboard/settings"))}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/tools/campaign-builder"))}>
                        <Link className="mr-2 h-4 w-4" />
                        <span>URL Campaign Builder</span>
                    </CommandItem>
                </CommandGroup>

                <CommandSeparator />

                <CommandGroup heading="Theme">
                    <CommandItem onSelect={() => runCommand(() => setTheme("light"))}>
                        <Sun className="mr-2 h-4 w-4" />
                        <span>Light</span>
                        {theme === "light" && <Badge variant="outline" className="ml-auto">Active</Badge>}
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
                        <Moon className="mr-2 h-4 w-4" />
                        <span>Dark</span>
                        {theme === "dark" && <Badge variant="outline" className="ml-auto">Active</Badge>}
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => setTheme("system"))}>
                        <Laptop className="mr-2 h-4 w-4" />
                        <span>System</span>
                        {theme === "system" && <Badge variant="outline" className="ml-auto">Active</Badge>}
                    </CommandItem>
                </CommandGroup>

                <CommandSeparator />

                <CommandGroup heading="All Sites">
                    {sites.map((site) => (
                        <CommandItem
                            key={site.id}
                            value={site.name}
                            onSelect={() => runCommand(() => navigate(`/dashboard/sites/${site.id}`))}
                            className="cursor-pointer"
                        >
                            <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>{site.name}</span>
                            <span className="ml-auto text-xs text-muted-foreground truncate max-w-[100px] font-mono">
                                {site.domain}
                            </span>
                        </CommandItem>
                    ))}
                    <CommandItem onSelect={() => runCommand(() => navigate("/dashboard"))} className="text-primary cursor-pointer font-medium">
                        <Plus className="mr-2 h-4 w-4" />
                        <span>Add New Site</span>
                    </CommandItem>
                </CommandGroup>

                <CommandSeparator />

                <CommandGroup heading="Account">
                    <CommandItem onSelect={() => runCommand(() => navigate("/docs"))} className="cursor-pointer">
                        <FileText className="mr-2 h-4 w-4" />
                        <span>Documentation</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => window.open("https://github.com/your-repo/issues", "_blank"))} className="cursor-pointer">
                        <HelpCircle className="mr-2 h-4 w-4" />
                        <span>Get Help</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(handleSignOut)} className="cursor-pointer text-destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sign Out</span>
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
}
