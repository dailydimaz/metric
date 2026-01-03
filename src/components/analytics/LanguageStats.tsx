import { Languages } from "lucide-react";
import { LanguageStat } from "@/hooks/useAnalytics";

interface LanguageStatsProps {
  languages: LanguageStat[] | undefined;
  isLoading: boolean;
}

// Language code to name mapping (truncated for brevity in update, but would keep full list)
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
    <div className="card bg-base-100 shadow-sm border border-base-200 h-full">
      <div className="card-body p-0">
        <div className="flex items-center gap-2 p-4 border-b border-base-200">
          <div className="p-2 bg-success/10 rounded-lg text-success">
            <Languages className="h-4 w-4" />
          </div>
          <h3 className="font-semibold text-base">Languages</h3>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="skeleton h-4 w-24"></div>
                </div>
                <div className="skeleton h-4 w-12"></div>
              </div>
            ))}
          </div>
        ) : languages && languages.length > 0 ? (
          <div className="overflow-x-auto p-0">
            <table className="table">
              <tbody>
                {languages.slice(0, 8).map((lang, index) => (
                  <tr key={index} className="hover:bg-base-50 group border-b border-base-100 last:border-0">
                    <td className="w-full flex items-center gap-3">
                      <span className="font-mono text-xs bg-base-200 px-1.5 py-0.5 rounded uppercase text-base-content/60 group-hover:bg-base-300 transition-colors">
                        {lang.language}
                      </span>
                      <span className="font-medium text-sm">{getLanguageName(lang.language)}</span>
                      <div className="relative flex-1 h-1.5 bg-base-200 rounded-full overflow-hidden max-w-[80px] ml-auto mr-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div
                          className="absolute inset-y-0 left-0 bg-success rounded-full"
                          style={{ width: `${lang.percentage}%` }}
                        />
                      </div>
                    </td>
                    <td className="text-right font-medium">{lang.visits}</td>
                    <td className="text-right font-mono text-xs text-base-content/60 w-16">{lang.percentage.toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-base-content/40">
            <Languages className="h-10 w-10 mb-2 opacity-20" />
            <p className="text-sm">No language data yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

