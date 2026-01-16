import { Link } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-background font-sans">
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

            <main className="container mx-auto px-4 lg:px-8 py-16 max-w-3xl">
                <div className="mb-12">
                    <h1 className="text-4xl font-bold tracking-tight mb-4">Privacy Policy</h1>
                    <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
                </div>

                <div className="prose prose-lg max-w-none prose-headings:font-bold prose-h3:text-xl prose-p:text-muted-foreground">
                    <h3>1. Our Privacy Commitment</h3>
                    <p>
                        At mmmetric, we believe privacy is a fundamental human right. Our analytics platform is built
                        on the principle of "privacy by design." We collect the minimum amount of data necessary
                        to provide you with useful insights, without compromising the privacy of your visitors.
                    </p>

                    <h3>2. What We Collect (and What We Don't)</h3>

                    <h4>Information from Visitors to Your Site</h4>
                    <p>When you use mmmetric on your website, we collect the following anonymous data:</p>
                    <ul>
                        <li><strong>Page Views:</strong> The URL visited.</li>
                        <li><strong>Referrer:</strong> Where the visitor came from.</li>
                        <li><strong>Device Info:</strong> Browser, operating system, and device type (e.g., Mobile/Desktop).</li>
                        <li><strong>Location:</strong> Country and city (derived from IP, but the IP is NOT stored).</li>
                    </ul>

                    <p><strong>WE DO NOT COLLECT:</strong></p>
                    <ul>
                        <li>Personal Identifiable Information (PII) like names, emails, or phone numbers of your visitors.</li>
                        <li>Exact IP addresses (IPs are hashed and discarded immediately).</li>
                        <li>Tracking cookies (we do not use cookies to track visitors across websites).</li>
                    </ul>

                    <h3>3. How We Process Data</h3>
                    <p>
                        When a visitor lands on your site, we generate a daily changing identifier based on the visitor's
                        IP address and User Agent. This identifiers allows us to count unique visitors for a single day.
                        This identifier is:
                    </p>
                    <ul>
                        <li>Hashed using a cryptographic salt.</li>
                        <li>Rotated daily (making it impossible to track users over time).</li>
                        <li>Anonymized (cannot be reversed to reveal the original IP).</li>
                    </ul>

                    <h3>4. Data Ownership</h3>
                    <p>
                        You own your data. We do not sell, rent, or share your analytics data with third parties,
                        advertising companies, or data brokers.
                    </p>

                    <h3>5. Self-Hosted Version</h3>
                    <p>
                        If you use the Self-Hosted version of mmmetric, all data remains on your own servers.
                        We have absolutely no access to it.
                    </p>

                    <h3>6. Contact Us</h3>
                    <p>
                        If you have any questions about this Privacy Policy, please contact us at privacy@mmmetric.com.
                    </p>
                </div>
            </main>

            <footer className="border-t border-border py-8 mt-16">
                <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
                    © {new Date().getFullYear()} mmmetric Analytics. All rights reserved.
                </div>
            </footer>
        </div>
    );
}
