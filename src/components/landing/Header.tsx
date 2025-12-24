import { Link } from "react-router-dom";
import { BarChart3 } from "lucide-react";

export function Header() {
  return (
    <header className="navbar fixed top-0 left-0 right-0 z-50 glass px-4 lg:px-8">
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
          <li><a href="#features" className="text-base-content/70 hover:text-base-content">Features</a></li>
          <li><a href="#pricing" className="text-base-content/70 hover:text-base-content">Pricing</a></li>
          <li><a href="#docs" className="text-base-content/70 hover:text-base-content">Docs</a></li>
        </ul>
      </div>

      <div className="navbar-end gap-2">
        <Link to="/auth" className="btn btn-ghost">Sign in</Link>
        <Link to="/auth?mode=signup" className="btn btn-primary">Start Free</Link>
      </div>
    </header>
  );
}
