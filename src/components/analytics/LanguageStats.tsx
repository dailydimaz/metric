import { Languages } from "lucide-react";
import { LanguageStat } from "@/hooks/useAnalytics";
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

interface LanguageStatsProps {
  languages: LanguageStat[] | undefined;
  isLoading: boolean;
}

// Language code to name mapping (Full language mapping below)
const languageNames: Record<string, string> = {
  en: "English", es: "Spanish", fr: "French", de: "German", it: "Italian", pt: "Portuguese",
  ru: "Russian", zh: "Chinese", ja: "Japanese", ko: "Korean", ar: "Arabic", hi: "Hindi",
  nl: "Dutch", pl: "Polish", tr: "Turkish", vi: "Vietnamese", th: "Thai", id: "Indonesian",
  sv: "Swedish", no: "Norwegian", da: "Danish", fi: "Finnish", cs: "Czech", el: "Greek",
  he: "Hebrew", hu: "Hungarian", ro: "Romanian", uk: "Ukrainian", bg: "Bulgarian", sk: "Slovak",
  hr: "Croatian", ca: "Catalan", ms: "Malay", bn: "Bengali", ta: "Tamil", te: "Telugu",
  mr: "Marathi", gu: "Gujarati", kn: "Kannada", ml: "Malayalam", pa: "Punjabi", ur: "Urdu",
  fa: "Persian", sw: "Swahili", tl: "Filipino",
};

function getLanguageName(code: string): string {
  return languageNames[code.toLowerCase()] || code.toUpperCase();
}

export function LanguageStats({ languages, isLoading }: LanguageStatsProps) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Languages className="h-4 w-4" />
          </div>
          <CardTitle className="text-base font-semibold">Languages</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-hidden">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
            </div>
          ) : languages && languages.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-full pl-4">Language</TableHead>
                    <TableHead className="text-right">Visits</TableHead>
                    <TableHead className="text-right pr-4">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {languages.slice(0, 8).map((lang, index) => (
                    <TableRow key={index} className="hover:bg-muted/50 border-b border-border last:border-0">
                      <TableCell className="w-full flex items-center gap-3 py-3 pl-4">
                        <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded uppercase text-muted-foreground group-hover:bg-muted/80 transition-colors">
                          {lang.language}
                        </span>
                        <div className="relative flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[80px]">
                          <div
                            className="absolute inset-y-0 left-0 bg-primary rounded-full"
                            style={{ width: `${lang.percentage}%` }}
                          />
                        </div>
                        <span className="font-medium text-sm">{getLanguageName(lang.language)}</span>
                      </TableCell>
                      <TableCell className="text-right font-medium py-3">{lang.visits}</TableCell>
                      <TableCell className="text-right font-mono text-xs text-muted-foreground w-16 py-3 pr-4">{lang.percentage.toFixed(0)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {languages.length > 8 && (
                <div className="p-2 text-center text-xs text-muted-foreground border-t border-border bg-muted/20">
                  Showing top 8 of {languages.length} languages
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/40">
              <Languages className="h-10 w-10 mb-2 opacity-20" />
              <p className="text-sm">No language data yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

