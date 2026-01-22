import { Link } from "react-router-dom";
import { ArrowLeft, Server, Database, Shield, Terminal, ArrowRight, Github, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { cn } from "@/lib/utils";

const CopyButton = ({ text }: { text: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground absolute right-2 top-2"
            onClick={handleCopy}
        >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </Button>
    );
};

export default function SelfHosting() {
    return (
        <div className="min-h-screen bg-background font-sans relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

            <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                                <Server className="h-5 w-5 text-primary-foreground" />
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

            <main className="container mx-auto px-4 lg:px-8 py-16 text-center max-w-5xl">
                {/* Hero */}
                <div className="mb-20 relative">
                    <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm">
                        <Terminal className="h-3.5 w-3.5 mr-2" />
                        Developer Guide
                    </Badge>
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                        Host mmmetric on <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Your Infrastructure</span>
                    </h1>
                    <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
                        Total control over your data. No third-party servers. 100% Open Source.
                        Deploy comfortably with Docker in minutes.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Button size="lg" className="rounded-full px-8 h-12 gap-2" asChild>
                            <a href="#quick-start">
                                Start Deployment <ArrowRight className="h-4 w-4" />
                            </a>
                        </Button>
                        <Button size="lg" variant="outline" className="rounded-full px-8 h-12 gap-2" asChild>
                            <a href="https://github.com/dailydimaz/mmmetric" target="_blank" rel="noopener noreferrer">
                                <Github className="h-5 w-5" />
                                Star on GitHub
                            </a>
                        </Button>
                    </div>
                </div>

                {/* Benefits Grid */}
                <div className="grid md:grid-cols-3 gap-6 text-left mb-24">
                    <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-colors group">
                        <CardHeader>
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                <Database className="h-6 w-6 text-primary" />
                            </div>
                            <CardTitle>Your Database</CardTitle>
                        </CardHeader>
                        <CardContent className="text-muted-foreground">
                            Your analytics data lives in your own PostgreSQL instance. We never see it, touch it, or sell it.
                        </CardContent>
                    </Card>

                    <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-secondary/50 transition-colors group">
                        <CardHeader>
                            <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                <Shield className="h-6 w-6 text-secondary" />
                            </div>
                            <CardTitle>Compliance Easy Mode</CardTitle>
                        </CardHeader>
                        <CardContent className="text-muted-foreground">
                            Easier GDPR/CCPA compliance because data never leaves your controlled server jurisdiction or VPC.
                        </CardContent>
                    </Card>

                    <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-accent/50 transition-colors group">
                        <CardHeader>
                            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                <Server className="h-6 w-6 text-accent" />
                            </div>
                            <CardTitle>Unlimited Everything</CardTitle>
                        </CardHeader>
                        <CardContent className="text-muted-foreground">
                            No usage limits, no event caps, no overage fees. Track as much traffic as your hardware can handle.
                        </CardContent>
                    </Card>
                </div>

                {/* Terminal Section */}
                <div id="quick-start" className="text-left max-w-3xl mx-auto mb-24 cursor-text">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold mb-4">Quick Start</h2>
                        <p className="text-muted-foreground">Up and running in less than 2 minutes via Docker.</p>
                    </div>

                    <div className="rounded-xl overflow-hidden border border-border shadow-2xl bg-[#1e1e1e] font-mono text-sm relative group">
                        {/* Terminal Header */}
                        <div className="bg-[#2d2d2d] px-4 py-2 flex items-center gap-2 border-b border-[#3e3e3e]">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                                <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
                            </div>
                            <div className="ml-2 text-xs text-gray-400 select-none">bash — 80x24</div>
                        </div>

                        {/* Terminal Body */}
                        <div className="p-6 space-y-4 text-gray-300">
                            <div className="relative group/line">
                                <div className="flex">
                                    <span className="text-green-400 mr-2">➜</span>
                                    <span className="text-blue-400 mr-2">~</span>
                                    <span>git clone https://github.com/dailydimaz/mmmetric.git</span>
                                </div>
                                <CopyButton text="git clone https://github.com/dailydimaz/mmmetric.git" />
                            </div>

                            <div className="relative group/line">
                                <div className="flex">
                                    <span className="text-green-400 mr-2">➜</span>
                                    <span className="text-blue-400 mr-2">~</span>
                                    <span>cd mmmetric</span>
                                </div>
                            </div>

                            <div className="relative group/line">
                                <div className="flex">
                                    <span className="text-green-400 mr-2">➜</span>
                                    <span className="text-blue-400 mr-2">mmmetric</span>
                                    <span className="text-yellow-300 font-bold">docker-compose up -d</span>
                                </div>
                                <CopyButton text="docker-compose up -d" />
                            </div>

                            <div className="pt-2 text-gray-500 animate-pulse">
                                <span>[+] Running 3/3</span><br />
                                <span> ⠿ Container mmmetric-db-1      Started</span><br />
                                <span> ⠿ Container mmmetric-api-1     Started</span><br />
                                <span> ⠿ Container mmmetric-web-1     Started</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Documentation Link */}
                <div className="bg-muted/30 border border-border rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-left">
                        <h3 className="text-lg font-bold mb-1">Need advanced configuration?</h3>
                        <p className="text-muted-foreground text-sm">Check out our documentation for environment variables, backups, and scaling.</p>
                    </div>
                    <Button asChild>
                        <Link to="/docs">
                            Read Documentation <ArrowRight className="h-4 w-4 ml-2" />
                        </Link>
                    </Button>
                </div>

                {/* Migration CTA */}
                <div className="mt-8 bg-primary/5 border border-primary/20 rounded-2xl p-8 text-center">
                    <h3 className="text-xl font-bold mb-2">Ready for the Cloud?</h3>
                    <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                        Love self-hosting but want managed infrastructure? Migrate your existing analytics data
                        to mmmetric Cloud and get automatic backups, updates, and zero maintenance.
                    </p>
                    <Button size="lg" asChild>
                        <Link to="/migrate">
                            Migrate to Cloud <ArrowRight className="h-4 w-4 ml-2" />
                        </Link>
                    </Button>
                </div>

            </main>

            <footer className="border-t border-border py-8 mt-16 bg-muted/20">
                <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
                    © {new Date().getFullYear()} mmmetric Analytics. Open Source MIT License.
                </div>
            </footer>
        </div>
    );
}
