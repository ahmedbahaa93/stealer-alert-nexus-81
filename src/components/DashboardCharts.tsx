
import { EnhancedCharts } from "@/components/EnhancedCharts";
import { Shield } from "lucide-react";

interface DashboardChartsProps {
  countryData: any[];
  filteredStealerStats: any[];
  filteredDomainStats: any[];
  filteredTimelineStats: any[];
  selectedCountry: string | null;
  onCountryFilter: (country: string | null) => void;
  isLoading: boolean;
}

export const DashboardCharts = ({
  countryData,
  filteredStealerStats,
  filteredDomainStats,
  filteredTimelineStats,
  selectedCountry,
  onCountryFilter,
  isLoading
}: DashboardChartsProps) => {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <Shield className="h-6 w-6 text-blue-400" />
        Threat Intelligence
        {selectedCountry && (
          <span className="text-sm text-blue-400 font-normal">
            - {selectedCountry} Specific Data
          </span>
        )}
      </h2>
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-96 bg-gray-800 rounded animate-pulse"></div>
          ))}
        </div>
      ) : (
        <EnhancedCharts
          countryData={countryData || []}
          stealerData={filteredStealerStats}
          domainData={filteredDomainStats}
          timelineData={filteredTimelineStats}
          onCountryFilter={onCountryFilter}
          selectedCountry={selectedCountry}
        />
      )}
    </div>
  );
};
