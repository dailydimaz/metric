import { useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, Menu, X } from "lucide-react";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="navbar fixed top-0 left-0 right-0 z-50 glass px-4 lg:px-8">
      <script defer src="https://mmmetric.lovable.app/track.js" data-site="st_70965cd97158"></script>
      <div className="navbar-start">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <BarChart3 className="h-4 w-4 text-primary-content" />
          </div>
          <span className="font-display text-xl font-bold">Metric</span>
        </Link>
      </div>

      <div className="navbar-center hidden md:flex">
        <ul className="menu menu-horizontal px-1">
          <li>
            <a href="#features" className="text-base-content/70 hover:text-base-content">
              Features
            </a>
          </li>
          <li>
            <a href="#pricing" className="text-base-content/70 hover:text-base-content">
              Pricing
            </a>
          </li>
        </ul>
      </div>

      <div className="navbar-end gap-2">
        <Link to="/auth" className="btn btn-ghost hidden sm:flex">
          Sign in
        </Link>
        <Link to="/auth?mode=signup" className="btn btn-primary hidden sm:flex">
          Start Free
        </Link>

        {/* Mobile Menu Button */}
        <button
          className="btn btn-ghost btn-circle md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-base-100 border-b border-base-300 md:hidden">
          <ul className="menu p-4">
            <li>
              <a href="#features" onClick={() => setMobileMenuOpen(false)}>
                Features
              </a>
            </li>
            <li>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>
                Pricing
              </a>
            </li>
            <li className="mt-2">
              <Link to="/auth" className="justify-center" onClick={() => setMobileMenuOpen(false)}>
                Sign in
              </Link>
            </li>
            <li>
              <Link to="/auth?mode=signup" className="btn btn-primary mt-2" onClick={() => setMobileMenuOpen(false)}>
                Start Free
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
