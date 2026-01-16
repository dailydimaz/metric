import { useState } from "react";
import { Download, FileJson, FileSpreadsheet } from "lucide-react";
import { DateRange } from "@/hooks/useAnalytics";
import { fetchExportData, exportToCSV, exportToJSON } from "@/utils/analyticsExport";
import { useToast } from "@/hooks/use-toast";
import { isBillingEnabled } from "@/lib/billing";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ExportButtonProps {
  siteId: string;
  siteName: string;
  dateRange: DateRange;
}

export function ExportButton({ siteId, siteName, dateRange }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { toast } = useToast();

  // Only show export for cloud users (billing enabled)
  if (!isBillingEnabled()) {
    return null;
  }

  const handleExport = async (format: "csv" | "json") => {
    setIsExporting(true);
    setDropdownOpen(false);

    try {
      const data = await fetchExportData(siteId, dateRange);

      if (data.length === 0) {
        toast({
          title: "No data to export",
          description: "There are no events in the selected date range.",
          variant: "destructive",
        });
        return;
      }

      const filename = `${siteName.replace(/[^a-z0-9]/gi, "_")}_analytics_${dateRange}`;

      if (format === "csv") {
        exportToCSV(data, filename);
      } else {
        exportToJSON(data, filename);
      }

      toast({
        title: "Export complete",
        description: `Exported ${data.length} events to ${format.toUpperCase()}.`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: "Failed to export analytics data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (

    <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={isExporting}
        >
          {isExporting ? (
            <span className="loading loading-spinner loading-sm mr-2"></span>
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("csv")}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("json")}>
          <FileJson className="h-4 w-4 mr-2" />
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
