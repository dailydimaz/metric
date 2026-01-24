import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSites } from "@/hooks/useSites";
import { CreateSiteDialog } from "@/components/dashboard/CreateSiteDialog";
import { isBillingEnabled } from "@/lib/billing";
import mmmetricLogo from "@/assets/mmmetric-logo.png";
import {
  Menu,
  ChevronDown,
  Plus,
  Settings,
  LogOut,
  LayoutDashboard,
  MousePointerClick,
  GitBranch,
  Users,
  Link2,
  Lightbulb,
  LinkIcon,
  Route,
  Target,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

// Nav items - conditionally include cloud-only items
const getNavItems = (siteId: string | null, billingEnabled: boolean) => {
  const items = [
    { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
    { icon: MousePointerClick, label: "Analytics", href: siteId ? `/dashboard/sites/${siteId}` : "/dashboard", siteSpecific: true },
    { icon: Route, label: "Journeys", href: siteId ? `/dashboard/sites/${siteId}/journeys` : "/dashboard", siteSpecific: true },
    { icon: GitBranch, label: "Funnels", href: siteId ? `/dashboard/sites/${siteId}/funnels` : "/dashboard", siteSpecific: true },
    { icon: Users, label: "Retention", href: siteId ? `/dashboard/sites/${siteId}/retention` : "/dashboard", siteSpecific: true },
    { icon: Lightbulb, label: "Insights", href: siteId ? `/dashboard/sites/${siteId}/insights` : "/dashboard", siteSpecific: true },
    { icon: Target, label: "Attribution", href: siteId ? `/dashboard/sites/${siteId}/attribution` : "/dashboard", siteSpecific: true },
  ];

  // Add cloud-only items
  if (billingEnabled) {
    items.push({ icon: LinkIcon, label: "Links", href: siteId ? `/dashboard/sites/${siteId}/links` : "/dashboard", siteSpecific: true });
  }

  // URL Builder is always available
  items.push({ icon: Link2, label: "URL Builder", href: "/tools/campaign-builder" });



  return items;
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, signOut } = useAuth();
  const { sites } = useSites();
  const navigate = useNavigate();
  const location = useLocation();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const params = useParams<{ siteId?: string }>();
  const urlSiteId = params.siteId;

  // Persist selected site in localStorage
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(() => {
    return urlSiteId || localStorage.getItem("selectedSiteId");
  });

  // Sync state with URL params if they exist
  useEffect(() => {
    if (urlSiteId) {
      setSelectedSiteId(urlSiteId);
      localStorage.setItem("selectedSiteId", urlSiteId);
    }
  }, [urlSiteId]);

  // Auto-select first site if none selected and no URL param
  useEffect(() => {
    if (!selectedSiteId && !urlSiteId && sites.length > 0) {
      setSelectedSiteId(sites[0].id);
    }
  }, [sites, selectedSiteId, urlSiteId]);

  const selectedSite = sites.find((s) => s.id === selectedSiteId) ?? sites[0];
  const billingEnabled = isBillingEnabled();
  const navItems = getNavItems(selectedSiteId, billingEnabled);

  const handleSignOut = async () => {
    localStorage.removeItem("selectedSiteId");
    await signOut();
    navigate("/");
  };

  const NavContent = () => (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      <div className="p-6">
        <Link to="/" className="flex items-center gap-3 mb-8 px-2 group">
          <img src={mmmetricLogo} alt="mmmetric" className="h-8 w-8 rounded-lg" />
          <div className="flex flex-col">
            <span className="font-display font-bold text-lg tracking-tight text-sidebar-foreground">mmmetric</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Analytics</span>
          </div>
        </Link>

        {/* Site Selector - Sidebar */}
        <div className="mb-6 px-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between font-normal bg-sidebar-accent/50 border-sidebar-border/50 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-10 shadow-sm transition-all hover:border-sidebar-border">
                <span className="truncate font-medium text-sm">{selectedSite?.name ?? "Select site"}</span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[220px]">
              <DropdownMenuLabel className="text-xs text-muted-foreground">Switch Site</DropdownMenuLabel>
              <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                {sites.map((site) => (
                  <DropdownMenuItem
                    key={site.id}
                    className="flex flex-col items-start gap-1 p-2 cursor-pointer"
                    onSelect={() => {
                      setSelectedSiteId(site.id);
                      if (location.pathname.startsWith("/dashboard/sites/")) {
                        // Stay on current page type but switch site
                        const pathParts = location.pathname.split('/');
                        // pathParts: ["", "dashboard", "sites", "oldId", "pageType"]
                        const pageType = pathParts[4];
                        if (pageType) {
                          navigate(`/dashboard/sites/${site.id}/${pageType}`);
                        } else {
                          navigate(`/dashboard/sites/${site.id}`);

                        }
                      } else {
                        navigate(`/dashboard/sites/${site.id}`);
                      }
                    }}
                  >
                    <span className="font-medium">{site.name}</span>
                    {site.domain && <span className="text-xs text-muted-foreground font-mono">{site.domain}</span>}
                  </DropdownMenuItem>
                ))}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setCreateDialogOpen(true)} className="text-primary cursor-pointer font-medium">
                <Plus className="mr-2 h-4 w-4" />
                Add new site
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>


        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.label}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 group relative",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                <item.icon className={cn("h-4 w-4", isActive ? "text-sidebar-foreground" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground")} />
                {item.label}
                {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full"></span>}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-auto p-4 border-t border-sidebar-border/60">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-3 px-2 hover:bg-sidebar-accent h-12">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary/80 to-blue-600/80 flex items-center justify-center text-primary-foreground shadow-sm ring-2 ring-background">
                <span className="font-bold text-xs">{user?.email?.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex flex-col items-start text-left truncate">
                <span className="text-sm font-medium text-sidebar-foreground truncate w-[140px]">{user?.email?.split('@')[0]}</span>
                <span className="text-[10px] text-muted-foreground">Free Plan</span>
              </div>
              <ChevronDown className="h-3 w-3 ml-auto opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mb-2">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="flex items-center justify-between px-2 py-1.5 text-sm">
              <span>Theme</span>
              <ThemeToggle />
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate("/dashboard/settings")} className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleSignOut} className="text-destructive cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-sidebar/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <img src={mmmetricLogo} alt="mmmetric" className="h-8 w-8 rounded-lg" />
          <span className="font-bold text-lg font-display">mmmetric</span>
        </div>
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="hover:bg-sidebar-accent">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 border-r border-sidebar-border bg-sidebar">
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-72 min-h-screen sticky top-0 h-screen overflow-y-auto bg-sidebar border-r border-sidebar-border">
          <NavContent />
        </aside>

        {/* Main Content */}
        <main className="flex-1 w-full overflow-hidden bg-background">
          <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 slide-in-from-bottom-2">
            {children}
          </div>
        </main>
      </div>

      <CreateSiteDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}
