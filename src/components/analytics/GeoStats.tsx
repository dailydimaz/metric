import { useState } from "react";
import { MapPin, Building2, Map } from "lucide-react";
import { GeoStat, CityStat } from "@/hooks/useAnalytics";

interface GeoStatsProps {
  countries: GeoStat[] | undefined;
  cities: CityStat[] | undefined;
  isLoading: boolean;
}

// Country code to flag emoji
function getCountryFlag(countryCode: string): string {
  const code = countryCode.toUpperCase();
  if (code.length !== 2) return "🌍";
  const offset = 127397;
  return String.fromCodePoint(...[...code].map(c => c.charCodeAt(0) + offset));
}

// Country code to name (basic mapping) - keeping the same map for brevity but ideally this should be a utility
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

export function GeoStats({ countries, cities, isLoading }: GeoStatsProps) {
  const [activeTab, setActiveTab] = useState<"countries" | "cities">("countries");

  return (
    <div className="card bg-base-100 shadow-sm border border-base-200 h-full">
      <div className="card-body p-0">
        <div className="flex items-center justify-between p-4 border-b border-base-200">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-info/10 rounded-lg text-info">
              <Map className="h-4 w-4" />
            </div>
            <h3 className="font-semibold text-base">Locations</h3>
          </div>

          <div className="join">
            <button
              className={`join-item btn btn-sm ${activeTab === "countries" ? "btn-active btn-neutral" : "btn-ghost"}`}
              onClick={() => setActiveTab("countries")}
            >
              Countries
            </button>
            <button
              className={`join-item btn btn-sm ${activeTab === "cities" ? "btn-active btn-neutral" : "btn-ghost"}`}
              onClick={() => setActiveTab("cities")}
            >
              Cities
            </button>
          </div>
        </div>

        <div className="p-0 overflow-hidden">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="skeleton h-5 w-5 rounded"></div>
                    <div className="skeleton h-4 w-24"></div>
                  </div>
                  <div className="skeleton h-4 w-12"></div>
                </div>
              ))}
            </div>
          ) : activeTab === "countries" ? (
            countries && countries.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="table">
                  <tbody>
                    {countries.slice(0, 8).map((country, index) => (
                      <tr key={index} className="hover:bg-base-50 group border-b border-base-100 last:border-0">
                        <td className="w-full flex items-center gap-3">
                          <span className="text-xl">{getCountryFlag(country.country)}</span>
                          <div className="relative flex-1 h-1.5 bg-base-200 rounded-full overflow-hidden max-w-[100px] md:max-w-[150px]">
                            <div
                              className="absolute inset-y-0 left-0 bg-info rounded-full"
                              style={{ width: `${country.percentage}%` }}
                            />
                          </div>
                          <span className="font-medium text-sm truncate w-24 md:w-auto">{getCountryName(country.country)}</span>
                        </td>
                        <td className="text-right font-medium">{country.visits}</td>
                        <td className="text-right font-mono text-xs text-base-content/60 w-16">{country.percentage.toFixed(0)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-base-content/40">
                <MapPin className="h-10 w-10 mb-2 opacity-20" />
                <p className="text-sm">No country data yet</p>
              </div>
            )
          ) : (
            cities && cities.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="table">
                  <tbody>
                    {cities.slice(0, 8).map((city, index) => (
                      <tr key={index} className="hover:bg-base-50 group border-b border-base-100 last:border-0">
                        <td className="w-full flex items-center gap-3">
                          <div className="p-1 rounded bg-base-200 text-base-content/40">
                            <Building2 className="h-3 w-3" />
                          </div>
                          <div className="relative flex-1 h-1.5 bg-base-200 rounded-full overflow-hidden max-w-[100px] md:max-w-[150px]">
                            <div
                              className="absolute inset-y-0 left-0 bg-info rounded-full"
                              style={{ width: `${city.percentage}%` }}
                            />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-sm truncate max-w-[120px]">{city.city}</span>
                            <span className="text-xs text-base-content/40">{getCountryName(city.country)}</span>
                          </div>
                        </td>
                        <td className="text-right font-medium">{city.visits}</td>
                        <td className="text-right font-mono text-xs text-base-content/60 w-16">{city.percentage.toFixed(0)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-base-content/40">
                <Building2 className="h-10 w-10 mb-2 opacity-20" />
                <p className="text-sm">No city data yet</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

