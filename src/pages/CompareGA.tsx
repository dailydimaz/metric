
import { Link } from "react-router-dom";
import { Check, X, ArrowLeft, Shield, Zap, Cookie, Database, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CompareGA() {
    return (
        <div className="min-h-screen bg-background font-sans">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                                <Shield className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <span className="font-display text-xl font-bold">mmmetric</span>
                        </Link>
                        <Button variant="ghost" size="sm" asChild>
                            <Link to="/">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Home
                            </Link>
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 lg:px-8 py-16">
                {/* Hero Section */}
                <div className="text-center max-w-4xl mx-auto mb-20">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                        <Shield className="h-4 w-4" />
                        Privacy-First Analytics
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                        mmmetric vs <span className="text-error">Google Analytics</span>
                    </h1>
                    <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                        Why switching to a privacy-friendly alternative is the best decision for your users and your business.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button size="lg" asChild>
                            <Link to="/auth">
                                Start Free Trial
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Link>
                        </Button>
                        <Button variant="outline" size="lg" asChild>
                            <a href="https://plausible.io/vs-google-analytics" target="_blank" rel="noopener noreferrer">
                                Read In-Depth Guide
                            </a>
                        </Button>
                    </div>
                </div>

                {/* Comparison Table */}
                <div className="overflow-x-auto bg-muted/30 rounded-3xl p-8 mb-24 border border-border">
                    <table className="w-full text-lg">
                        <thead>
                            <tr className="border-b-2 border-border/50">
                                <th className="text-left bg-transparent text-muted-foreground w-1/3 pb-6 font-semibold">Feature</th>
                                <th className="text-left bg-transparent text-primary text-xl font-bold pb-6 w-1/3">mmmetric</th>
                                <th className="text-left bg-transparent text-muted-foreground text-xl pb-6 w-1/3">Google Analytics</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Row 1 */}
                            <tr className="border-b border-border/30">
                                <td className="py-6 font-medium">Script Size</td>
                                <td className="py-6 text-green-600 font-bold flex items-center gap-2">
                                    <Zap className="h-5 w-5" />
                                    &lt; 2 KB (Fast)
                                </td>
                                <td className="py-6 text-destructive opacity-70">45+ KB (Bloated)</td>
                            </tr>
                            {/* Row 2 */}
                            <tr className="border-b border-border/30">
                                <td className="py-6 font-medium">Cookies</td>
                                <td className="py-6 text-green-600 font-bold flex items-center gap-2">
                                    <Cookie className="h-5 w-5" />
                                    No Cookies Needed
                                </td>
                                <td className="py-6 text-destructive opacity-70">Uses Cookies</td>
                            </tr>
                            {/* Row 3 */}
                            <tr className="border-b border-border/30">
                                <td className="py-6 font-medium">GDPR & CCPA</td>
                                <td className="py-6 text-green-600 font-bold flex items-center gap-2">
                                    <Shield className="h-5 w-5" />
                                    Compliant by Default
                                </td>
                                <td className="py-6 text-destructive opacity-70">Complex Configuration</td>
                            </tr>
                            {/* Row 4 */}
                            <tr className="border-b border-border/30">
                                <td className="py-6 font-medium">Data Ownership</td>
                                <td className="py-6 text-green-600 font-bold flex items-center gap-2">
                                    <Database className="h-5 w-5" />
                                    100% Yours (Self-hostable)
                                </td>
                                <td className="py-6 text-destructive opacity-70">Google Owns Data</td>
                            </tr>
                            {/* Row 5 */}
                            <tr className="border-b border-border/30">
                                <td className="py-6 font-medium">Cookie Banner</td>
                                <td className="py-6 text-green-600 font-bold flex items-center gap-2">
                                    <Check className="h-5 w-5" />
                                    Not Required
                                </td>
                                <td className="py-6 text-destructive opacity-70">Required</td>
                            </tr>
                            {/* Row 6 */}
                            <tr>
                                <td className="py-6 font-medium">Ease of Use</td>
                                <td className="py-6 text-green-600 font-bold flex items-center gap-2">
                                    <Check className="h-5 w-5" />
                                    Simple Dashboard
                                </td>
                                <td className="py-6 text-destructive opacity-70">Requires Training</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Deep Dive Sections */}
                <div className="grid md:grid-cols-3 gap-8 mb-24">
                    <div className="bg-card border border-border p-8 rounded-2xl hover:border-primary/50 transition-all">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                            <Zap className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-bold mb-4">Lightweight Script</h3>
                        <p className="text-muted-foreground">
                            mmmetric script is 45x smaller than Google Analytics. It loads instantly and doesn't slow down your website, improving your SEO and Core Web Vitals score.
                        </p>
                    </div>

                    <div className="bg-card border border-border p-8 rounded-2xl hover:border-primary/50 transition-all">
                        <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600 mb-6">
                            <Shield className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-bold mb-4">Privacy by Design</h3>
                        <p className="text-muted-foreground">
                            We don't use cookies and we don't track personal data. Your visitors' privacy is respected, and you don't need to display annoying cookie banners.
                        </p>
                    </div>

                    <div className="bg-card border border-border p-8 rounded-2xl hover:border-primary/50 transition-all">
                        <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-6">
                            <Database className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-bold mb-4">Data Ownership</h3>
                        <p className="text-muted-foreground">
                            With mmmetric, you own 100% of your data. You can export it anytime or self-host our open-source version on your own servers.
                        </p>
                    </div>
                </div>

                {/* CTA */}
                <div className="bg-primary text-primary-foreground rounded-3xl p-12 text-center relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to ditch Google Analytics?</h2>
                        <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
                            Join thousands of privacy-conscious developers and businesses switching to mmmetric today.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Button variant="secondary" size="lg" className="hover:scale-105 transition-transform" asChild>
                                <Link to="/auth">
                                    Get Started for Free
                                </Link>
                            </Button>
                            <Button variant="ghost" className="hover:bg-black/10 text-primary-foreground" asChild>
                                <Link to="/roadmap">
                                    View Roadmap
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Decorative circles */}
                    <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                </div>

            </main>

            {/* Simple Footer */}
            <footer className="border-t border-border py-8 mt-16">
                <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
                    © {new Date().getFullYear()} mmmetric Analytics.
                </div>
            </footer>
        </div>
    );
}
