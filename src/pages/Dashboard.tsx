import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { DashboardStats } from "@/components/DashboardStats";
import { DashboardCharts } from "@/components/DashboardCharts";
import { DashboardAlerts } from "@/components/DashboardAlerts";
import { apiService } from "@/services/api";
import { toast } from "@/hooks/use-toast";

export const Dashboard = () => {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [alertsPerPage, setAlertsPerPage] = useState(10);

  // Use the new comprehensive dashboard API
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['comprehensiveDashboard', selectedCountry],
    queryFn: () => apiService.getComprehensiveDashboard(selectedCountry || undefined),
  });

  // Separate alerts queries (these remain the same for now)
  const { data: alerts, isLoading: alertsLoading, refetch: refetchAlerts } = useQuery({
    queryKey: ['alerts', { limit: alertsPerPage }],
    queryFn: () => apiService.getAlerts({ limit: alertsPerPage }),
  });

  const { data: allCardAlerts, isLoading: allCardAlertsLoading } = useQuery({
    queryKey: ['cardAlerts', { limit: 10000 }],
    queryFn: () => apiService.getCardAlerts({ limit: 10000 }),
  });

  // Alert action handlers
  const handleResolveAlert = async (alertId: number) => {
    try {
      await apiService.resolveAlert(alertId);
      toast({
        title: "Alert Resolved",
        description: "The alert has been successfully resolved.",
      });
      refetchAlerts();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resolve alert. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleMarkFalsePositive = async (alertId: number) => {
    try {
      await apiService.markAlertFalsePositive(alertId);
      toast({
        title: "Marked as False Positive",
        description: "The alert has been marked as a false positive.",
      });
      refetchAlerts();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark as false positive. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleResolveCardAlert = async (alertId: number) => {
    try {
      await apiService.resolveCardAlert(alertId);
      toast({
        title: "Card Alert Resolved",
        description: "The card alert has been successfully resolved.",
      });
      refetchAlerts();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resolve card alert. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleMarkCardAlertFalsePositive = async (alertId: number) => {
    try {
      await apiService.markCardAlertFalsePositive(alertId);
      toast({
        title: "Marked as False Positive",
        description: "The card alert has been marked as a false positive.",
      });
      refetchAlerts();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark card alert as false positive. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCountryFilter = (country: string | null) => {
    setSelectedCountry(country);
  };

  const handleAlertsPerPageChange = (newLimit: number) => {
    setAlertsPerPage(newLimit);
  };

  // Extract data from comprehensive response
  const getFilteredStats = () => {
    if (!dashboardData) {
      return {
        totalCredentials: 0,
        totalCards: 0,
        totalSystems: 0,
        credentialAlerts: 0,
        cardAlerts: 0,
      };
    }

    return {
      totalCredentials: dashboardData.overview.total_credentials,
      totalCards: dashboardData.overview.total_cards,
      totalSystems: dashboardData.overview.total_systems,
      credentialAlerts: dashboardData.overview.alert_breakdown.credential_alerts,
      cardAlerts: dashboardData.overview.alert_breakdown.card_alerts,
    };
  };

  if (dashboardLoading) {
    return (
      <div className="min-h-screen bg-gray-950 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-800 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-800 rounded"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-96 bg-gray-800 rounded"></div>
              <div className="h-96 bg-gray-800 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredStats = getFilteredStats();
  const alertsLoadingState = alertsLoading || allCardAlertsLoading;

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto">
        <DashboardStats
          filteredStats={filteredStats}
          selectedCountry={selectedCountry}
          onClearCountryFilter={() => handleCountryFilter(null)}
        />

        <DashboardCharts
          countryData={dashboardData?.country_distribution || []}
          filteredStealerStats={dashboardData?.stealer_distribution || []}
          filteredDomainStats={dashboardData?.top_domains || []}
          filteredTimelineStats={dashboardData?.timeline || []}
          selectedCountry={selectedCountry}
          onCountryFilter={handleCountryFilter}
          isLoading={dashboardLoading}
        />

        <DashboardAlerts
          alerts={alerts}
          cardAlerts={allCardAlerts?.slice(0, alertsPerPage)}
          filteredStats={filteredStats}
          alertsPerPage={alertsPerPage}
          onResolveAlert={handleResolveAlert}
          onMarkFalsePositive={handleMarkFalsePositive}
          onResolveCardAlert={handleResolveCardAlert}
          onMarkCardAlertFalsePositive={handleMarkCardAlertFalsePositive}
          onAlertsPerPageChange={handleAlertsPerPageChange}
          isLoading={alertsLoadingState}
        />
      </div>
    </div>
  );
};
