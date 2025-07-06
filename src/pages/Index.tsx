import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { DashboardStats } from "@/components/DashboardStats";
import { DashboardCharts } from "@/components/DashboardCharts";
import { apiService } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CreditCard,
  Database,
  Shield,
  AlertTriangle,
  Search,
} from "lucide-react";

const Index = () => {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ["comprehensiveDashboard", selectedCountry],
    queryFn: () =>
      apiService.getComprehensiveDashboard(selectedCountry || undefined),
  });

  const { data: alertsResponse, isLoading: alertsLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => apiService.getAlerts({ per_page: 1000 }),
  });

  const { data: cardAlertsResponse, isLoading: cardAlertsLoading } = useQuery({
    queryKey: ['cardAlerts'],
    queryFn: () => apiService.getCardAlerts({ per_page: 1000 }),
  });

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

  const handleCountryFilter = (country: string | null) => {
    setSelectedCountry(country);
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

  // Extract alerts from responses
  const alerts = alertsResponse?.results || [];
  const cardAlerts = cardAlertsResponse?.results || [];

  const filteredStats = getFilteredStats();

  const newAlerts = [...alerts, ...cardAlerts].filter(alert => alert.status === 'new');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div className="border-b border-gray-800 pb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Security Dashboard
          </h1>
          <p className="text-gray-400 mt-2 text-lg">
            Comprehensive overview of system security and potential threats
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-800 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-100">
                Total Credentials
              </CardTitle>
              <Database className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {filteredStats.totalCredentials.toLocaleString()}
              </div>
              <p className="text-xs text-blue-200">
                Stored usernames and passwords
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-800 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-100">
                Total Credit Cards
              </CardTitle>
              <CreditCard className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {filteredStats.totalCards.toLocaleString()}
              </div>
              <p className="text-xs text-green-200">
                Compromised credit card details
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 border-yellow-800 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-yellow-100">
                Total Systems
              </CardTitle>
              <Shield className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {filteredStats.totalSystems.toLocaleString()}
              </div>
              <p className="text-xs text-yellow-200">
                Infected machines and devices
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-900/50 to-red-800/30 border-red-800 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-100">
                Critical Alerts
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {alerts.length + cardAlerts.length}
              </div>
              <p className="text-xs text-red-200">
                Requires attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <DashboardCharts
          countryData={dashboardData?.country_distribution || []}
          filteredStealerStats={dashboardData?.stealer_distribution || []}
          filteredDomainStats={dashboardData?.top_domains || []}
          filteredTimelineStats={dashboardData?.timeline || []}
          selectedCountry={selectedCountry}
          onCountryFilter={handleCountryFilter}
          isLoading={dashboardLoading}
        />

        {/* Quick Actions & Recent Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 shadow-lg">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                asChild
                className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Link to="/credentials/search" className="flex items-center w-full">
                  <Search className="h-4 w-4 mr-2" />
                  Search Credentials
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </Link>
              </Button>
              <Button
                asChild
                className="w-full justify-start bg-green-600 hover:bg-green-700 text-white"
              >
                <Link to="/cards/search" className="flex items-center w-full">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Search Credit Cards
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </Link>
              </Button>
              <Button
                asChild
                className="w-full justify-start bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                <Link to="/alerts" className="flex items-center w-full">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  View All Alerts
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 shadow-lg">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                Recent Security Alerts
                <Badge variant="destructive" className="ml-auto">
                  {newAlerts.length} New
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alertsLoading || cardAlertsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
                  <p className="text-gray-400 mt-2">Loading alerts...</p>
                </div>
              ) : newAlerts.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">No new alerts</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {alerts.slice(0, 5).map((alert) => (
                    <div key={`alert-${alert.id}`} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                      <div>
                        <div className="text-sm font-medium text-white">{alert.matched_field} Match</div>
                        <div className="text-xs text-gray-400">
                          {new Date(alert.created_at).toLocaleTimeString()} - {alert.severity}
                        </div>
                      </div>
                      <Link to={`/alert/${alert.id}`}>
                        <ArrowRight className="h-4 w-4 text-gray-400 hover:text-white" />
                      </Link>
                    </div>
                  ))}
                  {cardAlerts.slice(0, 5).map((alert) => (
                    <div key={`card-alert-${alert.id}`} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                      <div>
                        <div className="text-sm font-medium text-white">BIN Match - {alert.bank_name}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(alert.created_at).toLocaleTimeString()} - {alert.severity}
                        </div>
                      </div>
                      <Link to={`/card/${alert.card_id}`}>
                        <ArrowRight className="h-4 w-4 text-gray-400 hover:text-white" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
