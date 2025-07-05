import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { apiService, Credential, SearchFilters } from '@/services/api';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Shield, AlertTriangle, Download, Database, ArrowLeft, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export const Search = () => {
  const [filters, setFilters] = useState<SearchFilters>({
    limit: 100,
    offset: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isFiltering, setIsFiltering] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCredentials, setTotalCredentials] = useState(0);
  const navigate = useNavigate();

  const { data: credentials, isLoading, error, refetch } = useQuery({
    queryKey: ['credentials', filters],
    queryFn: async () => {
      const result = await apiService.getCredentials(filters);
      // If we got less than the limit, we know this is the last page
      if (Array.isArray(result) && result.length < (filters.limit || 100)) {
        setTotalCredentials((filters.offset || 0) + result.length);
      } else if (Array.isArray(result)) {
        // Estimate total for pagination display
        setTotalCredentials(Math.min(50000, (filters.offset || 0) + result.length + 1));
      }
      return result;
    },
    enabled: true,
  });

  const { data: countryStats } = useQuery({
    queryKey: ['countryStats'],
    queryFn: () => apiService.getCountryStats(),
  });

  const { data: stealerStats } = useQuery({
    queryKey: ['stealerStats'],
    queryFn: () => apiService.getStealerStats(),
  });

  const { data: topDomains } = useQuery({
    queryKey: ['topDomains'],
    queryFn: () => apiService.getTopDomains(),
  });

  const handleSearch = async () => {
    setIsFiltering(true);
    const newFilters: SearchFilters = {
      ...filters,
      offset: 0,
    };

    if (searchTerm.trim()) {
      newFilters.domain = searchTerm.trim();
    } else {
      delete newFilters.domain;
    }

    setFilters(newFilters);
    setCurrentPage(1);
    setTimeout(() => setIsFiltering(false), 500);
  };

  const handleFilterChange = (key: keyof SearchFilters, value: string | undefined) => {
    const newFilters = { ...filters };
    if (value && value !== 'all') {
      (newFilters as any)[key] = value;
    } else {
      delete (newFilters as any)[key];
    }
    newFilters.offset = 0;
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleLimitChange = (newLimit: string) => {
    const limit = newLimit === 'all' ? 50000 : parseInt(newLimit);
    setFilters(prev => ({ ...prev, limit, offset: 0 }));
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    const limit = filters.limit || 100;
    const newOffset = (page - 1) * limit;
    
    // Ensure we don't exceed the 50k limit
    if (newOffset >= 50000) return;
    
    setFilters(prev => ({ ...prev, offset: newOffset }));
    setCurrentPage(page);
    
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExport = async (format: 'csv') => {
    try {
      const exportFilters = { ...filters };
      // Remove pagination for export to get all matching results
      delete exportFilters.limit;
      delete exportFilters.offset;
      
      const blob = await apiService.exportCredentials(format, exportFilters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `credentials_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: "Export Successful",
        description: `Credentials exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export credentials. Please try again.",
        variant: "destructive",
      });
    }
  };

  const clearAllFilters = () => {
    setFilters({ limit: 100, offset: 0 });
    setSearchTerm('');
    setCurrentPage(1);
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 0.6) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const safeCredentials = Array.isArray(credentials) ? credentials : [];
  const limit = filters.limit || 100;
  const currentOffset = filters.offset || 0;
  
  // Calculate pagination info
  const maxPossiblePages = Math.ceil(Math.min(50000, totalCredentials) / limit);
  const hasNextPage = safeCredentials.length === limit && currentOffset + limit < 50000 && filters.limit !== 50000;
  const hasPrevPage = currentPage > 1;

  const countries = countryStats?.map(c => c.country) || [];
  const stealerTypes = stealerStats?.map(s => s.stealer_type) || [];
  const domains = topDomains?.map(d => d.domain) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6 animate-fade-in">
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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Advanced Credential Search
          </h1>
          <p className="text-gray-400 mt-2 text-lg">
            Search and analyze compromised credentials with advanced filtering capabilities
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-100">
                Total Results
              </CardTitle>
              <Database className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {safeCredentials.length.toLocaleString()}
              </div>
              <p className="text-xs text-blue-200">
                Found credentials (page {currentPage})
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-900/50 to-red-800/30 border-red-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-100">
                High Risk
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {safeCredentials.filter(c => c.confidence_score >= 0.8).length.toLocaleString()}
              </div>
              <p className="text-xs text-red-200">
                High confidence matches
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-100">
                Unique Domains
              </CardTitle>
              <Shield className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {new Set(safeCredentials.map(c => c.domain).filter(Boolean)).size}
              </div>
              <p className="text-xs text-green-200">
                Affected domains
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Search and Filters */}
        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 shadow-lg">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <SearchIcon className="h-5 w-5 text-blue-400" />
              Advanced Search & Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by domain, username, or keyword..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-700 text-white transition-all duration-300 focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button 
                onClick={handleSearch} 
                disabled={isFiltering}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-300"
              >
                {isFiltering ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  'Search'
                )}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Select onValueChange={(value) => handleFilterChange('country', value)}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 max-h-60">
                  <SelectItem value="all">All Countries</SelectItem>
                  {countries.map(country => (
                    <SelectItem key={country} value={country} className="text-white">
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select onValueChange={(value) => handleFilterChange('stealer_type', value)}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Stealer Type" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 max-h-60">
                  <SelectItem value="all">All Stealers</SelectItem>
                  {stealerTypes.map(stealer => (
                    <SelectItem key={stealer} value={stealer} className="text-white">
                      {stealer}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="date"
                placeholder="From Date"
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />

              <Input
                type="date"
                placeholder="To Date"
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />

              <Select onValueChange={handleLimitChange}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Results Limit" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="100">100 Results</SelectItem>
                  <SelectItem value="500">500 Results</SelectItem>
                  <SelectItem value="1000">1000 Results</SelectItem>
                  <SelectItem value="5000">5000 Results</SelectItem>
                  <SelectItem value="all">All Results (50k max)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={clearAllFilters}
                  className="border-gray-700 text-gray-300 hover:text-white flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear All Filters
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExport('csv')}
                  className="border-gray-700 text-gray-300 hover:text-white flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </div>
              <div className="text-gray-400 text-sm">
                Found: <span className="text-white font-semibold">{safeCredentials.length}</span> credentials
                {currentOffset > 0 && (
                  <span className="ml-2">
                    (showing {currentOffset + 1}-{currentOffset + safeCredentials.length})
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 shadow-lg">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-400" />
                <span>Search Results</span>
              </div>
              <Badge variant="outline" className="text-gray-300 border-gray-600">
                Page {currentPage} of {maxPossiblePages} (max 50k results)
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-400 mb-2">Error loading credentials</p>
                <p className="text-gray-400 text-sm mb-4">{error.message}</p>
                <Button onClick={() => refetch()} className="bg-red-600 hover:bg-red-700">
                  Retry
                </Button>
              </div>
            ) : isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-400 mt-2">Searching credentials...</p>
              </div>
            ) : safeCredentials.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No credentials found matching your search criteria</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700">
                        <TableHead className="text-gray-300">Domain</TableHead>
                        <TableHead className="text-gray-300">Username</TableHead>
                        <TableHead className="text-gray-300">Password</TableHead>
                        <TableHead className="text-gray-300">Confidence</TableHead>
                        <TableHead className="text-gray-300">Stealer</TableHead>
                        <TableHead className="text-gray-300">Country</TableHead>
                        <TableHead className="text-gray-300">Date</TableHead>
                        <TableHead className="text-gray-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {safeCredentials.map((credential, index) => (
                        <TableRow 
                          key={credential.id} 
                          className="border-gray-700 hover:bg-gray-800/50 cursor-pointer transition-all duration-300"
                          onClick={() => navigate(`/credential/${credential.id}`)}
                        >
                          <TableCell className="text-blue-400">
                            <div className="truncate max-w-[200px]" title={credential.domain || 'N/A'}>
                              {credential.domain || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-300">
                            <div className="truncate max-w-[150px]" title={credential.username || 'N/A'}>
                              {credential.username || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-300 font-mono">
                            <div className="truncate max-w-[150px]" title={credential.password || 'N/A'}>
                              {credential.password ? '●'.repeat(Math.min(credential.password.length, 12)) : 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getConfidenceColor(credential.confidence_score)}>
                              {Math.round(credential.confidence_score * 100)}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {credential.stealer_type || 'Unknown'}
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {credential.system_info?.country || 'Unknown'}
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {new Date(credential.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-gray-700 text-gray-300 hover:text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/credential/${credential.id}`);
                              }}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Enhanced Pagination */}
                {(hasNextPage || hasPrevPage) && filters.limit !== 50000 && (
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
                        
                        {/* Show page numbers with smart ellipsis */}
                        {Array.from({ length: Math.min(5, maxPossiblePages) }, (_, i) => {
                          let page;
                          if (maxPossiblePages <= 5) {
                            page = i + 1;
                          } else if (currentPage <= 3) {
                            page = i + 1;
                          } else if (currentPage >= maxPossiblePages - 2) {
                            page = maxPossiblePages - 4 + i;
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
                
                {/* Pagination Info */}
                <div className="mt-4 text-center text-sm text-gray-400">
                  Showing page {currentPage} of up to {maxPossiblePages} pages (limited to 50,000 results total)
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};