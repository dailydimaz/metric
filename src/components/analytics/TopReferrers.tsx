import { Link2, ArrowRight, Layers } from "lucide-react";
import { motion } from "framer-motion";
import { TopReferrer } from "@/hooks/useAnalytics";
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

interface TopReferrersProps {
  referrers: TopReferrer[] | undefined;
  isLoading: boolean;
  onBreakdown?: (referrer: string) => void;
}

const rowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
      ease: "easeOut" as const,
    },
  }),
};

export function TopReferrers({ referrers, isLoading, onBreakdown }: TopReferrersProps) {
  const maxVisits = referrers && referrers.length > 0 ? Math.max(...referrers.map(r => r.visits)) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <Card className="h-full hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-border/50">
          <div className="flex items-center gap-2">
            <motion.div 
              className="p-2 bg-secondary/10 rounded-lg text-secondary"
              whileHover={{ scale: 1.1, rotate: -5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Link2 className="h-4 w-4" />
            </motion.div>
            <CardTitle className="text-base font-semibold">Top Referrers</CardTitle>
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
                  <motion.div 
                    key={i} 
                    className="flex items-center gap-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-12 ml-auto" />
                  </motion.div>
                ))}
              </div>
            ) : referrers && referrers.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="w-full pl-4">Source</TableHead>
                      <TableHead className="text-right">Visits</TableHead>
                      <TableHead className="text-right pr-4">%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {referrers.map((ref, index) => {
                      const percentage = maxVisits > 0 ? (ref.visits / maxVisits) * 100 : 0;
                      return (
                        <motion.tr
                          key={index}
                          custom={index}
                          variants={rowVariants}
                          initial="hidden"
                          animate="visible"
                          whileHover={{ 
                            backgroundColor: "hsl(var(--muted) / 0.5)",
                            transition: { duration: 0.15 }
                          }}
                          className="group cursor-pointer border-b border-border last:border-0"
                          onClick={() => onBreakdown?.(ref.referrer)}
                        >
                          <TableCell className="pl-4 relative">
                            <motion.div
                              className="absolute inset-y-0 left-0 bg-secondary/10"
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 0.6, delay: index * 0.05 + 0.2 }}
                            />
                            <div className="flex items-center gap-2 relative z-10">
                              <span className="text-xs text-muted-foreground font-mono w-4">{index + 1}</span>
                              <span className="truncate max-w-[150px] md:max-w-xs font-medium text-sm text-foreground/90 group-hover:text-secondary transition-colors" title={ref.referrer}>
                                {ref.referrer}
                              </span>
                              {ref.referrer !== 'Direct' && (
                                <motion.a
                                  href={`${ref.referrer.startsWith('http') ? '' : 'https://'}${ref.referrer}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-secondary"
                                  onClick={(e) => e.stopPropagation()}
                                  whileHover={{ x: 3 }}
                                >
                                  <ArrowRight className="h-3 w-3" />
                                </motion.a>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-bold text-sm">{ref.visits}</TableCell>
                          <TableCell className="text-right pr-4 font-mono text-xs text-muted-foreground">{ref.percentage.toFixed(1)}%</TableCell>
                        </motion.tr>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <motion.div 
                className="flex flex-col items-center justify-center py-12 text-muted-foreground/40"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Link2 className="h-10 w-10 mb-2 opacity-20" />
                <p className="text-sm">No referrer data yet</p>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
