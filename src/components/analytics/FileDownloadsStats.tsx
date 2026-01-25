import { FileIcon, Download, FileText } from "lucide-react";
import { DateRange } from "@/hooks/useAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { useFileDownloads } from "@/hooks/useFileDownloads";

interface FileDownloadsStatsProps {
    siteId: string;
    dateRange: DateRange;
}

export function FileDownloadsStats({ siteId, dateRange }: FileDownloadsStatsProps) {
    const { data: downloads, isLoading } = useFileDownloads({ siteId, dateRange });

    const totalDownloads = downloads?.reduce((sum, d) => sum + d.count, 0) || 0;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-border/50">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <FileIcon className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-base font-semibold">File Downloads</CardTitle>
                </div>
                {!isLoading && totalDownloads > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                        <Download className="h-3 w-3" />
                        <span>{totalDownloads} total</span>
                    </div>
                )}
            </CardHeader>

            <CardContent className="p-0">
                {isLoading ? (
                    <div className="p-4 space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <Skeleton className="h-8 w-8 rounded-lg" />
                                <div className="flex-1 space-y-1.5">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                                <Skeleton className="h-6 w-12" />
                            </div>
                        ))}
                    </div>
                ) : downloads && downloads.length > 0 ? (
                    <div className="flex flex-col">
                        {downloads.map((file, idx) => {
                            const percentage = totalDownloads > 0 ? (file.count / totalDownloads) * 100 : 0;
                            return (
                                <div
                                    key={file.filename}
                                    className="relative group border-b border-border/50 last:border-0"
                                >
                                    <div className="flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors z-10 relative">
                                        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-muted text-xs font-bold text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors uppercase">
                                            {file.extension.slice(0, 3)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium truncate" title={file.filename}>
                                                    {file.filename}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate opacity-70">
                                                {file.href}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="text-sm font-semibold tabular-nums">{file.count}</div>
                                        </div>
                                    </div>
                                    {/* Progress bar */}
                                    <div className="absolute bottom-0 left-0 h-[3px] bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity z-20" style={{ width: `${percentage}%` }}></div>
                                    <div className="absolute inset-y-0 left-0 bg-primary/5 transition-all duration-500" style={{ width: `${percentage}%` }} />
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12 text-sm text-muted-foreground/60">
                        <FileText className="h-8 w-8 mx-auto mb-3 opacity-20" />
                        <p>No file downloads tracked yet</p>
                        <p className="text-xs mt-1 text-muted-foreground/40">
                            Downloads will appear here
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
