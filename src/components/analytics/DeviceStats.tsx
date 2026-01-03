import { Monitor, Smartphone, Tablet, Globe, Chrome, LayoutGrid } from "lucide-react";
import { DeviceStat } from "@/hooks/useAnalytics";

interface DeviceStatsProps {
  browsers: DeviceStat[] | undefined;
  operatingSystems: DeviceStat[] | undefined;
  devices: DeviceStat[] | undefined;
  isLoading: boolean;
}

function StatList({
  title,
  items,
  icon,
  isLoading
}: {
  title: string;
  items: DeviceStat[] | undefined;
  icon: React.ReactNode;
  isLoading: boolean;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-base-200 rounded-md text-base-content/70">
          {icon}
        </div>
        <h4 className="text-sm font-semibold">{title}</h4>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="skeleton h-3 w-20"></div>
              <div className="skeleton h-3 w-10"></div>
            </div>
          ))}
        </div>
      ) : items && items.length > 0 ? (
        <div className="space-y-3">
          {items.slice(0, 5).map((item, index) => (
            <div key={index} className="group">
              <div className="flex justify-between items-center text-sm mb-1">
                <span className="font-medium text-base-content/80 group-hover:text-primary transition-colors">{item.name}</span>
                <span className="text-xs text-base-content/60 font-mono">{item.percentage.toFixed(1)}%</span>
              </div>
              <progress
                className="progress progress-primary w-full h-1.5 opacity-40 group-hover:opacity-100 transition-opacity"
                value={item.percentage}
                max="100"
              ></progress>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-base-content/50 italic">No data available</p>
      )}
    </div>
  );
}

export function DeviceStats({ browsers, operatingSystems, devices, isLoading }: DeviceStatsProps) {
  return (
    <div className="card bg-base-100 shadow-sm border border-base-200">
      <div className="card-body p-0">
        <div className="flex items-center gap-2 p-4 border-b border-base-200">
          <div className="p-2 bg-accent/10 rounded-lg text-accent">
            <LayoutGrid className="h-4 w-4" />
          </div>
          <h3 className="font-semibold text-base">Tech Specs</h3>
        </div>

        <div className="grid gap-8 md:grid-cols-3 p-6">
          <StatList
            title="Device Type"
            items={devices}
            icon={<Monitor className="h-4 w-4" />}
            isLoading={isLoading}
          />
          <StatList
            title="Browser"
            items={browsers}
            icon={<Chrome className="h-4 w-4" />}
            isLoading={isLoading}
          />
          <StatList
            title="Operating System"
            items={operatingSystems}
            icon={<Globe className="h-4 w-4" />}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}

