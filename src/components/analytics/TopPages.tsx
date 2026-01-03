import { FileText, ArrowRight } from "lucide-react";
import { TopPage } from "@/hooks/useAnalytics";

interface TopPagesProps {
  pages: TopPage[] | undefined;
  isLoading: boolean;
}

export function TopPages({ pages, isLoading }: TopPagesProps) {
  // Calculate max views for progress bars
  const maxViews = pages && pages.length > 0 ? Math.max(...pages.map(p => p.pageviews)) : 0;

  return (
    <div className="card bg-base-100 shadow-sm border border-base-200">
      <div className="card-body p-0">
        <div className="flex items-center justify-between p-4 border-b border-base-200">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <FileText className="h-4 w-4" />
            </div>
            <h3 className="font-semibold text-base">Top Pages</h3>
          </div>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="skeleton h-4 w-2/3"></div>
                <div className="skeleton h-4 w-12 ml-auto"></div>
              </div>
            ))}
          </div>
        ) : pages && pages.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr className="bg-base-50 text-base-content/60 text-xs uppercase tracking-wider">
                  <th className="w-full pl-4 font-medium">Page Path</th>
                  <th className="text-right font-medium">Unique</th>
                  <th className="text-right pr-4 font-medium">Views</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((page, index) => {
                  const percentage = maxViews > 0 ? (page.pageviews / maxViews) * 100 : 0;
                  return (
                    <tr key={index} className="hover:bg-base-50 group transition-colors">
                      <td className="pl-4 max-w-[200px] md:max-w-xs relative">
                        {/* Background progress bar */}
                        <div
                          className="absolute inset-y-0 left-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ width: `${percentage}%` }}
                        />
                        <div className="flex items-center gap-2 relative z-10">
                          <span className="text-xs text-base-content/40 font-mono w-4">{index + 1}</span>
                          <div className="flex items-center gap-1.5 min-w-0" title={page.url}>
                            <span className="truncate font-medium text-sm text-base-content/80 group-hover:text-primary transition-colors">
                              {page.url}
                            </span>
                            <a
                              href={`https://${page.url.startsWith('http') ? '' : ''}${page.url}`} // This assumes relative path or needs context of domain, but keeping simple
                              target="_blank"
                              rel="noopener noreferrer"
                              className="opacity-0 group-hover:opacity-100 text-base-content/40 hover:text-primary transition-all"
                            >
                              <ArrowRight className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                      </td>
                      <td className="text-right font-mono text-sm text-base-content/60">{page.uniqueVisitors}</td>
                      <td className="text-right pr-4 font-bold text-sm">{page.pageviews}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-base-content/40">
            <FileText className="h-10 w-10 mb-2 opacity-20" />
            <p className="text-sm">No page data recorded yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

