import { FileText, ArrowRight, Layers } from "lucide-react";
import { TopPage } from "@/hooks/useAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface TopPagesProps {
  pages: TopPage[] | undefined;
  isLoading: boolean;
  onBreakdown?: (url: string) => void;
}

export function TopPages({ pages, isLoading, onBreakdown }: TopPagesProps) {
  // Calculate max views for progress bars
  const maxViews = pages && pages.length > 0 ? Math.max(...pages.map(p => p.pageviews)) : 0;

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <FileText className="h-4 w-4" />
          </div>
          <CardTitle className="text-base font-semibold">Top Pages</CardTitle>
        </div>
        {onBreakdown && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Layers className="h-3 w-3" />
            <span className="hidden sm:inline">Click to drill down</span>
          </span>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-hidden">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-12 ml-auto" />
                </div>
              ))}
            </div>
          ) : pages && pages.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-full pl-4">Page Path</TableHead>
                    <TableHead className="text-right">Unique</TableHead>
                    <TableHead className="text-right pr-4">Views</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pages.map((page, index) => {
                    const percentage = maxViews > 0 ? (page.pageviews / maxViews) * 100 : 0;
                    return (
                      <TableRow
                        key={index}
                        className={`group cursor-pointer hover:bg-muted/50 transition-colors border-b border-border last:border-0`}
                        onClick={() => onBreakdown?.(page.url)}
                      >
                        <TableCell className="pl-4 relative max-w-[200px] md:max-w-xs">
                          {/* Background progress bar */}
                          <div
                            className="absolute inset-y-0 left-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ width: `${percentage}%` }}
                          />
                          <div className="flex items-center gap-3 relative z-10">
                            <span className="text-xs text-muted-foreground font-mono w-4">{index + 1}</span>
                            <div className="flex items-center gap-2 min-w-0" title={page.url}>
                              <span className="truncate font-medium text-sm text-foreground/90 group-hover:text-primary transition-colors">
                                {page.url}
                              </span>
                              <a
                                href={`${page.url.startsWith('http') ? '' : 'https://'}${page.url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-all"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ArrowRight className="h-3 w-3" />
                              </a>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm text-muted-foreground">{page.uniqueVisitors}</TableCell>
                        <TableCell className="text-right pr-4 font-bold text-sm">{page.pageviews}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/40">
              <FileText className="h-10 w-10 mb-2 opacity-20" />
              <p className="text-sm">No page data recorded yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
