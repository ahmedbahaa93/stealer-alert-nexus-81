import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { apiService, Alert } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { AlertTriangle, Shield, Target, Clock, Download, Filter, X, CreditCard, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6'];

export const AlertsDashboard = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    status: '',
    severity: '',
    date_from: '',
    date_to: '',
    limit: 50,
    offset: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [alertTypeFilter, setAlertTypeFilter] = useState<'all' | 'credential' | 'card'>('all');

  const { data: alerts, isLoading: alertsLoading, refetch: refetchAlerts } = useQuery({
    queryKey: ['allAlerts', filters],
    queryFn: () => apiService.getAlerts({ ...filters, limit: 500 }), // Show up to 500 alerts
  });

  const { data: cardAlerts, isLoading: cardAlertsLoading, refetch: refetchCardAlerts } = useQuery({
    queryKey: ['cardAlerts', filters],
    queryFn: () => apiService.getCardAlerts({ ...filters, limit: 500 }),
  });

  // Combined alerts with type filtering
  let allAlerts = [];
  if (alertTypeFilter === 'all') {
    allAlerts = [...(alerts || []), ...(cardAlerts || [])];
  } else if (alertTypeFilter === 'credential') {
    allAlerts = alerts || [];
  } else if (alertTypeFilter === 'card') {
    allAlerts = cardAlerts || [];
  }

  const totalPages = Math.ceil(allAlerts.length / filters.limit);
  const paginatedAlerts = allAlerts.slice(
    (currentPage - 1) * filters.limit,
    currentPage * filters.limit
  );

  const handleResolveAlert = async (alertId: number, isCardAlert: boolean = false) => {
    try {
      if (isCardAlert) {
        await apiService.resolveCardAlert(alertId);
      } else {
        await apiService.resolveAlert(alertId);
      }
      toast({
        title: "Alert Resolved",
        description: "The alert has been successfully resolved.",
      });
      refetchAlerts();
      refetchCardAlerts();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resolve alert. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleMarkFalsePositive = async (alertId: number, isCardAlert: boolean = false) => {
    try {
      if (isCardAlert) {
        await apiService.markCardAlertFalsePositive(alertId);
      } else {
        await apiService.markAlertFalsePositive(alertId);
      }
      toast({
        title: "Marked as False Positive",
        description: "The alert has been marked as a false positive.",
      });
      refetchAlerts();
      refetchCardAlerts();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark as false positive. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExport = async () => {
    try {
      // Create CSV content
      const csvContent = [
        'Type,ID,Severity,Status,Matched Field,Matched Value,Date Created',
        ...allAlerts.map(alert => {
          const isCardAlert = 'matched_bin' in alert;
          return [
            isCardAlert ? 'Card Alert' : 'Credential Alert',
            alert.id,
            alert.severity,
            alert.status,
            isCardAlert ? 'BIN' : (alert as Alert).matched_field,
            isCardAlert ? (alert as any).matched_bin : (alert as Alert).matched_value,
            new Date(alert.created_at).toLocaleDateString()
          ].join(',');
        })
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'alerts.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful",
        description: "Alerts exported as CSV",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export alerts. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? '' : value,
      offset: 0
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      severity: '',
      date_from: '',
      date_to: '',
      limit: 50,
      offset: 0,
    });
    setAlertTypeFilter('all');
    setCurrentPage(1);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-red-100 text-red-800 border-red-200';
      case 'reviewed': return 'bg-green-100 text-green-800 border-green-200';
      case 'false_positive': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  // Calculate statistics for combined alerts
  const combinedAlerts = [...(alerts || []), ...(cardAlerts || [])];
  const severityStats = combinedAlerts.reduce((acc, alert) => {
    acc[alert.severity] = (acc[alert.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusStats = combinedAlerts.reduce((acc, alert) => {
    acc[alert.status] = (acc[alert.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const severityChartData = Object.entries(severityStats).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value,
  }));

  const statusChartData = Object.entries(statusStats).map(([key, value]) => ({
    name: key.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    count: value,
  }));

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="border-b border-gray-800 pb-6">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <AlertTriangle className="h-8 w-8 text-red-400" />
            Enhanced Alerts Dashboard
          </h1>
          <p className="text-gray-400">Monitor and manage all security alerts across the platform</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card className="bg-gradient-to-br from-red-900/50 to-red-800/30 border-red-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-100">
                Total Alerts
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {combinedAlerts.length.toLocaleString()}
              </div>
              <p className="text-xs text-red-200">
                All security alerts
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-100">
                Credential Alerts
              </CardTitle>
              <Database className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {alerts?.length || 0}
              </div>
              <p className="text-xs text-blue-200">
                Account compromises
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-100">
                Card Alerts
              </CardTitle>
              <CreditCard className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {cardAlerts?.length || 0}
              </div>
              <p className="text-xs text-purple-200">
                Payment card issues
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
                {combinedAlerts.filter(alert => alert.status === 'new').length}
              </div>
              <p className="text-xs text-orange-200">
                Require attention
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-100">
                Resolved
              </CardTitle>
              <Shield className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {combinedAlerts.filter(alert => alert.status === 'reviewed').length}
              </div>
              <p className="text-xs text-green-200">
                Successfully handled
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Alert Severity Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={severityChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {severityChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Alert Status Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statusChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" tick={{ fill: '#9CA3AF' }} />
                  <YAxis tick={{ fill: '#9CA3AF' }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Filters */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Filter className="h-5 w-5 text-blue-400" />
              Advanced Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Alert Type Filter Buttons */}
            <div className="mb-4 flex gap-2">
              <Button
                onClick={() => setAlertTypeFilter('all')}
                variant={alertTypeFilter === 'all' ? 'default' : 'outline'}
                className={alertTypeFilter === 'all' ? 'bg-blue-600 hover:bg-blue-700' : 'border-gray-700 text-gray-300 hover:text-white'}
              >
                All Alerts
              </Button>
              <Button
                onClick={() => setAlertTypeFilter('credential')}
                variant={alertTypeFilter === 'credential' ? 'default' : 'outline'}
                className={alertTypeFilter === 'credential' ? 'bg-blue-600 hover:bg-blue-700' : 'border-gray-700 text-gray-300 hover:text-white'}
              >
                <Database className="h-4 w-4 mr-2" />
                Credential Alerts
              </Button>
              <Button
                onClick={() => setAlertTypeFilter('card')}
                variant={alertTypeFilter === 'card' ? 'default' : 'outline'}
                className={alertTypeFilter === 'card' ? 'bg-blue-600 hover:bg-blue-700' : 'border-gray-700 text-gray-300 hover:text-white'}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Card Alerts
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
              <Select onValueChange={(value) => handleFilterChange('severity', value)}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="false_positive">False Positive</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="date"
                placeholder="From Date"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />

              <Input
                type="date"
                placeholder="To Date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />

              <Select onValueChange={(value) => handleFilterChange('limit', value)}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Per Page" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="25">25 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                  <SelectItem value="100">100 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="border-gray-700 text-gray-300 hover:text-white flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear Filters
                </Button>
                <Button
                  variant="outline"
                  onClick={handleExport}
                  className="border-gray-700 text-gray-300 hover:text-white flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </div>
              <div className="text-gray-400 text-sm">
                Showing: <span className="text-white font-semibold">{paginatedAlerts.length}</span> of{' '}
                <span className="text-white font-semibold">{allAlerts.length}</span> alerts
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts Table */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                Security Alerts
              </div>
              <Badge variant="outline" className="text-gray-300 border-gray-600">
                {allAlerts.length} total
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alertsLoading || cardAlertsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
                <p className="text-gray-400 mt-2">Loading alerts...</p>
              </div>
            ) : allAlerts.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No alerts found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700">
                        <TableHead className="text-gray-300">Type</TableHead>
                        <TableHead className="text-gray-300">Severity</TableHead>
                        <TableHead className="text-gray-300">Status</TableHead>
                        <TableHead className="text-gray-300">Matched Field</TableHead>
                        <TableHead className="text-gray-300">Matched Value</TableHead>
                        <TableHead className="text-gray-300">Date</TableHead>
                        <TableHead className="text-gray-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedAlerts.map((alert) => {
                        const isCardAlert = 'matched_bin' in alert;
                        return (
                          <TableRow key={`${isCardAlert ? 'card' : 'cred'}-${alert.id}`} className="border-gray-700 hover:bg-gray-800/50">
                            <TableCell>
                              <Badge variant="outline" className={isCardAlert ? "text-red-400 border-red-400" : "text-blue-400 border-blue-400"}>
                                {isCardAlert ? 'CARD' : 'CREDENTIAL'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={getSeverityColor(alert.severity)}>
                                {alert.severity.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(alert.status)}>
                                {alert.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-300">
                              {isCardAlert ? 'BIN' : (alert as Alert).matched_field}
                            </TableCell>
                            <TableCell className="text-white font-mono">
                              {isCardAlert ? (alert as any).matched_bin : (alert as Alert).matched_value}
                            </TableCell>
                            <TableCell className="text-gray-300">
                              {new Date(alert.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {alert.status === 'new' && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleResolveAlert(alert.id, isCardAlert)}
                                      className="border-gray-700 text-gray-300 hover:text-white"
                                    >
                                      Resolve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleMarkFalsePositive(alert.id, isCardAlert)}
                                      className="border-gray-700 text-gray-300 hover:text-white"
                                    >
                                      False Positive
                                    </Button>
                                  </>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => navigate(isCardAlert ? `/card/${(alert as any).card_id}` : `/alert/${alert.id}`)}
                                  className="border-gray-700 text-gray-300 hover:text-white"
                                >
                                  View Details
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 flex justify-center">
                    <Pagination>
                      <PaginationContent>
                        {currentPage > 1 && (
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={() => setCurrentPage(currentPage - 1)}
                              className="text-gray-300 hover:text-white cursor-pointer hover:bg-gray-800"
                            />
                          </PaginationItem>
                        )}
                        
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const page = i + 1;
                          return (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => setCurrentPage(page)}
                                isActive={currentPage === page}
                                className="text-gray-300 hover:text-white cursor-pointer hover:bg-gray-800"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}

                        {currentPage < totalPages && (
                          <PaginationItem>
                            <PaginationNext 
                              onClick={() => setCurrentPage(currentPage + 1)}
                              className="text-gray-300 hover:text-white cursor-pointer hover:bg-gray-800"
                            />
                          </PaginationItem>
                        )}
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
