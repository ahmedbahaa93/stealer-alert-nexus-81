
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { apiService } from "@/services/api";
import { useNavigate } from "react-router-dom";
import { Shield, CreditCard, AlertTriangle, Users, Search, Filter, Database, X } from "lucide-react";

export default function Index() {
  const navigate = useNavigate();
  const [alertLimit, setAlertLimit] = useState(20);
  const [countryFilter, setCountryFilter] = useState<string | null>(null);
  const [stealerFilter, setStealerFilter] = useState<string | null>(null);
  const [domainFilter, setDomainFilter] = useState<string>("");

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: () => apiService.getStats(),
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['alerts', { limit: alertLimit }],
    queryFn: () => apiService.getAlerts({ limit: alertLimit }),
  });

  const { data: cardAlerts, isLoading: cardAlertsLoading } = useQuery({
    queryKey: ['cardAlerts', { limit: alertLimit }],
    queryFn: () => apiService.getCardAlerts({ limit: alertLimit }),
  });

  const { data: countryStats, isLoading: countryLoading } = useQuery({
    queryKey: ['countryStats', countryFilter],
    queryFn: () => apiService.getCountryStats(),
  });

  const { data: stealerStats, isLoading: stealerLoading } = useQuery({
    queryKey: ['stealerStats', stealerFilter],
    queryFn: () => apiService.getStealerStats(),
  });

  const { data: topDomains, isLoading: domainsLoading } = useQuery({
    queryKey: ['topDomains', domainFilter],
    queryFn: () => apiService.getTopDomains(),
  });

  const { data: timelineStats, isLoading: timelineLoading } = useQuery({
    queryKey: ['timelineStats'],
    queryFn: () => apiService.getTimelineStats(),
  });

  // Filter data based on active filters
  const filteredCountryStats = countryStats?.filter(item => 
    !countryFilter || item.country === countryFilter
  ) || [];

  const filteredStealerStats = stealerStats?.filter(item => 
    !stealerFilter || item.stealer_type === stealerFilter
  ) || [];

  const filteredDomains = topDomains?.filter(item => 
    !domainFilter || item.domain.toLowerCase().includes(domainFilter.toLowerCase())
  ) || [];

  const handleCountryChartClick = (data: any) => {
    setCountryFilter(countryFilter === data.country ? null : data.country);
  };

  const handleStealerChartClick = (data: any) => {
    setStealerFilter(stealerFilter === data.stealer_type ? null : data.stealer_type);
  };

  const clearFilters = () => {
    setCountryFilter(null);
    setStealerFilter(null);
    setDomainFilter("");
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium">{`${label}: ${payload[0].value.toLocaleString()}`}</p>
        </div>
      );
    }
    return null;
  };

  const COLORS = ['#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'];

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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="border-b border-gray-800 pb-6">
          <h1 className="text-4xl font-bold text-white mb-2">Security Dashboard</h1>
          <p className="text-gray-400">Real-time monitoring of compromised credentials and security threats</p>
          
          {/* Filter Controls */}
          <div className="mt-4 flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-400">Active Filters:</span>
            </div>
            {countryFilter && (
              <Badge variant="outline" className="text-blue-400 border-blue-400">
                Country: {countryFilter}
                <button onClick={() => setCountryFilter(null)} className="ml-1 text-xs">×</button>
              </Badge>
            )}
            {stealerFilter && (
              <Badge variant="outline" className="text-green-400 border-green-400">
                Stealer: {stealerFilter}
                <button onClick={() => setStealerFilter(null)} className="ml-1 text-xs">×</button>
              </Badge>
            )}
            {domainFilter && (
              <Badge variant="outline" className="text-purple-400 border-purple-400">
                Domain: {domainFilter}
                <button onClick={() => setDomainFilter("")} className="ml-1 text-xs">×</button>
              </Badge>
            )}
            {(countryFilter || stealerFilter || domainFilter) && (
              <Button size="sm" variant="outline" onClick={clearFilters} className="text-gray-400 border-gray-600">
                Clear All
              </Button>
            )}
          </div>
        </div>

        {/* Combined Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-100">
                Total Credentials
              </CardTitle>
              <Database className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats?.total_credentials?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-blue-200">
                Compromised user accounts
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-900/50 to-red-800/30 border-red-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-100">
                Payment Cards
              </CardTitle>
              <CreditCard className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats?.total_cards?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-red-200">
                Compromised payment cards
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-100">
                Compromised Systems
              </CardTitle>
              <Users className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats?.total_systems?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-green-200">
                Infected machines detected
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 border-yellow-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-yellow-100">
                Active Alerts
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats?.total_alerts?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-yellow-200">
                Unresolved security alerts
              </p>
              <div className="mt-2 flex gap-2">
                <div className="text-xs text-gray-300">
                  Card: <span className="text-red-400">{cardAlerts?.length || 0}</span>
                </div>
                <div className="text-xs text-gray-300">
                  Credential: <span className="text-blue-400">{alerts?.length || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Country Distribution Chart */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span>Country Distribution</span>
                <Input
                  placeholder="Filter countries..."
                  value={countryFilter || ""}
                  onChange={(e) => setCountryFilter(e.target.value || null)}
                  className="w-48 bg-gray-800 border-gray-700 text-white"
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={filteredCountryStats.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="country" 
                    tick={{ fill: '#9CA3AF' }}
                  />
                  <YAxis tick={{ fill: '#9CA3AF' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="count" 
                    fill="#3B82F6" 
                    cursor="pointer"
                    onClick={handleCountryChartClick}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Stealer Type Distribution - Changed to Bar Chart */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Stealer Type Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={filteredStealerStats.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="stealer_type" 
                    tick={{ fill: '#9CA3AF', fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis tick={{ fill: '#9CA3AF' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="count" 
                    fill="#10B981"
                    cursor="pointer"
                    onClick={handleStealerChartClick}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Domains */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span>Top Compromised Domains</span>
                <Input
                  placeholder="Filter domains..."
                  value={domainFilter}
                  onChange={(e) => setDomainFilter(e.target.value)}
                  className="w-48 bg-gray-800 border-gray-700 text-white"
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={filteredDomains.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="domain" 
                    tick={{ fill: '#9CA3AF', fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis tick={{ fill: '#9CA3AF' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Security Incidents Timeline - Changed to Bar Chart */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Security Incidents Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={timelineStats?.slice(-30) || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: '#9CA3AF', fontSize: 10 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  />
                  <YAxis tick={{ fill: '#9CA3AF' }} />
                  <Tooltip 
                    content={<CustomTooltip />}
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#8B5CF6"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Security Alerts */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                Recent Security Alerts
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Show:</span>
                <Select value={alertLimit.toString()} onValueChange={(value) => setAlertLimit(parseInt(value))}>
                  <SelectTrigger className="w-24 bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alertsLoading || cardAlertsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
                <p className="text-gray-400 mt-2">Loading alerts...</p>
              </div>
            ) : (!alerts || alerts.length === 0) && (!cardAlerts || cardAlerts.length === 0) ? (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No recent alerts found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-300">Type</TableHead>
                    <TableHead className="text-gray-300">Severity</TableHead>
                    <TableHead className="text-gray-300">Matched Field</TableHead>
                    <TableHead className="text-gray-300">Matched Value</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Date</TableHead>
                    <TableHead className="text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Credential Alerts */}
                  {alerts?.map((alert) => (
                    <TableRow key={`cred-${alert.id}`} className="border-gray-700 hover:bg-gray-800/50">
                      <TableCell>
                        <Badge className="bg-blue-600 text-white">
                          CREDENTIAL
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          alert.severity === 'critical' ? 'bg-red-600 text-white' :
                          alert.severity === 'high' ? 'bg-orange-600 text-white' :
                          alert.severity === 'medium' ? 'bg-yellow-600 text-white' :
                          'bg-green-600 text-white'
                        }>
                          {alert.severity.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-300">{alert.matched_field}</TableCell>
                      <TableCell className="text-white font-mono">{alert.matched_value}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          alert.status === 'new' ? 'text-red-400 border-red-400' :
                          alert.status === 'reviewed' ? 'text-green-400 border-green-400' :
                          'text-gray-400 border-gray-400'
                        }>
                          {alert.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {new Date(alert.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/alert/${alert.id}`)}
                          className="border-gray-700 text-gray-300 hover:text-white"
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Card Alerts */}
                  {cardAlerts?.map((alert) => (
                    <TableRow key={`card-${alert.id}`} className="border-gray-700 hover:bg-gray-800/50">
                      <TableCell>
                        <Badge className="bg-red-600 text-white">
                          CARD
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          alert.severity === 'critical' ? 'bg-red-600 text-white' :
                          alert.severity === 'high' ? 'bg-orange-600 text-white' :
                          alert.severity === 'medium' ? 'bg-yellow-600 text-white' :
                          'bg-green-600 text-white'
                        }>
                          {alert.severity.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-300">BIN</TableCell>
                      <TableCell className="text-white font-mono">{alert.matched_bin}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          alert.status === 'new' ? 'text-red-400 border-red-400' :
                          alert.status === 'reviewed' ? 'text-green-400 border-green-400' :
                          'text-gray-400 border-gray-400'
                        }>
                          {alert.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {new Date(alert.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/card/${alert.card_id}`)}
                          className="border-gray-700 text-gray-300 hover:text-white"
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Quick Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 hover:border-gray-600 transition-colors cursor-pointer" onClick={() => navigate('/search')}>
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Search className="h-5 w-5 text-blue-400" />
                Advanced Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">Search through compromised credentials with advanced filters</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 hover:border-gray-600 transition-colors cursor-pointer" onClick={() => navigate('/cards')}>
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-red-400" />
                Card Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">Monitor compromised payment cards and Egyptian bank data</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 hover:border-gray-600 transition-colors cursor-pointer" onClick={() => navigate('/alerts')}>
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                Alerts Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">Manage security alerts and watchlist notifications</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
