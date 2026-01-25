import { useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { GeoStat, CityStat } from "@/hooks/useAnalytics";
import { Loader2, Users, Eye, MousePointerClick, TrendingUp, Plus, Minus, RotateCcw, Building2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

// TopoJSON for the world map - using a reliable CDN source
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface GeoMapProps {
    data: GeoStat[] | undefined;
    cities?: CityStat[] | undefined;
    isLoading: boolean;
    onCountryClick?: (countryCode: string) => void;
}

// Comprehensive country code to name mapping
const countryNames: Record<string, string> = {
    US: "United States", GB: "United Kingdom", DE: "Germany", FR: "France", CA: "Canada",
    AU: "Australia", JP: "Japan", CN: "China", IN: "India", BR: "Brazil",
    NL: "Netherlands", ES: "Spain", IT: "Italy", KR: "South Korea", RU: "Russia",
    MX: "Mexico", ID: "Indonesia", SE: "Sweden", NO: "Norway", DK: "Denmark",
    FI: "Finland", PL: "Poland", AT: "Austria", CH: "Switzerland", BE: "Belgium",
    PT: "Portugal", IE: "Ireland", NZ: "New Zealand", SG: "Singapore", HK: "Hong Kong",
    AR: "Argentina", CL: "Chile", CO: "Colombia", PH: "Philippines", TH: "Thailand",
    MY: "Malaysia", VN: "Vietnam", ZA: "South Africa", NG: "Nigeria", EG: "Egypt",
    UA: "Ukraine", CZ: "Czech Republic", RO: "Romania", HU: "Hungary", GR: "Greece",
    TR: "Turkey", IL: "Israel", AE: "United Arab Emirates", SA: "Saudi Arabia", PK: "Pakistan",
    BD: "Bangladesh", TW: "Taiwan", KE: "Kenya", MA: "Morocco", DZ: "Algeria",
    PE: "Peru", VE: "Venezuela", EC: "Ecuador", GT: "Guatemala", CR: "Costa Rica",
};

function getCountryName(code: string): string {
    return countryNames[code?.toUpperCase()] || code || "Unknown";
}

function getCountryFlag(countryCode: string): string {
    const code = countryCode?.toUpperCase();
    if (!code || code.length !== 2) return "🌍";
    const offset = 127397;
    return String.fromCodePoint(...[...code].map(c => c.charCodeAt(0) + offset));
}

export function GeoMap({ data, cities, isLoading, onCountryClick }: GeoMapProps) {
    const [position, setPosition] = useState({ coordinates: [0, 20] as [number, number], zoom: 1 });
    const [hoveredCountry, setHoveredCountry] = useState<{
        code: string;
        name: string;
        visits: number;
        percentage: number;
        x: number;
        y: number;
    } | null>(null);

    const { colorScale, maxVisits, hasData } = useMemo(() => {
        if (!data || data.length === 0) {
            return {
                colorScale: () => "hsl(var(--muted))",
                maxVisits: 0,
                hasData: false,
            };
        }
        const maxVal = Math.max(...data.map(d => d.visits));

        return {
            colorScale: scaleLinear<string>()
                .domain([0, maxVal * 0.25, maxVal * 0.5, maxVal])
                .range(["hsl(217, 91%, 95%)", "hsl(217, 91%, 80%)", "hsl(217, 91%, 60%)", "hsl(217, 91%, 40%)"]),
            maxVisits: maxVal,
            hasData: true,
        };
    }, [data]);

    const countryDataMap = useMemo(() => {
        const map = new Map<string, GeoStat>();
        data?.forEach(d => {
            map.set(d.country?.toUpperCase(), d);
        });
        return map;
    }, [data]);

    // Get top 5 countries for the legend
    const topCountries = useMemo(() => {
        if (!data) return [];
        return [...data]
            .sort((a, b) => b.visits - a.visits)
            .slice(0, 5);
    }, [data]);

    const getTopCities = (countryCode: string) => {
        if (!cities) return [];
        return cities
            .filter(c => c.country?.toUpperCase() === countryCode)
            .sort((a, b) => b.visits - a.visits)
            .slice(0, 3);
    };

    const handleZoomIn = () => {
        if (position.zoom >= 4) return;
        setPosition((pos) => ({ ...pos, zoom: Math.min(pos.zoom * 1.5, 4) }));
    };

    const handleZoomOut = () => {
        if (position.zoom <= 1) return;
        setPosition((pos) => ({ ...pos, zoom: Math.max(pos.zoom / 1.5, 1) }));
    };

    const handleResetZoom = () => {
        setPosition({ coordinates: [0, 20], zoom: 1 });
    };

    if (isLoading) {
        return (
            <div className="h-[400px] w-full flex items-center justify-center bg-muted/20 rounded-lg">
                <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
            </div>
        );
    }

    const topCitiesForHover = hoveredCountry ? getTopCities(hoveredCountry.code) : [];

    return (
        <div className="w-full rounded-lg bg-gradient-to-br from-muted/20 to-muted/5 border border-border/50 relative overflow-hidden group">
            {/* Zoom Controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 shadow-sm bg-background/80 backdrop-blur hover:bg-background"
                    onClick={handleZoomIn}
                    disabled={position.zoom >= 4}
                >
                    <Plus className="h-4 w-4" />
                </Button>
                <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 shadow-sm bg-background/80 backdrop-blur hover:bg-background"
                    onClick={handleZoomOut}
                    disabled={position.zoom <= 1}
                >
                    <Minus className="h-4 w-4" />
                </Button>
                <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 shadow-sm bg-background/80 backdrop-blur hover:bg-background"
                    onClick={handleResetZoom}
                >
                    <RotateCcw className="h-4 w-4" />
                </Button>
            </div>

            {/* Map Container */}
            <div className="h-[400px] relative cursor-move active:cursor-grabbing bg-[#f8fafc] dark:bg-[#0f172a]">
                <ComposableMap
                    projectionConfig={{ scale: 147 }}
                    className="w-full h-full"
                >
                    <ZoomableGroup
                        zoom={position.zoom}
                        center={position.coordinates}
                        onMoveEnd={({ coordinates, zoom }) => setPosition({ coordinates: coordinates as [number, number], zoom })}
                        maxZoom={4}
                    >
                        <Geographies geography={GEO_URL}>
                            {({ geographies }) =>
                                geographies.map((geo) => {
                                    const countryCode = geo.properties.ISO_A2?.toUpperCase();
                                    const stat = countryDataMap.get(countryCode);
                                    const hasVisits = !!stat && stat.visits > 0;

                                    // Calculate fill color
                                    const fill = hasVisits
                                        ? colorScale(stat.visits)
                                        : "hsl(var(--muted) / 0.5)";

                                    return (
                                        <Geography
                                            key={geo.rsmKey}
                                            geography={geo}
                                            onMouseEnter={(e) => {
                                                const name = geo.properties.name || getCountryName(countryCode);
                                                // Get bounding rect for safer tooltip positioning relative to viewport
                                                setHoveredCountry({
                                                    code: countryCode,
                                                    name,
                                                    visits: stat?.visits || 0,
                                                    percentage: stat?.percentage || 0,
                                                    x: e.clientX,
                                                    y: e.clientY,
                                                });
                                            }}
                                            onMouseLeave={() => {
                                                setHoveredCountry(null);
                                            }}
                                            onClick={() => {
                                                if (countryCode && onCountryClick && hasVisits) {
                                                    onCountryClick(countryCode);
                                                }
                                            }}
                                            style={{
                                                default: {
                                                    fill,
                                                    outline: "none",
                                                    stroke: "hsl(var(--border) / 0.5)",
                                                    strokeWidth: 0.5,
                                                    transition: "fill 0.2s ease",
                                                },
                                                hover: {
                                                    fill: hasVisits ? "hsl(var(--primary))" : "hsl(var(--muted))",
                                                    outline: "none",
                                                    cursor: hasVisits ? "pointer" : "default",
                                                    stroke: "hsl(var(--primary))",
                                                    strokeWidth: hasVisits ? 1 : 0.5,
                                                },
                                                pressed: {
                                                    fill: "hsl(var(--primary) / 0.8)",
                                                    outline: "none",
                                                },
                                            }}
                                        />
                                    );
                                })
                            }
                        </Geographies>
                    </ZoomableGroup>
                </ComposableMap>

                {/* Animated Tooltip - Fixed position following mouse but clamped to container could be hard, 
            so we use fixed viewport positioning which is easier with clientX/Y */}
                <AnimatePresence>
                    {hoveredCountry && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.15 }}
                            style={{
                                position: 'fixed',
                                left: hoveredCountry.x + 20,
                                top: hoveredCountry.y - 20,
                                pointerEvents: 'none',
                            }}
                            className="z-50 min-w-[220px] max-w-[280px]"
                        >
                            <div className="bg-background/95 backdrop-blur-xl p-3 rounded-xl border border-border shadow-xl">
                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/50">
                                    <span className="text-2xl">{getCountryFlag(hoveredCountry.code)}</span>
                                    <div className="flex flex-col leading-none">
                                        <span className="font-semibold text-foreground text-sm">{hoveredCountry.name}</span>
                                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mt-0.5">
                                            {hoveredCountry.code}
                                        </span>
                                    </div>
                                </div>

                                {hoveredCountry.visits > 0 ? (
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="bg-muted/30 p-2 rounded-lg">
                                                <span className="text-xs text-muted-foreground flex items-center gap-1 mb-0.5">
                                                    <Users className="h-3 w-3" />
                                                    Visits
                                                </span>
                                                <span className="font-mono font-medium text-sm block">
                                                    {hoveredCountry.visits.toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="bg-muted/30 p-2 rounded-lg">
                                                <span className="text-xs text-muted-foreground flex items-center gap-1 mb-0.5">
                                                    <TrendingUp className="h-3 w-3" />
                                                    Share
                                                </span>
                                                <span className="font-mono font-medium text-sm block">
                                                    {hoveredCountry.percentage.toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>

                                        {topCitiesForHover.length > 0 && (
                                            <div className="pt-1">
                                                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block flex items-center gap-1">
                                                    <Building2 className="h-3 w-3" />
                                                    Top Cities
                                                </span>
                                                <div className="space-y-1">
                                                    {topCitiesForHover.map((city) => (
                                                        <div key={city.city} className="flex items-center justify-between text-xs p-1.5 rounded hover:bg-muted/50 transition-colors">
                                                            <span className="font-medium truncate max-w-[100px]">{city.city}</span>
                                                            <span className="text-muted-foreground font-mono">{city.visits.toLocaleString()}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {onCountryClick && (
                                            <div className="pt-2 mt-1 border-t border-border/50 text-center">
                                                <span className="text-[10px] text-primary flex items-center justify-center gap-1 font-medium">
                                                    <MousePointerClick className="h-3 w-3" />
                                                    Click for breakdown
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground py-1">No visitors from this country</p>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom Legend & Stats */}
            <div className="px-4 py-3 border-t border-border/50 bg-muted/20">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                    {/* Color Scale Legend */}
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground font-medium">Density:</span>
                        <div className="flex items-center gap-1">
                            <div className="w-6 h-3 rounded-sm" style={{ backgroundColor: "hsl(217, 91%, 95%)" }} />
                            <div className="w-6 h-3 rounded-sm" style={{ backgroundColor: "hsl(217, 91%, 80%)" }} />
                            <div className="w-6 h-3 rounded-sm" style={{ backgroundColor: "hsl(217, 91%, 60%)" }} />
                            <div className="w-6 h-3 rounded-sm" style={{ backgroundColor: "hsl(217, 91%, 40%)" }} />
                        </div>
                    </div>

                    {/* Top Countries Quick Stats */}
                    {topCountries.length > 0 && (
                        <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 md:pb-0 hide-scrollbar">
                            <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">Top:</span>
                            <div className="flex items-center gap-2">
                                {topCountries.slice(0, 3).map((country) => (
                                    <button
                                        key={country.country}
                                        onClick={() => onCountryClick?.(country.country)}
                                        className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-background/60 hover:bg-background border border-border/50 transition-colors text-xs whitespace-nowrap"
                                    >
                                        <span>{getCountryFlag(country.country)}</span>
                                        <span className="font-medium">{country.visits.toLocaleString()}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* No Data State */}
            {!hasData && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-20 pointer-events-none">
                    <div className="text-center">
                        <Eye className="h-10 w-10 mx-auto mb-2 text-muted-foreground/30" />
                        <p className="text-sm text-muted-foreground">No geographic data yet</p>
                    </div>
                </div>
            )}
        </div>
    );
}