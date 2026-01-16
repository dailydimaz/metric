
import { Link } from "react-router-dom";
import { ArrowLeft, Zap, Gauge, ArrowDown, Activity } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Lightweight() {
    return (
        <div className="min-h-screen bg-background font-sans">
            <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                                <Zap className="h-5 w-5 text-primary-foreground" />
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
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6">
                        <Gauge className="h-4 w-4" />
                        Performance & Speed
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                        Analytics That Doesn't <br /><span className="text-accent">Slow You Down</span>
                    </h1>
                    <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                        Every kilobyte matters. Keep your site fast and your SEO scores high.
                    </p>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-20">
                    <div className="border border-border bg-card rounded-xl w-full max-w-sm hover:shadow-xl transition-all p-6">
                        <div className="text-center">
                            <div className="text-5xl font-black text-primary mb-2">&lt; 2 KB</div>
                            <div className="text-sm font-bold uppercase tracking-widest opacity-50">Script Size</div>
                            <div className="text-xs text-muted-foreground mt-2">Before GZIP</div>
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-muted-foreground/20">VS</div>
                    <div className="border border-border bg-card rounded-xl w-full max-w-sm opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all p-6">
                        <div className="text-center">
                            <div className="text-5xl font-black text-destructive mb-2">45 KB</div>
                            <div className="text-sm font-bold uppercase tracking-widest opacity-50">Google Analytics</div>
                            <div className="text-xs text-muted-foreground mt-2">Global Site Tag</div>
                        </div>
                    </div>
                </div>

                <div className="bg-muted p-10 rounded-3xl text-left">
                    <div className="flex items-start gap-6">
                        <div className="mt-1">
                            <Activity className="h-8 w-8 text-green-500" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold mb-4">Why script size matters</h3>
                            <p className="text-lg opacity-80 mb-4">
                                Heavy analytics scripts block the main thread, increasing "Time to Interactive" (TTI) and "Total Blocking Time" (TBT). This hurts your Core Web Vitals score, which Google uses as a ranking factor.
                            </p>
                            <p className="text-lg opacity-80">
                                mmmetric is built to be invisible. The script loads asynchronously and never blocks your page rendering. You get all the insights with zero performance penalty.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
