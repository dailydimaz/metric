
import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Check, Lock, Cookie, EyeOff } from "lucide-react";

export default function Privacy() {
    return (
        <div className="min-h-screen bg-base-100 font-sans">
            <header className="sticky top-0 z-50 border-b border-base-300 bg-base-100/80 backdrop-blur-xl">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                                <Shield className="h-5 w-5 text-primary-content" />
                            </div>
                            <span className="font-display text-xl font-bold">mmmetric</span>
                        </Link>
                        <Link to="/" className="btn btn-ghost btn-sm gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Home
                        </Link>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 lg:px-8 py-16 max-w-3xl">
                <div className="mb-12 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 text-success text-sm font-medium mb-6">
                        <Lock className="h-4 w-4" />
                        Privacy Policy
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                        Why Privacy <span className="text-success">Matters</span>
                    </h1>
                    <p className="text-xl text-base-content/70">
                        We believe you can get useful insights without invasive tracking.
                    </p>
                </div>

                <div className="prose prose-lg px-4 mx-auto mb-16">
                    <h3>The Problem with Traditional Analytics</h3>
                    <p>
                        Traditional analytics tools (like Google Analytics) track individual users across the web to build profiles for advertising. To do this, they set invasive cookies on visitors' devices. This requires you to show annoying "Cookie Consent" banners, leading to "Compliance Fatigue" and a poor user experience.
                    </p>

                    <h3>How mmmetric is different</h3>
                    <p>
                        mmmetric is designed to track overall trends, not individuals. We count page views and visitor flows, but we do not collect personal data like IP addresses or advertising IDs in a way that can identify a person.
                    </p>

                    <ul className="list-none pl-0 space-y-4 my-8">
                        <li className="flex items-start gap-3">
                            <div className="mt-1 bg-success/20 p-1 rounded-full text-success">
                                <Cookie className="h-4 w-4" />
                            </div>
                            <div>
                                <strong>No Cookies:</strong> We don't use cookies to track visitors continuously.
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="mt-1 bg-success/20 p-1 rounded-full text-success">
                                <EyeOff className="h-4 w-4" />
                            </div>
                            <div>
                                <strong>No Personal Data:</strong> IP addresses are anonymized (hashed) immediately.
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="mt-1 bg-success/20 p-1 rounded-full text-success">
                                <Check className="h-4 w-4" />
                            </div>
                            <div>
                                <strong>GDPR Compliant:</strong> No data is transferred to third-party ad networks.
                            </div>
                        </li>
                    </ul>

                    <div className="bg-base-200 p-8 rounded-2xl not-prose border border-base-300">
                        <h4 className="text-lg font-bold mb-2">Do I need a cookie banner?</h4>
                        <p className="text-base-content/80">
                            <strong>No.</strong> Because mmmetric doesn't collect personal data or use tracking cookies, you strictly do not need to display a cookie consent banner for our analytics. This improves your site's UX and conversion rates.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
