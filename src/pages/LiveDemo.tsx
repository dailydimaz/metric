
import { useState } from "react";
import { Link } from "react-router-dom";
import {
    LayoutDashboard,
    MousePointerClick,
    GitBranch,
    Users,
    Menu,
    ChevronDown,
    Globe,
    ArrowLeft
} from "lucide-react";
import mmmetricLogo from "@/assets/mmmetric-logo.png";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
    StatsCards,
    VisitorChart,
    TopPages,
    TopReferrers,
    DeviceStats,
    GeoStats,
    LanguageStats
} from "@/components/analytics";
import { addDays, format, subDays } from "date-fns";

// --- Mock Data ---

const now = new Date();
const dates = Array.from({ length: 30 }).map((_, i) => subDays(now, 29 - i));

const mockTimeSeries = dates.map(date => {
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const baseViews = isWeekend ? 800 : 1500;
    return {
        date: date.toISOString(),
        pageviews: baseViews + Math.floor(Math.random() * 500),
        visitors: (baseViews * 0.7) + Math.floor(Math.random() * 300),
    };
});

const mockStats = {
    totalPageviews: 45231,
    uniqueVisitors: 28402,
    bounceRate: 42.5,
    avgSessionDuration: 145,
    pageviewsChange: 12.5,
    visitorsChange: 8.2,
};

const mockTopPages = [
    { url: "/", pageviews: 21042, uniqueVisitors: 15400 },
    { url: "/blog/why-privacy-matters", pageviews: 8520, uniqueVisitors: 7200 },
    { url: "/docs/installation", pageviews: 4200, uniqueVisitors: 3100 },
    { url: "/pricing", pageviews: 3150, uniqueVisitors: 2800 },
    { url: "/about", pageviews: 1800, uniqueVisitors: 1500 },
];

const mockTopReferrers = [
    { referrer: "Direct", visits: 12500, percentage: 44 },
    { referrer: "google.com", visits: 8400, percentage: 30 },
    { referrer: "t.co", visits: 3200, percentage: 11 },
    { referrer: "github.com", visits: 2100, percentage: 7.5 },
    { referrer: "news.ycombinator.com", visits: 1800, percentage: 6.3 },
];

const mockDevices = {
    browsers: [
        { name: "Chrome", value: 17500, percentage: 62.5 },
        { name: "Safari", value: 6800, percentage: 24.2 },
        { name: "Firefox", value: 2350, percentage: 8.4 },
        { name: "Edge", value: 1370, percentage: 4.9 },
    ],
    operatingSystems: [
        { name: "Windows", value: 12700, percentage: 45.2 },
        { name: "Mac OS", value: 9200, percentage: 32.8 },
        { name: "iOS", value: 3500, percentage: 12.5 },
        { name: "Android", value: 2400, percentage: 8.5 },
    ],
    devices: [
        { name: "Desktop", value: 22000, percentage: 78.5 },
        { name: "Mobile", value: 5400, percentage: 19.2 },
        { name: "Tablet", value: 650, percentage: 2.3 },
    ],
};

const mockGeoStats = [
    { country: "US", visits: 12400, percentage: 44.2 },
    { country: "DE", visits: 4200, percentage: 15.0 },
    { country: "GB", visits: 3800, percentage: 13.5 },
    { country: "FR", visits: 2100, percentage: 7.5 },
    { country: "IN", visits: 1800, percentage: 6.4 },
];

const mockCityStats = [
    { city: "San Francisco", country: "US", visits: 3200, percentage: 11.4 },
    { city: "Berlin", country: "DE", visits: 2100, percentage: 7.5 },
    { city: "London", country: "GB", visits: 1900, percentage: 6.8 },
    { city: "New York", country: "US", visits: 1500, percentage: 5.3 },
    { city: "Paris", country: "FR", visits: 1200, percentage: 4.2 },
];

const mockLanguageStats = [
    { language: "en", percentage: 65.4, visits: 18400 },
    { language: "de", percentage: 12.2, visits: 3400 },
    { language: "es", percentage: 8.5, visits: 2400 },
    { language: "fr", percentage: 5.4, visits: 1520 },
];

// --- Live Demo Component ---

