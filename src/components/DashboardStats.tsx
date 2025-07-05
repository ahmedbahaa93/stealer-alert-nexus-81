
import { StatCard } from "@/components/StatCard";
import { AlertCircle, Database, CreditCard, Server } from "lucide-react";

interface DashboardStatsProps {
  filteredStats: {
    totalCredentials: number;
    totalCards: number;
    totalSystems: number;
    credentialAlerts: number;
    cardAlerts: number;
  };
  selectedCountry: string | null;
  onClearCountryFilter: () => void;
}

export const DashboardStats = ({ 
  filteredStats, 
  selectedCountry, 
  onClearCountryFilter 
}: DashboardStatsProps) => {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Security Dashboard</h1>
        <p className="text-gray-400">
          Overview of compromised credentials and system threats
          {selectedCountry && (
            <span className="ml-2 px-3 py-1 bg-blue-600 text-white text-sm rounded-full">
              📍 Filtered by: {selectedCountry}
            </span>
          )}
        </p>
        {selectedCountry && (
          <button
            onClick={onClearCountryFilter}
            className="mt-3 px-4 py-2 bg-gray-700 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
          >
            <span>✕</span>
            Clear Country Filter
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Credentials"
          value={filteredStats.totalCredentials.toLocaleString()}
          icon={Database}
          trend={{ value: 12, isPositive: true }}
          className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-800"
        />
        <StatCard
          title="Payment Cards"
          value={filteredStats.totalCards.toLocaleString()}
          icon={CreditCard}
          trend={{ value: 8, isPositive: true }}
          className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-800"
        />
        <StatCard
          title="Compromised Systems"
          value={filteredStats.totalSystems.toLocaleString()}
          icon={Server}
          trend={{ value: 5, isPositive: false }}
          className="bg-gradient-to-br from-orange-900/50 to-orange-800/30 border-orange-800"
        />
        <StatCard
          title="Active Alerts"
          value={`${(filteredStats.credentialAlerts + filteredStats.cardAlerts).toLocaleString()}`}
          subtitle={`🔐 ${filteredStats.credentialAlerts} Credential • 💳 ${filteredStats.cardAlerts} Card`}
          icon={AlertCircle}
          trend={{ value: 15, isPositive: false }}
          className="bg-gradient-to-br from-red-900/50 to-red-800/30 border-red-800"
        />
      </div>
    </>
  );
};
