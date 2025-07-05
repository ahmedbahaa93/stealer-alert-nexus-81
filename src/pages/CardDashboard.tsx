import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { apiService, CardAlert } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { CreditCard, AlertCircle, Shield, Target, Building2, Banknote, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'];

export const CardDashboard = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [alertsPerPage] = useState(100);

  const { data: cardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['cardStats'],
    queryFn: () => apiService.getCardStats(),
  });

  const { data: allCardAlerts, isLoading: allAlertsLoading } = useQuery({
    queryKey: ['allCardAlerts'],
    queryFn: () => apiService.getCardAlerts({ limit: 50000 }),
  });

  const { data: cardAlerts, isLoading: alertsLoading, refetch: refetchAlerts } = useQuery({
    queryKey: ['cardAlerts', { limit: alertsPerPage, offset: (currentPage - 1) * alertsPerPage }],
    queryFn: () => apiService.getCardAlerts({ 
      limit: alertsPerPage, 
      offset: (currentPage - 1) * alertsPerPage 
    }),
  });

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

  const handleMarkFalsePositive = async (alertId: number) => {
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
        description: "Failed to mark as false positive. Please try again.",
        variant: "destructive",
      });
    }
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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium">{`${label}: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  // Pagination calculations
  const totalAlerts = allCardAlerts?.length || 0;
  const totalPages = Math.ceil(totalAlerts / alertsPerPage);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
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
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <CreditCard className="h-8 w-8 text-red-400" />
            Egyptian Credit Card Dashboard
          </h1>
          <p className="text-gray-400">Monitor compromised Egyptian credit cards and BIN-based threats</p>
          <div className="mt-4">
            <Button 
              onClick={() => navigate('/cards/search')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Search Cards
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-red-900/50 to-red-800/30 border-red-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-100">
                Egyptian Banks
              </CardTitle>
              <Building2 className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {cardStats?.bank_stats?.length || 0}
              </div>
              <p className="text-xs text-red-200">
                Active monitored banks
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-900/50 to-orange-800/30 border-orange-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-100">
                Monitored BINs
              </CardTitle>
              <Target className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {cardStats?.bin_stats?.length || 0}
              </div>
              <p className="text-xs text-orange-200">
                Egyptian BIN ranges
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 border-yellow-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-yellow-100">
                Total Cards Found
              </CardTitle>
              <CreditCard className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {cardStats?.bin_stats?.reduce((sum, bin) => sum + bin.count, 0) || 0}
              </div>
              <p className="text-xs text-yellow-200">
                Egyptian cards compromised
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-100">
                Card Alerts
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {allCardAlerts?.filter(alert => alert.status === 'new').length || 0}
              </div>
              <p className="text-xs text-green-200">
                New alerts pending
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Egyptian Banks Chart */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-400" />
                Top Egyptian Banks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={cardStats?.bank_stats?.slice(0, 10) || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="bank_name" 
                    tick={{ fill: '#9CA3AF', fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={120}
                  />
                  <YAxis tick={{ fill: '#9CA3AF' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Card Type Distribution - Changed to Bar Chart */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Banknote className="h-5 w-5 text-green-400" />
                Card Type Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={cardStats?.card_type_stats || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="card_type" 
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  />
                  <YAxis tick={{ fill: '#9CA3AF' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Timeline Chart */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-400" />
                Card Discovery Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={cardStats?.timeline_stats || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  />
                  <YAxis tick={{ fill: '#9CA3AF' }} />
                  <Tooltip 
                    content={<CustomTooltip />}
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <Bar dataKey="count" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top BIN Ranges - Updated with colored text */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="h-5 w-5 text-red-400" />
                <span className="text-red-400">Top Compromised BINs</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-blue-400">BIN</TableHead>
                    <TableHead className="text-blue-400">Bank</TableHead>
                    <TableHead className="text-blue-400">Count</TableHead>
                    <TableHead className="text-blue-400">Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cardStats?.bin_stats?.slice(0, 8).map((bin, index) => (
                    <TableRow key={bin.bin_number} className="border-gray-700 hover:bg-gray-800/50">
                      <TableCell className="text-blue-400 font-mono">
                        {bin.bin_number}
                      </TableCell>
                      <TableCell className="text-white text-sm">
                        <div className="truncate max-w-[200px]" title={bin.bank_name}>
                          {bin.bank_name}
                        </div>
                      </TableCell>
                      <TableCell className="text-white font-medium">
                        {bin.count.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs border-gray-600">
                          {bin.card_type}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Card Alerts Section with Pagination */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-400" />
                Recent Card Alerts
              </div>
              <Badge variant="outline" className="text-gray-300 border-gray-600">
                {totalAlerts} total alerts
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alertsLoading || allAlertsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
                <p className="text-gray-400 mt-2">Loading card alerts...</p>
              </div>
            ) : !cardAlerts || cardAlerts.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No card alerts found</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-300">BIN</TableHead>
                      <TableHead className="text-gray-300">Bank</TableHead>
                      <TableHead className="text-gray-300">Card Number</TableHead>
                      <TableHead className="text-gray-300">Severity</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300">Date</TableHead>
                      <TableHead className="text-gray-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cardAlerts.map((alert) => (
                      <TableRow key={alert.id} className="border-gray-700 hover:bg-gray-800/50">
                        <TableCell className="text-blue-400 font-mono">
                          {alert.matched_bin}
                        </TableCell>
                        <TableCell className="text-white">
                          <div className="truncate max-w-[200px]" title={alert.bank_name}>
                            {alert.bank_name}
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-300 font-mono">
                          {alert.card_number ? `${alert.card_number.slice(0, 4)}****${alert.card_number.slice(-4)}` : 'N/A'}
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
                          {new Date(alert.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {alert.status === 'new' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleResolveCardAlert(alert.id)}
                                  className="border-gray-700 text-gray-300 hover:text-white"
                                >
                                  Resolve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleMarkFalsePositive(alert.id)}
                                  className="border-gray-700 text-gray-300 hover:text-white"
                                >
                                  False Positive
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/card/${alert.card_id}`)}
                              className="border-gray-700 text-gray-300 hover:text-white"
                            >
                              View Card
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 flex justify-center">
                    <Pagination>
                      <PaginationContent>
                        {hasPrevPage && (
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={() => handlePageChange(currentPage - 1)}
                              className="text-gray-300 hover:text-white cursor-pointer hover:bg-gray-800"
                            />
                          </PaginationItem>
                        )}
                        
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let page;
                          if (totalPages <= 5) {
                            page = i + 1;
                          } else if (currentPage <= 3) {
                            page = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            page = totalPages - 4 + i;
                          } else {
                            page = currentPage - 2 + i;
                          }
                          
                          return (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => handlePageChange(page)}
                                isActive={currentPage === page}
                                className="text-gray-300 hover:text-white cursor-pointer hover:bg-gray-800"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}

                        {hasNextPage && (
                          <PaginationItem>
                            <PaginationNext 
                              onClick={() => handlePageChange(currentPage + 1)}
                              className="text-gray-300 hover:text-white cursor-pointer hover:bg-gray-800"
                            />
                          </PaginationItem>
                        )}
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
                
                <div className="mt-4 text-center text-sm text-gray-400">
                  Showing page {currentPage} of {totalPages} ({totalAlerts} total alerts)
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};