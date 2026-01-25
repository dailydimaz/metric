import { FormInput, CheckCircle2, RotateCcw } from "lucide-react";
import { DateRange } from "@/hooks/useAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { useFormAnalytics } from "@/hooks/useFormAnalytics";

interface FormStatsProps {
    siteId: string;
    dateRange: DateRange;
}

export function FormStats({ siteId, dateRange }: FormStatsProps) {
    const { data: forms, isLoading } = useFormAnalytics({ siteId, dateRange });

    return (
        <Card className="col-span-full lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-border/50">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <FormInput className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-base font-semibold">Form Analytics</CardTitle>
                </div>
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
                            </div>
                        ))}
                    </div>
                ) : forms && forms.length > 0 ? (
                    <div className="flex flex-col">
                        {forms.map((form, idx) => (
                            <div
                                key={form.formId}
                                className="p-4 border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-muted text-xs font-medium text-muted-foreground">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <div className="font-medium text-sm">{form.formId}</div>
                                            <div className="text-xs text-muted-foreground">{form.submissions} submissions</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-primary">{form.conversionRate.toFixed(1)}%</div>
                                        <div className="text-xs text-muted-foreground">Conversion Rate</div>
                                    </div>
                                </div>

                                {/* Funnel Visual */}
                                <div className="relative pt-2">
                                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                        <span className="flex items-center gap-1"><RotateCcw className="h-3 w-3" /> Started: {form.views}</span>
                                        <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Submitted: {form.submissions}</span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden flex">
                                        <div className="h-full bg-primary/20" style={{ width: '100%' }}></div> {/* Base is 100% of starts? No visual tricky */}
                                        {/* Actually let's just show progress bar of conversion */}
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden mt-1 w-full">
                                        <div
                                            className="h-full bg-primary transition-all duration-500"
                                            style={{ width: `${form.conversionRate}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-sm text-muted-foreground/60">
                        <FormInput className="h-8 w-8 mx-auto mb-3 opacity-20" />
                        <p>No form interactions tracked yet</p>
                        <p className="text-xs mt-1 text-muted-foreground/40">
                            Form submissions and completions will appear here
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