export default function LiveDemo() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Replicating Dashboard Sidebar Navigation
    const navItems = [
        { icon: LayoutDashboard, label: "Overview", href: "#", active: false },
        { icon: MousePointerClick, label: "Analytics", href: "#", active: true },
        { icon: GitBranch, label: "Funnels", href: "#", active: false },
        { icon: Users, label: "Retention", href: "#", active: false },
    ];

    return (
        <div className="flex min-h-screen bg-background font-sans">
            {/* Desktop Sidebar */}
            <div className="hidden lg:flex w-72 flex-col border-r border-border bg-card">
                <div className="p-6">
                    <Link to="/" className="flex items-center gap-3 px-2 mb-8 mt-2 group">
                        <img src={mmmetricLogo} alt="Logo" className="h-10 w-10 rounded-xl shadow-sm group-hover:scale-105 transition-transform" />
                        <div className="flex flex-col">
                            <span className="font-display font-bold text-xl tracking-tight">mmmetric</span>
                            <span className="text-xs text-muted-foreground">Privacy-first analytics</span>
                        </div>
                    </Link>

                    <ul className="space-y-1">
                        {navItems.map((item) => (
                            <li key={item.label}>
                                <a
                                    href={item.href}
                                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${item.active
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground opacity-60 cursor-not-allowed'
                                        }`}
                                    onClick={(e) => !item.active && e.preventDefault()}
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.label}
                                    {!item.active && <span className="ml-auto text-[10px] uppercase font-bold tracking-wider text-muted-foreground/70 bg-muted px-1.5 py-0.5 rounded">Pro</span>}
                                </a>
                            </li>
                        ))}
                    </ul>

                    <div className="mt-8 px-4 py-4 bg-muted/50 rounded-xl border border-border">
                        <h4 className="font-semibold text-sm mb-2">Live Demo Mode</h4>
                        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                            You are exploring a read-only potential of mmmetric.
                        </p>
                        <Link to="/auth?mode=signup">
                            <Button size="sm" className="w-full text-xs">
                                Get Started
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="mt-auto p-6">
                    <Link to="/">
                        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Home
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Mobile Sheet Sidebar */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetContent side="left" className="p-0 w-72">
                    <div className="flex flex-col h-full bg-card">
                        <div className="p-6">
                            <Link to="/" className="flex items-center gap-2 mb-8">
                                <img src={mmmetricLogo} alt="Logo" className="h-8 w-8 rounded-lg" />
                                <span className="font-bold text-lg">mmmetric</span>
                            </Link>
                            <ul className="space-y-1">
                                {navItems.map((item) => (
                                    <li key={item.label}>
                                        <a
                                            href={item.href}
                                            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${item.active
                                                ? 'bg-primary text-primary-foreground'
                                                : 'text-muted-foreground hover:bg-accent'
                                                }`}
                                            onClick={(e) => {
                                                if (!item.active) e.preventDefault();
                                                setMobileMenuOpen(false);
                                            }}
                                        >
                                            <item.icon className="h-4 w-4" />
                                            {item.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-8 px-4 py-4 bg-muted/50 rounded-xl border border-border">
                                <h4 className="font-semibold text-sm mb-2">Live Demo Mode</h4>
                                <Link to="/auth?mode=signup" onClick={() => setMobileMenuOpen(false)}>
                                    <Button size="sm" className="w-full text-xs">
                                        Get Started
                                    </Button>
                                </Link>
                            </div>
                        </div>
                        <div className="mt-auto p-6">
                            <Link to="/" onClick={() => setMobileMenuOpen(false)}>
                                <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                                    <ArrowLeft className="h-4 w-4" />
                                    Back to Home
                                </Button>
                            </Link>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-0 bg-muted/20">
                {/* Mobile Header */}
                <div className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-background/50 backdrop-blur-md sticky top-0 z-30">
                    <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)}>
                        <Menu className="h-5 w-5" />
                    </Button>
                    <span className="font-semibold">mmmetric Live Demo</span>
                    <Link to="/">
                        <Button variant="ghost" size="sm">Exit</Button>
                    </Link>
                </div>

                <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                    {/* Top Header (Desktop) */}
                    <div className="hidden lg:flex justify-between items-center mb-8">
                        <div className="flex items-center gap-4">
                            {/* Fake Site Selector */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="gap-2 text-lg font-normal h-auto py-2 px-3">
                                        <div className="flex flex-col items-start text-left gap-0.5">
                                            <span className="font-semibold">mmmetric.com</span>
                                            <span className="text-xs text-muted-foreground font-mono">Live Demo View</span>
                                        </div>
                                        <ChevronDown className="h-4 w-4 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-60" align="start">
                                    <div className="px-2 py-1.5 text-xs text-muted-foreground">
                                        You are viewing a public demo.
                                        <br />Data is mocked for privacy.
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground mr-2">Like what you see?</span>
                            <Link to="/auth">
                                <Button variant="outline" size="sm">Sign in</Button>
                            </Link>
                            <Link to="/auth?mode=signup">
                                <Button size="sm">Start for Free</Button>
                            </Link>
                        </div>
                    </div>

                    {/* Subheader / Page Title */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div className="flex items-center gap-4">
                            <ButtonBack />
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
                                <div className="text-muted-foreground flex items-center gap-2 mt-1">
                                    <Globe className="h-4 w-4" />
                                    mmmetric.com
                                </div>
                            </div>
                        </div>
                        {/* Mock Date Picker Display */}
                        <Button variant="outline" size="sm" className="w-full sm:w-auto justify-between font-normal">
                            Last 30 Days
                            <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
                        </Button>
                    </div>

                    {/* Analytics Components Grid */}
                    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
                        {/* Stats Overview */}
                        <StatsCards stats={mockStats} isLoading={false} />

                        {/* Main Chart */}
                        <VisitorChart data={mockTimeSeries} isLoading={false} />

                        {/* Two Column Layout */}
                        <div className="grid gap-6 lg:grid-cols-2">
                            <TopPages pages={mockTopPages} isLoading={false} />
                            <TopReferrers referrers={mockTopReferrers} isLoading={false} />
                        </div>

                        {/* Device Stats */}
                        <DeviceStats
                            browsers={mockDevices.browsers}
                            operatingSystems={mockDevices.operatingSystems}
                            devices={mockDevices.devices}
                            isLoading={false}
                        />

                        {/* Geo & Language Stats */}
                        <div className="grid gap-6 lg:grid-cols-2">
                            <GeoStats
                                countries={mockGeoStats}
                                cities={mockCityStats}
                                isLoading={false}
                            />
                            <LanguageStats
                                languages={mockLanguageStats}
                                isLoading={false}
                            />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

function ButtonBack() {
    return (
        <Link to="/">
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 shrink-0 lg:hidden">
                <ArrowLeft className="h-4 w-4" />
            </Button>
        </Link>
    )
}
