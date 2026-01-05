
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
        <div className="drawer lg:drawer-open bg-base-100 min-h-screen font-sans">
            <input
                id="dashboard-drawer"
                type="checkbox"
                className="drawer-toggle"
                checked={mobileMenuOpen}
                onChange={(e) => setMobileMenuOpen(e.target.checked)}
            />

            {/* Page Content */}
            <div className="drawer-content flex flex-col">
                {/* Mobile Navbar */}
                <div className="w-full navbar border-b border-base-300 bg-base-100/50 backdrop-blur-md sticky top-0 z-30 lg:hidden">
                    <div className="flex-none lg:hidden">
                        <label htmlFor="dashboard-drawer" className="btn btn-square btn-ghost">
                            <Menu className="h-6 w-6" />
                        </label>
                    </div>
                    <div className="flex-1 px-2 mx-2">
                        <span className="font-bold text-lg">mmmetric Live Demo</span>
                    </div>
                    <div className="flex-none">
                        <Link to="/" className="btn btn-sm btn-ghost">Exit</Link>
                    </div>
                </div>

                {/* Main Content Area */}
                <main className="flex-1 p-6 md:p-8 overflow-y-auto">

                    {/* Top Header (Desktop) */}
                    <div className="hidden lg:flex justify-between items-center mb-8">
                        <div className="flex items-center gap-4">
                            {/* Fake Site Selector */}
                            <div className="dropdown dropdown-hover">
                                <div tabIndex={0} role="button" className="btn btn-ghost gap-2 normal-case font-normal text-lg">
                                    <div className="flex flex-col items-start text-left gap-0.5">
                                        <span className="font-semibold">mmmetric.com</span>
                                        <span className="text-xs opacity-60 font-mono">Live Demo View</span>
                                    </div>
                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                </div>
                                <div className="dropdown-content z-[1] menu p-2 shadow-xl bg-base-100 rounded-box w-60 border border-base-200">
                                    <div className="px-4 py-2 text-xs text-base-content/50">
                                        You are viewing a public demo.
                                        <br />Data is mocked for privacy.
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CTA Buttons instead of User Menu */}
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-base-content/60 mr-2">Like what you see?</span>
                            <Link to="/auth" className="btn btn-outline btn-sm">Sign in</Link>
                            <Link to="/auth?mode=signup" className="btn btn-primary btn-sm">Start for Free</Link>
                        </div>
                    </div>

                    {/* Subheader / Page Title */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div className="flex items-center gap-4">
                            <ButtonBack />
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
                                <div className="text-base-content/70 flex items-center gap-2 mt-1">
                                    <Globe className="h-4 w-4" />
                                    mmmetric.com
                                </div>
                            </div>
                        </div>
                        {/* Mock Date Picker Display */}
                        <div className="btn btn-outline btn-sm font-normal normal-case">
                            Last 30 Days
                            <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
                        </div>
                    </div>

                    {/* Analytics Components Grid */}
                    <div className="space-y-6 animate-in fade-in duration-500">
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

            {/* Sidebar (Replicated Style) */}
            <div className="drawer-side z-40">
                <label htmlFor="dashboard-drawer" className="drawer-overlay"></label>
                <div className="menu p-4 w-72 min-h-full bg-base-100 text-base-content border-r border-base-200 flex flex-col justify-between">
                    <div>
                        <Link to="/" className="flex items-center gap-3 px-2 mb-8 mt-2 group">
                            <img src={mmmetricLogo} alt="Logo" className="h-10 w-10 rounded-xl shadow-sm group-hover:scale-105 transition-transform" />
                            <div className="flex flex-col">
                                <span className="font-display font-bold text-xl tracking-tight">mmmetric</span>
                                <span className="text-xs text-base-content/60">Privacy-first analytics</span>
                            </div>
                        </Link>

                        <ul className="space-y-1">
                            {navItems.map((item) => (
                                <li key={item.label}>
                                    <a
                                        href={item.href}
                                        className={`text-base font-medium gap-3 rounded-lg py-3 ${item.active
                                                ? 'active bg-primary text-primary-foreground shadow-md'
                                                : 'hover:bg-base-200 opacity-60 cursor-not-allowed'
                                            }`}
                                        onClick={(e) => !item.active && e.preventDefault()}
                                    >
                                        <item.icon className="h-5 w-5" />
                                        {item.label}
                                        {!item.active && <span className="badge badge-xs badge-ghost ml-auto">Pro</span>}
                                    </a>
                                </li>
                            ))}
                        </ul>

                        <div className="mt-8 px-4 py-4 bg-base-200/50 rounded-xl border border-base-200">
                            <h4 className="font-semibold text-sm mb-2">Live Demo Mode</h4>
                            <p className="text-xs text-base-content/60 mb-3">
                                You are exploring a read-only potential of mmmetric.
                            </p>
                            <Link to="/auth?mode=signup" className="btn btn-primary btn-xs w-full">
                                Get Started
                            </Link>
                        </div>
                    </div>

                    <div className="px-2 py-4">
                        <Link to="/" className="btn btn-ghost btn-sm w-full justify-start gap-3">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ButtonBack() {
    return (
        <Link to="/" className="btn btn-ghost btn-icon rounded-full h-8 w-8 shrink-0 lg:hidden">
            <ArrowLeft className="h-4 w-4" />
        </Link>
    )
}
