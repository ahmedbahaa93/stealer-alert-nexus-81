import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield } from 'lucide-react';
import { apiService } from '@/services/api';

export const WatchlistStats = () => {
  const [watchlistData, setWatchlistData] = useState([]);

  const { data: alertsResponse, isLoading: alertsLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => apiService.getAlerts({ per_page: 1000 }),
  });

  const { data: watchlist, isLoading: watchlistLoading } = useQuery({
    queryKey: ['watchlist'],
    queryFn: () => apiService.getWatchlist(),
    onSuccess: (data) => {
      setWatchlistData(data);
    },
  });

  // Extract alerts from response
  const alerts = alertsResponse?.results || [];

  const getWatchlistStats = () => {
    const alertCounts = alerts.filter(alert => alert.status === 'new').length;
    const resolvedCounts = alerts.filter(alert => alert.status === 'reviewed').length;

    return watchlistData?.map(item => {
      const itemAlerts = alerts.reduce((count, alert) => {
        return alert.watchlist_id === item.id ? count + 1 : count;
      }, 0);

      return {
        ...item,
        alert_count: itemAlerts,
      };
    }) || [];
  };

  useEffect(() => {
    if (watchlist) {
      setWatchlistData(watchlist);
    }
  }, [watchlist]);

  const stats = getWatchlistStats();

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="border-b border-gray-800 pb-6">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-400" />
            Watchlist Statistics
          </h1>
          <p className="text-gray-400">Analyze watchlist performance and alert distribution</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-100">
                Total Watchlist Items
              </CardTitle>
              <Shield className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {watchlistData?.length || 0}
              </div>
              <p className="text-xs text-blue-200">
                Keywords being monitored
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-900/50 to-red-800/30 border-red-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-100">
                Total Alerts Triggered
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {alerts.length}
              </div>
              <p className="text-xs text-red-200">
                Alerts from watchlist matches
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-900/50 to-orange-800/30 border-orange-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-100">
                New Alerts
              </CardTitle>
              <Clock className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {alerts.filter(alert => alert.status === 'new').length}
              </div>
              <p className="text-xs text-orange-200">
                Require attention
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-100">
                Resolved Alerts
              </CardTitle>
              <Shield className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {alerts.filter(alert => alert.status === 'reviewed').length}
              </div>
              <p className="text-xs text-green-200">
                Successfully handled
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Watchlist Items */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-400" />
                Watchlist Item Statistics
              </div>
              <Badge variant="outline" className="text-gray-300 border-gray-600">
                {watchlistData?.length || 0} items
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {watchlistLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-400 mt-2">Loading watchlist items...</p>
              </div>
            ) : watchlistData?.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No watchlist items found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-300">Keyword</TableHead>
                      <TableHead className="text-gray-300">Field Type</TableHead>
                      <TableHead className="text-gray-300">Severity</TableHead>
                      <TableHead className="text-gray-300">Alerts Triggered</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats?.map((item) => (
                      <TableRow key={item.id} className="border-gray-700 hover:bg-gray-800/50">
                        <TableCell className="text-white">{item.keyword}</TableCell>
                        <TableCell className="text-gray-300">{item.field_type}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{item.severity}</Badge>
                        </TableCell>
                        <TableCell className="text-gray-300">{item.alert_count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
