import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiService } from '@/services/api';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Eye, 
  AlertTriangle, 
  Shield,
  Target,
  Activity,
  BarChart3,
  PieChart,
  ArrowLeft
} from 'lucide-react';

export const WatchlistStats = () => {
  const navigate = useNavigate();

  const { data: watchlistItems, isLoading: watchlistLoading } = useQuery({
    queryKey: ['watchlist'],
    queryFn: () => apiService.getWatchlist(),
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['alerts', { limit: 10000 }],
    queryFn: () => apiService.getAlerts({ limit: 10000 }),
  });

  if (watchlistLoading || alertsLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading watchlist statistics...</p>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalWatchlistItems = watchlistItems?.length || 0;
  const activeItems = watchlistItems?.filter(item => item.is_active).length || 0;
  const totalAlerts = alerts?.length || 0;
  const newAlerts = alerts?.filter(alert => alert.status === 'new').length || 0;

  // Group by severity
  const severityStats = watchlistItems?.reduce((acc, item) => {
    acc[item.severity] = (acc[item.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Group by field type
  const fieldTypeStats = watchlistItems?.reduce((acc, item) => {
    acc[item.field_type] = (acc[item.field_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Most triggered watchlist items
  const watchlistAlertCounts = alerts?.reduce((acc, alert) => {
    acc[alert.watchlist_id] = (acc[alert.watchlist_id] || 0) + 1;
    return acc;
  }, {} as Record<number, number>) || {};

  const topTriggeredItems = watchlistItems
    ?.map(item => ({
      ...item,
      alertCount: watchlistAlertCounts[item.id] || 0
    }))
    .sort((a, b) => b.alertCount - a.alertCount)
    .slice(0, 5) || [];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="border-b border-gray-800 pb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="bg-gray-800 border-gray-700 text-gray-300 hover:text-white hover:bg-gray-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-white">Watchlist Statistics</h1>
          <p className="text-gray-400 mt-2">
            Analytics and performance metrics for your watchlist monitoring
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Watchlist Items</p>
                  <p className="text-2xl font-bold text-white">{totalWatchlistItems}</p>
                </div>
                <Eye className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Active Items</p>
                  <p className="text-2xl font-bold text-white">{activeItems}</p>
                </div>
                <Activity className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Alerts Generated</p>
                  <p className="text-2xl font-bold text-white">{totalAlerts}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Severity Distribution */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Severity Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(severityStats).map(([severity, count]) => (
                  <div key={severity} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={getSeverityColor(severity)}>
                        {severity}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-800 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full" 
                          style={{ width: `${(count / totalWatchlistItems) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-white font-medium w-8">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Field Type Distribution */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Field Type Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(fieldTypeStats).map(([fieldType, count]) => (
                  <div key={fieldType} className="flex items-center justify-between">
                    <span className="text-gray-300 capitalize">{fieldType.replace('_', ' ')}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-800 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${(count / totalWatchlistItems) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-white font-medium w-8">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Triggered Watchlist Items */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Most Triggered Watchlist Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topTriggeredItems.map((item, index) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-red-600 rounded-full text-white font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-white font-medium">{item.keyword}</p>
                      <p className="text-gray-400 text-sm capitalize">{item.field_type} • {item.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={getSeverityColor(item.severity)}>
                      {item.severity}
                    </Badge>
                    <div className="text-right">
                      <p className="text-white font-bold">{item.alertCount}</p>
                      <p className="text-gray-400 text-sm">alerts</p>
                    </div>
                  </div>
                </div>
              ))}
              {topTriggeredItems.length === 0 && (
                <div className="text-center py-8">
                  <Shield className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No alerts generated yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-400">Detection Rate</p>
                <p className="text-3xl font-bold text-green-500">
                  {totalWatchlistItems > 0 ? Math.round((newAlerts / totalWatchlistItems) * 100) : 0}%
                </p>
                <p className="text-gray-400 text-sm mt-1">New alerts vs watchlist items</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-400">Coverage</p>
                <p className="text-3xl font-bold text-blue-500">
                  {totalWatchlistItems > 0 ? Math.round((activeItems / totalWatchlistItems) * 100) : 0}%
                </p>
                <p className="text-gray-400 text-sm mt-1">Active watchlist items</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-400">Response Rate</p>
                <p className="text-3xl font-bold text-yellow-500">
                  {totalAlerts > 0 ? Math.round(((totalAlerts - newAlerts) / totalAlerts) * 100) : 0}%
                </p>
                <p className="text-gray-400 text-sm mt-1">Resolved alerts</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};