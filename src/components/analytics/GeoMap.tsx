import { useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { GeoStat } from "@/hooks/useAnalytics";
import { Loader2, Users, Eye, MousePointerClick, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// TopoJSON for the world map - using a reliable CDN source
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface GeoMapProps {
  data: GeoStat[] | undefined;
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

export function GeoMap({ data, isLoading, onCountryClick }: GeoMapProps) {
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
        .range(["hsl(217, 91%, 90%)", "hsl(217, 91%, 70%)", "hsl(217, 91%, 55%)", "hsl(217, 91%, 40%)"]),
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

  if (isLoading) {
    return (
      <div className="h-[400px] w-full flex items-center justify-center bg-muted/20 rounded-lg">
        <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
      </div>
    );
  }

  return (
    <div className="w-full rounded-lg bg-gradient-to-br from-muted/20 to-muted/5 border border-border/50 relative overflow-hidden">
      {/* Map Container */}
      <div className="h-[350px] relative">
        <ComposableMap 
          projectionConfig={{ scale: 147, center: [0, 20] }} 
          className="w-full h-full"
        >
          <ZoomableGroup center={[0, 20]} maxZoom={4}>
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

        {/* Animated Tooltip */}
        <AnimatePresence>
          {hoveredCountry && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.15 }}
              className="absolute top-4 left-4 bg-background/95 backdrop-blur-xl px-4 py-3 rounded-xl border border-border shadow-lg z-20 min-w-[200px]"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{getCountryFlag(hoveredCountry.code)}</span>
                <span className="font-semibold text-foreground">{hoveredCountry.name}</span>
              </div>
              
              {hoveredCountry.visits > 0 ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      Visitors
                    </span>
                    <span className="font-mono font-medium">{hoveredCountry.visits.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5" />
                      Share
                    </span>
                    <span className="font-mono font-medium">{hoveredCountry.percentage.toFixed(1)}%</span>
                  </div>
                  {onCountryClick && (
                    <div className="pt-2 mt-2 border-t border-border/50">
                      <span className="text-xs text-primary flex items-center gap-1">
                        <MousePointerClick className="h-3 w-3" />
                        Click for detailed breakdown
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No visitors from this country</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Legend & Stats */}
      <div className="px-4 py-3 border-t border-border/50 bg-muted/20">
        <div className="flex items-center justify-between">
          {/* Color Scale Legend */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground font-medium">Visitors:</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: "hsl(217, 91%, 90%)" }} />
              <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: "hsl(217, 91%, 70%)" }} />
              <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: "hsl(217, 91%, 55%)" }} />
              <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: "hsl(217, 91%, 40%)" }} />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>0</span>
              <span>→</span>
              <span>{maxVisits.toLocaleString()}</span>
            </div>
          </div>

          {/* Top Countries Quick Stats */}
          {topCountries.length > 0 && (
            <div className="hidden md:flex items-center gap-3">
              <span className="text-xs text-muted-foreground font-medium">Top:</span>
              <div className="flex items-center gap-2">
                {topCountries.slice(0, 3).map((country) => (
                  <button
                    key={country.country}
                    onClick={() => onCountryClick?.(country.country)}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-background/60 hover:bg-background border border-border/50 transition-colors text-xs"
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
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="text-center">
            <Eye className="h-10 w-10 mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No geographic data yet</p>
          </div>
        </div>
      )}
    </div>
  );
}