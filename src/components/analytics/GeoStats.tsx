import { useState } from "react";
import { MapPin, Building2, Map as MapIcon, Layers } from "lucide-react";
import { GeoStat, CityStat } from "@/hooks/useAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface GeoStatsProps {
  countries: GeoStat[] | undefined;
  cities: CityStat[] | undefined;
  isLoading: boolean;
  onBreakdown?: (country: string) => void;
}

// Country code to flag emoji
function getCountryFlag(countryCode: string): string {
  const code = countryCode.toUpperCase();
  if (code.length !== 2) return "🌍";
  const offset = 127397;
  return String.fromCodePoint(...[...code].map(c => c.charCodeAt(0) + offset));
}

// Country code to name (basic mapping)
const countryNames: Record<string, string> = {
  US: "United States", GB: "United Kingdom", DE: "Germany", FR: "France", CA: "Canada",
  AU: "Australia", JP: "Japan", CN: "China", IN: "India", BR: "Brazil",
  NL: "Netherlands", ES: "Spain", IT: "Italy", KR: "South Korea", RU: "Russia",
  MX: "Mexico", ID: "Indonesia", SE: "Sweden", NO: "Norway", DK: "Denmark",
  FI: "Finland", PL: "Poland", AT: "Austria", CH: "Switzerland", BE: "Belgium",
  PT: "Portugal", IE: "Ireland", NZ: "New Zealand", SG: "Singapore", HK: "Hong Kong",
};

function getCountryName(code: string): string {
  return countryNames[code.toUpperCase()] || code;
}

export function GeoStats({ countries, cities, isLoading, onBreakdown }: GeoStatsProps) {
  const [activeTab, setActiveTab] = useState<"countries" | "cities">("countries");

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <MapIcon className="h-4 w-4" />
          </div>
          <CardTitle className="text-base font-semibold">Locations</CardTitle>
        </div>

        <div className="flex items-center gap-2">
          {onBreakdown && activeTab === "countries" && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Layers className="h-3 w-3" />
            </span>
          )}
          <ToggleGroup type="single" value={activeTab} onValueChange={(val) => val && setActiveTab(val as "countries" | "cities")} className="bg-muted p-1 rounded-lg">
            <ToggleGroupItem value="countries" size="sm" className="h-7 text-xs data-[state=on]:bg-background data-[state=on]:shadow-sm">
              Countries
            </ToggleGroupItem>
            <ToggleGroupItem value="cities" size="sm" className="h-7 text-xs data-[state=on]:bg-background data-[state=on]:shadow-sm">
              Cities
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-hidden">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5 rounded" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
            </div>
          ) : activeTab === "countries" ? (
            countries && countries.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="w-full pl-4">Location</TableHead>
                      <TableHead className="text-right">Visits</TableHead>
                      <TableHead className="text-right pr-4">%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {countries.slice(0, 8).map((country, index) => (
                      <TableRow
                        key={index}
                        className={`hover:bg-muted/50 border-b border-border last:border-0 ${onBreakdown ? 'cursor-pointer' : ''}`}
                        onClick={() => onBreakdown?.(country.country)}
                      >
                        <TableCell className="w-full flex items-center gap-3 py-3 pl-4">
                          <span className="text-xl">{getCountryFlag(country.country)}</span>
                          <div className="relative flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[100px] md:max-w-[150px]">
                            <div
                              className="absolute inset-y-0 left-0 bg-primary rounded-full"
                              style={{ width: `${country.percentage}%` }}
                            />
                          </div>
                          <span className="font-medium text-sm truncate w-24 md:w-auto hover:text-primary transition-colors">{getCountryName(country.country)}</span>
                        </TableCell>
                        <TableCell className="text-right font-medium py-3">{country.visits}</TableCell>
                        <TableCell className="text-right font-mono text-xs text-muted-foreground w-16 py-3 pr-4">{country.percentage.toFixed(0)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/40">
                <MapPin className="h-10 w-10 mb-2 opacity-20" />
                <p className="text-sm">No country data yet</p>
              </div>
            )
          ) : (
            cities && cities.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="w-full pl-4">City</TableHead>
                      <TableHead className="text-right">Visits</TableHead>
                      <TableHead className="text-right pr-4">%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cities.slice(0, 8).map((city, index) => (
                      <TableRow key={index} className="hover:bg-muted/50 border-b border-border last:border-0">
                        <TableCell className="w-full flex items-center gap-3 py-3 pl-4">
                          <div className="p-1 rounded bg-muted text-muted-foreground">
                            <Building2 className="h-3 w-3" />
                          </div>
                          <div className="relative flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[100px] md:max-w-[150px]">
                            <div
                              className="absolute inset-y-0 left-0 bg-primary rounded-full"
                              style={{ width: `${city.percentage}%` }}
                            />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-sm truncate max-w-[120px]">{city.city}</span>
                            <span className="text-xs text-muted-foreground">{getCountryName(city.country)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium py-3">{city.visits}</TableCell>
                        <TableCell className="text-right font-mono text-xs text-muted-foreground w-16 py-3 pr-4">{city.percentage.toFixed(0)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/40">
                <Building2 className="h-10 w-10 mb-2 opacity-20" />
                <p className="text-sm">No city data yet</p>
              </div>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}
