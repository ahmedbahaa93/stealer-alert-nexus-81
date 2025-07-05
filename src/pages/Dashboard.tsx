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

  // Base queries
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: () => apiService.getStats(),
  });

  // Country-filtered credentials query
  const { data: filteredCredentials, isLoading: filteredCredentialsLoading } = useQuery({
    queryKey: ['credentials', { country: selectedCountry, limit: 50000 }],
    queryFn: () => apiService.getCredentials({ 
      country: selectedCountry || undefined,
      limit: 50000 
    }),
    enabled: !!selectedCountry,
  });

  // Country-filtered cards query
  const { data: filteredCards, isLoading: filteredCardsLoading } = useQuery({
    queryKey: ['cards', { country: selectedCountry, limit: 50000 }],
    queryFn: () => apiService.getCards({
      country: selectedCountry || undefined,
      limit: 50000
    }),
    enabled: !!selectedCountry,
  });

  // Enhanced alert queries with country filtering
  const { data: allAlerts, isLoading: allAlertsLoading } = useQuery({
    queryKey: ['alerts', { limit: 10000, country: selectedCountry }],
    queryFn: async () => {
      const alerts = await apiService.getAlerts({ limit: 10000 });
      
      if (!selectedCountry) return alerts;
      
      // Filter alerts based on country by checking related credential/card data
      const countryFilteredAlerts = [];
      for (const alert of alerts) {
        try {
          if (alert.record_type === 'credential') {
            const credential = await apiService.getCredentialDetail(alert.record_id);
            if (credential.credential.system_info?.country === selectedCountry) {
              countryFilteredAlerts.push(alert);
            }
          }
        } catch (error) {
          // If we can't fetch details, skip this alert
          continue;
        }
      }
      return countryFilteredAlerts;
    },
  });

  const { data: allCardAlerts, isLoading: allCardAlertsLoading } = useQuery({
    queryKey: ['cardAlerts', { limit: 10000, country: selectedCountry }],
    queryFn: async () => {
      const cardAlerts = await apiService.getCardAlerts({ limit: 10000 });
      
      if (!selectedCountry) return cardAlerts;
      
      // Filter card alerts based on country
      const countryFilteredCardAlerts = [];
      for (const alert of cardAlerts) {
        try {
          const cardDetail = await apiService.getCardDetail(alert.card_id);
          if (cardDetail.card.country === selectedCountry) {
            countryFilteredCardAlerts.push(alert);
          }
        } catch (error) {
          // If we can't fetch details, skip this alert
          continue;
        }
      }
      return countryFilteredCardAlerts;
    },
  });

  // Paginated alerts for display
  const { data: alerts, isLoading: alertsLoading, refetch: refetchAlerts } = useQuery({
    queryKey: ['alerts', { limit: alertsPerPage }],
    queryFn: () => apiService.getAlerts({ limit: alertsPerPage }),
  });

  const { data: countryData, isLoading: countryLoading } = useQuery({
    queryKey: ['countries'],
    queryFn: () => apiService.getCountryStats(),
  });

  const { data: stealerData, isLoading: stealerLoading } = useQuery({
    queryKey: ['stealers'],
    queryFn: () => apiService.getStealerStats(),
  });

  const { data: domainData, isLoading: domainLoading } = useQuery({
    queryKey: ['domains'],
    queryFn: () => apiService.getTopDomains(),
  });

  const { data: timelineData, isLoading: timelineLoading } = useQuery({
    queryKey: ['timeline'],
    queryFn: () => apiService.getTimelineStats(),
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

  // Fixed filtered stats calculation with proper country filtering
  const getFilteredStats = () => {
    if (!selectedCountry) {
      // Global data - use base stats with live alert counts
      const credentialAlerts = allAlerts?.filter(alert => alert.status === 'new').length || 0;
      const cardAlerts = allCardAlerts?.filter(alert => alert.status === 'new').length || 0;
      
      return {
        totalCredentials: stats?.total_credentials || 0,
        totalCards: stats?.total_cards || 0,
        totalSystems: stats?.total_systems || 0,
        credentialAlerts,
        cardAlerts,
      };
    }

    // Country-filtered data - use actual filtered results
    const credentialAlerts = allAlerts?.filter(alert => alert.status === 'new').length || 0;
    const cardAlerts = allCardAlerts?.filter(alert => alert.status === 'new').length || 0;

    // Calculate unique systems from filtered credentials
    const uniqueSystemIds = new Set(
      filteredCredentials
        ?.map(c => c.system_info_id)
        .filter(Boolean) || []
    );

    return {
      totalCredentials: filteredCredentials?.length || 0,
      totalCards: filteredCards?.length || 0,
      totalSystems: uniqueSystemIds.size,
      credentialAlerts,
      cardAlerts,
    };
  };

  // Enhanced filtered stealer data
  const getFilteredStealerData = () => {
    if (!selectedCountry || !filteredCredentials) {
      return stealerData || [];
    }

    const stealerCounts = filteredCredentials.reduce((acc, cred) => {
      const stealer = cred.stealer_type || 'Unknown';
      acc[stealer] = (acc[stealer] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(stealerCounts)
      .map(([stealer_type, count]) => ({ stealer_type, count }))
      .sort((a, b) => b.count - a.count);
  };

  // Enhanced filtered domain data
  const getFilteredDomainData = () => {
    if (!selectedCountry || !filteredCredentials) {
      return domainData || [];
    }

    const domainCounts = filteredCredentials.reduce((acc, cred) => {
      if (!cred.url && !cred.domain) return acc;
      try {
        const domain = cred.domain || (cred.url ? new URL(cred.url).hostname : null);
        if (domain) {
          acc[domain] = (acc[domain] || 0) + 1;
        }
      } catch (error) {
        // Skip invalid URLs
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(domainCounts)
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  };

  // Enhanced filtered timeline data
  const getFilteredTimelineData = () => {
    if (!selectedCountry || !filteredCredentials) {
      return timelineData || [];
    }

    const timelineCounts = filteredCredentials.reduce((acc, cred) => {
      const date = new Date(cred.created_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(timelineCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30); // Last 30 days
  };

  if (statsLoading) {
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
  const filteredStealerStats = getFilteredStealerData();
  const filteredDomainStats = getFilteredDomainData();
  const filteredTimelineStats = getFilteredTimelineData();

  const chartsLoading = countryLoading || stealerLoading || domainLoading || timelineLoading || 
    (selectedCountry && (filteredCredentialsLoading || filteredCardsLoading));

  const alertsLoadingState = alertsLoading || allAlertsLoading || allCardAlertsLoading;

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto">
        <DashboardStats
          filteredStats={filteredStats}
          selectedCountry={selectedCountry}
          onClearCountryFilter={() => handleCountryFilter(null)}
        />

        <DashboardCharts
          countryData={countryData}
          filteredStealerStats={filteredStealerStats}
          filteredDomainStats={filteredDomainStats}
          filteredTimelineStats={filteredTimelineStats}
          selectedCountry={selectedCountry}
          onCountryFilter={handleCountryFilter}
          isLoading={chartsLoading}
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