import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSites } from "@/hooks/useSites";
import { CreateSiteDialog } from "@/components/dashboard/CreateSiteDialog";
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
} from "lucide-react";

// Nav items
const getNavItems = (siteId: string | null) => [
  { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
  { icon: MousePointerClick, label: "Analytics", href: siteId ? `/dashboard/sites/${siteId}` : "/dashboard", siteSpecific: true },
  { icon: GitBranch, label: "Funnels", href: siteId ? `/dashboard/sites/${siteId}/funnels` : "/dashboard", siteSpecific: true },
  { icon: Users, label: "Retention", href: siteId ? `/dashboard/sites/${siteId}/retention` : "/dashboard", siteSpecific: true },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, signOut } = useAuth();
  const { sites } = useSites();
  const navigate = useNavigate();
  const location = useLocation();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

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
  const navItems = getNavItems(selectedSiteId);

  const handleSignOut = async () => {
    localStorage.removeItem("selectedSiteId");
    await signOut();
    navigate("/");
  };

  return (
    <div className="drawer lg:drawer-open bg-base-100 min-h-screen">
      <input id="dashboard-drawer" type="checkbox" className="drawer-toggle" />

      {/* Page Content */}
      <div className="drawer-content flex flex-col">
        {/* Navbar */}
        <div className="w-full navbar border-b border-base-300 bg-base-100/50 backdrop-blur-md sticky top-0 z-30 lg:hidden">
          <div className="flex-none lg:hidden">
            <label htmlFor="dashboard-drawer" aria-label="open sidebar" className="btn btn-square btn-ghost">
              <Menu className="h-6 w-6" />
            </label>
          </div>
          <div className="flex-1 px-2 mx-2">
            <span className="font-bold text-lg">mmmetric</span>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {/* Top Bar for Desktop (User Menu & Site Selector) */}
          <div className="hidden lg:flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              {/* Site Selector Dropdown */}
              <div className="dropdown">
                <div tabIndex={0} role="button" className="btn btn-ghost gap-2 normal-case font-normal text-lg">
                  <span className="font-semibold">{selectedSite?.name ?? "Select site"}</span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </div>
                <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-xl bg-base-100 rounded-box w-60 border border-base-200">
                  {sites.map((site) => (
                    <li key={site.id}>
                      <a
                        onClick={() => {
                          setSelectedSiteId(site.id);
                          // Preserve current view context (analytics, funnels, retention)
                          if (location.pathname.includes("/funnels")) {
                            navigate(`/dashboard/sites/${site.id}/funnels`);
                          } else if (location.pathname.includes("/retention")) {
                            navigate(`/dashboard/sites/${site.id}/retention`);
                          } else {
                            navigate(`/dashboard/sites/${site.id}`); // Default to Analytics
                          }
                        }}
                        className={selectedSiteId === site.id ? "active" : ""}
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium">{site.name}</span>
                          {site.domain && <span className="text-xs opacity-60 font-mono">{site.domain}</span>}
                        </div>
                      </a>
                    </li>
                  ))}
                  <div className="divider my-1"></div>
                  <li>
                    <a onClick={() => setCreateDialogOpen(true)} className="text-primary">
                      <Plus className="h-4 w-4" />
                      Add new site
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* User Menu */}
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar placeholder border border-base-300">
                <div className="bg-neutral text-neutral-content rounded-full w-10">
                  <span className="text-sm font-medium">{user?.email?.charAt(0).toUpperCase()}</span>
                </div>
              </div>
              <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-xl bg-base-100 rounded-box w-56 border border-base-200 mt-2">
                <li className="menu-title px-4 py-2">
                  <span className="text-xs opacity-60 font-normal">{user?.email}</span>
                </li>
                <li>
                  <Link to="/dashboard/settings">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </li>
                <div className="divider my-1"></div>
                <li>
                  <a onClick={handleSignOut} className="text-error">
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {children}
        </main>
      </div>

      {/* Sidebar */}
      <div className="drawer-side z-40">
        <label htmlFor="dashboard-drawer" aria-label="close sidebar" className="drawer-overlay"></label>
        <div className="menu p-4 w-72 min-h-full bg-base-100 text-base-content border-r border-base-200 flex flex-col justify-between">
          {/* Sidebar Top */}
          <div>
            <div className="flex items-center gap-3 px-2 mb-8 mt-2">
              <img src={mmmetricLogo} alt="Logo" className="h-10 w-10 rounded-xl shadow-sm" />
              <div className="flex flex-col">
                <span className="font-display font-bold text-xl tracking-tight">mmmetric</span>
                <span className="text-xs text-base-content/60">Privacy-first analytics</span>
              </div>
            </div>

            <ul className="space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.label}>
                    <Link
                      to={item.href}
                      className={`text-base font-medium gap-3 rounded-lg py-3 ${isActive ? 'active bg-primary text-primary-foreground shadow-md' : 'hover:bg-base-200'}`}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Sidebar Bottom (Mobile only usually, but good for consistent footer) */}
          <div className="lg:hidden px-2 py-4 border-t border-base-200">
            <button onClick={handleSignOut} className="btn btn-ghost btn-sm w-full justify-start text-error">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <CreateSiteDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}
