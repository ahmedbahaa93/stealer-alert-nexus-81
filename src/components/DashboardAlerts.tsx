
import { EnhancedAlertsPanel } from "@/components/EnhancedAlertsPanel";
import { AlertCircle, Database, CreditCard } from "lucide-react";

interface DashboardAlertsProps {
  alerts: any[];
  cardAlerts: any[];
  filteredStats: {
    credentialAlerts: number;
    cardAlerts: number;
  };
  alertsPerPage: number;
  onResolveAlert: (alertId: number) => Promise<void>;
  onMarkFalsePositive: (alertId: number) => Promise<void>;
  onResolveCardAlert: (alertId: number) => Promise<void>;
  onMarkCardAlertFalsePositive: (alertId: number) => Promise<void>;
  onAlertsPerPageChange: (newLimit: number) => void;
  isLoading: boolean;
}

export const DashboardAlerts = ({
  alerts,
  cardAlerts,
  filteredStats,
  alertsPerPage,
  onResolveAlert,
  onMarkFalsePositive,
  onResolveCardAlert,
  onMarkCardAlertFalsePositive,
  onAlertsPerPageChange,
  isLoading
}: DashboardAlertsProps) => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <AlertCircle className="h-6 w-6 text-red-400" />
        Recent Security Alerts
        <div className="flex items-center gap-4 ml-auto text-sm">
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-900/30 rounded-full">
            <Database className="h-4 w-4 text-blue-400" />
            <span className="text-blue-400">{filteredStats.credentialAlerts} Credential</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-green-900/30 rounded-full">
            <CreditCard className="h-4 w-4 text-green-400" />
            <span className="text-green-400">{filteredStats.cardAlerts} Card</span>
          </div>
        </div>
      </h2>
      {isLoading ? (
        <div className="h-96 bg-gray-800 rounded animate-pulse"></div>
      ) : (
        <EnhancedAlertsPanel
          alerts={alerts || []}
          cardAlerts={cardAlerts || []}
          onResolveAlert={onResolveAlert}
          onMarkFalsePositive={onMarkFalsePositive}
          onResolveCardAlert={onResolveCardAlert}
          onMarkCardAlertFalsePositive={onMarkCardAlertFalsePositive}
          alertsPerPage={alertsPerPage}
          onAlertsPerPageChange={onAlertsPerPageChange}
        />
      )}
    </div>
  );
};
