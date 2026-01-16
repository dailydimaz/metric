
import { Link } from "react-router-dom";
import { ArrowLeft, Server, Database, Shield, Terminal, ArrowRight, Github } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function SelfHosting() {
    return (
        <div className="min-h-screen bg-background font-sans">
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

            <main className="container mx-auto px-4 lg:px-8 py-16 text-center max-w-4xl">
                <div className="mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary text-sm font-medium mb-6">
                        <Terminal className="h-4 w-4" />
                        Developer Guide
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                        Host mmmetric on <span className="text-secondary">Your Own Infrastructure</span>
                    </h1>
                    <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                        Total control over your data. No third-party servers. 100% Open Source.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Button size="lg" variant="secondary" asChild>
                            <a href="https://github.com/dailydimaz/mmmetric" target="_blank" rel="noopener noreferrer">
                                <Github className="h-5 w-5 mr-2" />
                                View on GitHub
                            </a>
                        </Button>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8 text-left mb-20">
                    <div className="bg-muted p-8 rounded-2xl">
                        <Database className="h-10 w-10 text-primary mb-4" />
                        <h3 className="text-xl font-bold mb-2">Your Database</h3>
                        <p className="text-muted-foreground">
                            Your analytics data lives in your own PostgreSQL instance. We never see it.
                        </p>
                    </div>
                    <div className="bg-muted p-8 rounded-2xl">
                        <Shield className="h-10 w-10 text-secondary mb-4" />
                        <h3 className="text-xl font-bold mb-2">Compliance</h3>
                        <p className="text-muted-foreground">
                            Easier GDPR compliance because data never leaves your controlled server jurisdiction.
                        </p>
                    </div>
                    <div className="bg-muted p-8 rounded-2xl">
                        <Server className="h-10 w-10 text-accent mb-4" />
                        <h3 className="text-xl font-bold mb-2">Unlimited</h3>
                        <p className="text-muted-foreground">
                            No usage limits or overage fees. Track as much traffic as your server can handle.
                        </p>
                    </div>
                </div>

                <div className="text-left max-w-2xl mx-auto mb-20">
                    <h2 className="text-2xl font-bold mb-6">Quick Start with Docker</h2>
                    <div className="mockup-code bg-black text-white rounded-xl shadow-xl border border-border">
                        <pre className="px-6 py-2"><code>git clone https://github.com/dailydimaz/mmmetric.git</code></pre>
                        <pre className="px-6 py-2"><code>cd mmmetric</code></pre>
                        <pre className="px-6 py-2"><code>docker-compose up -d</code></pre>
                    </div>
                    <div className="mt-6 flex justify-between items-center bg-muted p-4 rounded-lg border border-border">
                        <span className="font-medium">Need detailed instructions?</span>
                        <Link to="/docs" className="text-primary font-bold hover:underline flex items-center">
                            Read Documentation <ArrowRight className="h-4 w-4 ml-1" />
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
