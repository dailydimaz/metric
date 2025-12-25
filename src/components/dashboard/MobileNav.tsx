import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  MousePointerClick, 
  GitBranch, 
  Users,
  Menu,
  X
} from "lucide-react";
import { useState, useEffect } from "react";

const getNavItems = (siteId: string | null) => [
  { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
  { icon: MousePointerClick, label: "Analytics", href: siteId ? `/dashboard/sites/${siteId}` : "/dashboard" },
  { icon: GitBranch, label: "Funnels", href: siteId ? `/dashboard/funnels?siteId=${siteId}` : "/dashboard/funnels" },
  { icon: Users, label: "Retention", href: siteId ? `/dashboard/retention?siteId=${siteId}` : "/dashboard/retention" },
];

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  
  // Get selected site from localStorage
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(() => {
    return localStorage.getItem("selectedSiteId");
  });

  useEffect(() => {
    const handleStorageChange = () => {
      setSelectedSiteId(localStorage.getItem("selectedSiteId"));
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const navItems = getNavItems(selectedSiteId);

  return (
    <div className="md:hidden">
      <button 
        className="btn btn-ghost btn-circle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Drawer */}
          <div className="fixed top-[65px] left-0 right-0 bg-base-100 border-b border-base-300 z-50 animate-in slide-in-from-top duration-200">
            <ul className="menu p-4">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href || location.pathname.startsWith(item.href.split('?')[0]);
                return (
                  <li key={item.label}>
                    <Link 
                      to={item.href} 
                      className={`gap-3 ${isActive ? 'active' : ''}`}
                      onClick={() => setIsOpen(false)}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
