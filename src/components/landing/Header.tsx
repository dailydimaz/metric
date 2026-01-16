import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import mmmetricLogo from "@/assets/mmmetric-logo.png";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex-1 flex justify-start">
            <Link to="/" className="flex items-center gap-2">
              <img src={mmmetricLogo} alt="mmmetric" className="h-8 w-8 rounded-lg" />
              <span className="font-display text-xl font-bold">mmmetric</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </a>
            <Link to="/live" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Live Demo
            </Link>
          </div>

          <div className="flex-1 flex justify-end gap-2 text-right">
            <Button variant="ghost" asChild className="hidden sm:flex">
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild className="hidden sm:flex">
              <Link to="/auth?mode=signup">Start Free</Link>
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-background border-b border-border md:hidden p-4">
          <nav className="flex flex-col space-y-4">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground p-2" onClick={() => setMobileMenuOpen(false)}>
              Features
            </a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground p-2" onClick={() => setMobileMenuOpen(false)}>
              Pricing
            </a>
            <Link to="/live" className="text-sm font-medium text-muted-foreground hover:text-foreground p-2" onClick={() => setMobileMenuOpen(false)}>
              Live Demo
            </Link>

            <div className="pt-2 flex flex-col gap-2">
              <Button variant="ghost" asChild className="w-full justify-start" onClick={() => setMobileMenuOpen(false)}>
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button asChild className="w-full" onClick={() => setMobileMenuOpen(false)}>
                <Link to="/auth?mode=signup">Start Free</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
