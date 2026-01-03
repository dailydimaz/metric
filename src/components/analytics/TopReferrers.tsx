import { Link2, ArrowRight } from "lucide-react";
import { TopReferrer } from "@/hooks/useAnalytics";

interface TopReferrersProps {
  referrers: TopReferrer[] | undefined;
  isLoading: boolean;
}

export function TopReferrers({ referrers, isLoading }: TopReferrersProps) {
  // Calculate max visits for progress bars
  const maxVisits = referrers && referrers.length > 0 ? Math.max(...referrers.map(r => r.visits)) : 0;

  return (
    <div className="card bg-base-100 shadow-sm border border-base-200">
      <div className="card-body p-0">
        <div className="flex items-center justify-between p-4 border-b border-base-200">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-secondary/10 rounded-lg text-secondary">
              <Link2 className="h-4 w-4" />
            </div>
            <h3 className="font-semibold text-base">Top Referrers</h3>
          </div>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="skeleton h-4 w-1/2"></div>
                <div className="skeleton h-4 w-12 ml-auto"></div>
              </div>
            ))}
          </div>
        ) : referrers && referrers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr className="bg-base-50 text-base-content/60 text-xs uppercase tracking-wider">
                  <th className="w-full pl-4 font-medium">Source</th>
                  <th className="text-right font-medium">Visits</th>
                  <th className="text-right pr-4 font-medium">%</th>
                </tr>
              </thead>
              <tbody>
                {referrers.map((ref, index) => {
                  const percentage = maxVisits > 0 ? (ref.visits / maxVisits) * 100 : 0;
                  return (
                    <tr key={index} className="hover:bg-base-50 group transition-colors">
                      <td className="pl-4 relative">
                        {/* Background progress bar */}
                        <div
                          className="absolute inset-y-0 left-0 bg-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ width: `${percentage}%` }}
                        />
                        <div className="flex items-center gap-2 relative z-10">
                          <span className="text-xs text-base-content/40 font-mono w-4">{index + 1}</span>
                          <span className="truncate max-w-[150px] md:max-w-xs font-medium text-sm text-base-content/80 group-hover:text-secondary transition-colors" title={ref.referrer}>
                            {ref.referrer}
                          </span>
                          {ref.referrer !== 'Direct' && (
                            <a
                              href={`https://${ref.referrer}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="opacity-0 group-hover:opacity-100 text-base-content/40 hover:text-secondary transition-all"
                            >
                              <ArrowRight className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="text-right font-bold text-sm">{ref.visits}</td>
                      <td className="text-right pr-4 font-mono text-xs text-base-content/60">{ref.percentage.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-base-content/40">
            <Link2 className="h-10 w-10 mb-2 opacity-20" />
            <p className="text-sm">No referrer data yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

