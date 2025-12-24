import { Link } from "react-router-dom";
import { BarChart3, Github, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="footer footer-center p-10 bg-base-200 text-base-content border-t border-base-300">
      <div className="container mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full text-left">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <BarChart3 className="h-4 w-4 text-primary-content" />
              </div>
              <span className="font-display text-xl font-bold">Metric</span>
            </Link>
            <p className="mt-4 text-sm text-base-content/70 max-w-xs">
              Privacy-friendly analytics for modern websites and applications.
            </p>
            <div className="mt-6 flex gap-4">
              <a href="#" className="btn btn-ghost btn-square btn-sm">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="btn btn-ghost btn-square btn-sm">
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <span className="footer-title">Product</span>
            <a href="#features" className="link link-hover">Features</a>
            <a href="#pricing" className="link link-hover">Pricing</a>
            <a href="#" className="link link-hover">Docs</a>
            <a href="#" className="link link-hover">API</a>
          </div>

          <div>
            <span className="footer-title">Company</span>
            <a href="#" className="link link-hover">About</a>
            <a href="#" className="link link-hover">Blog</a>
            <a href="#" className="link link-hover">Careers</a>
            <a href="#" className="link link-hover">Contact</a>
          </div>

          <div>
            <span className="footer-title">Legal</span>
            <a href="#" className="link link-hover">Privacy</a>
            <a href="#" className="link link-hover">Terms</a>
            <a href="#" className="link link-hover">DPA</a>
            <a href="#" className="link link-hover">GDPR</a>
          </div>
        </div>

        <div className="divider"></div>
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
          <p className="text-sm text-base-content/70">
            © 2024 Metric. All rights reserved.
          </p>
          <p className="text-sm text-base-content/70">
            Made with ❤️ for privacy
          </p>
        </div>
      </div>
    </footer>
  );
}
