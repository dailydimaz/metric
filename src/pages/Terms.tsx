import { Link } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Terms() {
    return (
        <div className="min-h-screen bg-background font-sans">
            <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                                <FileText className="h-5 w-5 text-primary-foreground" />
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
                    <h1 className="text-4xl font-bold tracking-tight mb-4">Terms of Service</h1>
                    <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
                </div>

                <div className="prose prose-lg max-w-none prose-headings:font-bold prose-h3:text-xl prose-p:text-muted-foreground">
                    <h3>1. Introduction</h3>
                    <p>
                        Welcome to mmmetric ("we," "our," or "us"). By accessing or using our analytics services, website,
                        or software (collectively, the "Service"), you agree to be bound by these Terms of Service ("Terms").
                    </p>

                    <h3>2. Description of Service</h3>
                    <p>
                        mmmetric provides privacy-friendly web analytics services. We offer two versions of our Service:
                    </p>
                    <ul>
                        <li><strong>Cloud Version:</strong> Hosted by us on our infrastructure.</li>
                        <li><strong>Self-Hosted Version:</strong> Hosted by you on your own infrastructure.</li>
                    </ul>

                    <h3>3. Use License (Self-Hosted)</h3>
                    <p>
                        For the Self-Hosted version, we grant you a limited, non-exclusive, non-transferable license to
                        install and use the software for your internal business purposes, subject to these Terms.
                    </p>

                    <h3>4. Acceptable Use</h3>
                    <p>
                        You agree not to misuse the Service or help anyone else to do so. You must not trying to access
                        non-public areas of the Service, test the vulnerability of the Service, or try to reverse engineer the Service.
                    </p>

                    <h3>5. Data Privacy</h3>
                    <p>
                        We prioritize user privacy. Our Service is designed to be compliant with GDPR, CCPA, and PECR.
                        We do not use tracking cookies and we anonymize visitor IP addresses.
                        For more details, please refer to our <Link to="/privacy-policy">Privacy Policy</Link>.
                    </p>

                    <h3>6. Disclaimer</h3>
                    <p>
                        The Service is provided "as is". We make no warranties, expressed or implied, and hereby disclaim
                        and negate all other warranties including, without limitation, implied warranties or conditions of
                        merchantability, fitness for a particular purpose, or non-infringement of intellectual property.
                    </p>

                    <h3>7. Limitations</h3>
                    <p>
                        In no event shall mmmetric or its suppliers be liable for any damages (including, without limitation,
                        damages for loss of data or profit, or due to business interruption) arising out of the use or
                        inability to use the Service.
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
