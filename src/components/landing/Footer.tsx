import { Link } from "react-router-dom";
import { Github, Twitter, Mail, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import mmmetricLogo from "@/assets/mmmetric-logo.png";

const footerLinks = {
  product: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Roadmap", href: "/roadmap" },
    { label: "Live Demo", href: "/live" },
    { label: "vs Google Analytics", href: "/compare/google-analytics" },
    { label: "Changelog", href: "#" },
  ],
  resources: [
    { label: "Self-Hosting", href: "/resources/self-hosting" },
    { label: "Privacy Guide", href: "/resources/privacy" },
    { label: "Lightweight Analytics", href: "/resources/lightweight" },
    { label: "Documentation", href: "#" },
    { label: "API Reference", href: "#" },

    { label: "GitHub", href: "https://github.com/dailydimaz/mmmetric", external: true },
  ],
  community: [
    { label: "Contributing", href: "https://github.com/dailydimaz/mmmetric/blob/main/CONTRIBUTING.md", external: true },
    { label: "Discussions", href: "https://github.com/dailydimaz/mmmetric/discussions", external: true },
    { label: "Issues", href: "https://github.com/dailydimaz/mmmetric/issues", external: true },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "MIT License", href: "https://github.com/dailydimaz/mmmetric/blob/main/LICENSE", external: true },
  ],
};

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-muted/30 border-t border-border">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-muted/50 pointer-events-none" />

      <div className="container mx-auto px-4 lg:px-8 py-16 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-5">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <img src={mmmetricLogo} alt="mmmetric" className="h-10 w-10 rounded-xl shadow-lg shadow-primary/25 transition-transform group-hover:scale-105" />
              <span className="font-display text-2xl font-bold">mmmetric</span>
            </Link>

            <p className="mt-6 text-muted-foreground max-w-sm leading-relaxed">
              Privacy-first analytics that respects your users. No cookies, no tracking across sites, just the insights you need.
            </p>

            {/* Social Links */}
            <div className="mt-8 flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-background hover:bg-primary hover:text-primary-foreground transition-all duration-300 shadow-sm border border-border"
                aria-label="Twitter"
                asChild
              >
                <a href="#">
                  <Twitter className="h-4 w-4" />
                </a>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-background hover:bg-primary hover:text-primary-foreground transition-all duration-300 shadow-sm border border-border"
                aria-label="GitHub"
                asChild
              >
                <a href="#">
                  <Github className="h-4 w-4" />
                </a>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-background hover:bg-primary hover:text-primary-foreground transition-all duration-300 shadow-sm border border-border"
                aria-label="Email"
                asChild
              >
                <a href="#">
                  <Mail className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>

          {/* Links Grid */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-4">
                Product
              </h3>
              <ul className="space-y-3">
                {footerLinks.product.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 group text-sm"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-4">
                Resources
              </h3>
              <ul className="space-y-3">
                {footerLinks.resources.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 group text-sm"
                      {...(link.external && { target: "_blank", rel: "noopener noreferrer" })}
                    >
                      {link.label}
                      {link.external && (
                        <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 translate-x-0.5 group-hover:opacity-100 transition-all" />
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-4">
                Community
              </h3>
              <ul className="space-y-3">
                {footerLinks.community.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 group text-sm"
                      {...(link.external && { target: "_blank", rel: "noopener noreferrer" })}
                    >
                      {link.label}
                      {link.external && (
                        <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 translate-x-0.5 group-hover:opacity-100 transition-all" />
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-4">
                Legal
              </h3>
              <ul className="space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 group text-sm"
                      {...(link.external && { target: "_blank", rel: "noopener noreferrer" })}
                    >
                      {link.label}
                      {link.external && (
                        <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 translate-x-0.5 group-hover:opacity-100 transition-all" />
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} mmmetric Analytics. All rights reserved.
          </p>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span>Built for</span>
            <span className="text-primary font-medium">privacy</span>
            <span>·</span>
            <span>Loved by</span>
            <span className="text-primary font-medium">developers</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
