import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Checkbox } from '@/components/ui/checkbox';
import { apiService, Card as CardType, CardSearchFilters } from '@/services/api';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Search as SearchIcon, Building2, AlertTriangle, Target, Eye, EyeOff, ArrowLeft, X } from 'lucide-react';

export const Cards = () => {
  const [filters, setFilters] = useState<CardSearchFilters>({
    limit: 100,
    offset: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isFiltering, setIsFiltering] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showCardNumbers, setShowCardNumbers] = useState(false);
  const [showOnlyEgyptian, setShowOnlyEgyptian] = useState(false);
  const [showOnlyAlertsCards, setShowOnlyAlertsCards] = useState(false);
  const [totalCards, setTotalCards] = useState(0);
  const navigate = useNavigate();

  const { data: cards, isLoading, error, refetch } = useQuery({
    queryKey: ['cards', filters],
    queryFn: async () => {
      const result = await apiService.getCards(filters);
      // If we got less than the limit, we know this is the last page
      if (Array.isArray(result) && result.length < (filters.limit || 100)) {
        setTotalCards((filters.offset || 0) + result.length);
      } else if (Array.isArray(result)) {
        // Estimate total for pagination display
        setTotalCards(Math.min(50000, (filters.offset || 0) + result.length + 1));
      }
      return result;
    },
    enabled: true,
  });

  const { data: cardAlerts } = useQuery({
    queryKey: ['cardAlerts'],
    queryFn: () => apiService.getCardAlerts({ limit: 1000 }),
  });

  const { data: cardStats } = useQuery({
    queryKey: ['cardStats'],
    queryFn: () => apiService.getCardStats(),
  });

  const handleSearch = async () => {
    setIsFiltering(true);
    const newFilters: CardSearchFilters = {
      ...filters,
      offset: 0,
    };

    if (searchTerm.trim()) {
      newFilters.cardholder = searchTerm.trim();
    } else {
      delete newFilters.cardholder;
    }

    setFilters(newFilters);
    setCurrentPage(1);
    setTimeout(() => setIsFiltering(false), 500);
  };

  const handleFilterChange = (key: keyof CardSearchFilters, value: string | undefined) => {
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

  const formatCardNumber = (number: string) => {
    if (!number) return 'N/A';
    if (showCardNumbers) {
      return number.replace(/(\d{4})(?=\d)/g, '$1 ');
    }
    return `${number.slice(0, 4)} **** **** ${number.slice(-4)}`;
  };

  const getCardTypeColor = (cardType: string) => {
    switch (cardType?.toLowerCase()) {
      case 'credit': return 'bg-red-100 text-red-800 border-red-200';
      case 'debit': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'prepaid': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSchemeColor = (scheme: string) => {
    switch (scheme?.toLowerCase()) {
      case 'visa': return 'bg-blue-600 text-white';
      case 'mastercard': return 'bg-red-600 text-white';
      case 'maestro': return 'bg-orange-600 text-white';
      case 'american express': return 'bg-green-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const handleEgyptianOnlyChange = (checked: boolean | "indeterminate") => {
    setShowOnlyEgyptian(checked === true);
  };

  const handleAlertsOnlyChange = (checked: boolean | "indeterminate") => {
    setShowOnlyAlertsCards(checked === true);
  };

  const clearAllFilters = () => {
    setFilters({ limit: 100, offset: 0 });
    setSearchTerm('');
    setCurrentPage(1);
    setShowOnlyEgyptian(false);
    setShowOnlyAlertsCards(false);
  };

  // Filter cards based on checkboxes
  let filteredCards = Array.isArray(cards) ? cards : [];
  
  if (showOnlyEgyptian) {
    filteredCards = filteredCards.filter(card => card.is_egyptian);
  }
  
  if (showOnlyAlertsCards && cardAlerts) {
    const alertCardIds = new Set(cardAlerts.map(alert => alert.card_id));
    filteredCards = filteredCards.filter(card => alertCardIds.has(card.id));
  }

  const limit = filters.limit || 100;
  const currentOffset = filters.offset || 0;
  
  // Calculate pagination info
  const maxPossiblePages = Math.ceil(Math.min(50000, totalCards) / limit);
  const hasNextPage = filteredCards.length === limit && currentOffset + limit < 50000 && filters.limit !== 50000;
  const hasPrevPage = currentPage > 1;
  
  const egyptianCards = filteredCards.filter(card => card.is_egyptian);
  const uniqueBanks = new Set(egyptianCards.map(card => card.egyptian_bank).filter(Boolean));

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
            Credit Card Search
          </h1>
          <p className="text-gray-400 mt-2 text-lg">
            Search and analyze compromised credit cards with focus on Egyptian banks
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-100">
                Total Cards
              </CardTitle>
              <CreditCard className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {filteredCards.length.toLocaleString()}
              </div>
              <p className="text-xs text-blue-200">
                Found in search (page {currentPage})
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-900/50 to-red-800/30 border-red-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-100">
                Egyptian Cards
              </CardTitle>
              <Building2 className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {egyptianCards.length.toLocaleString()}
              </div>
              <p className="text-xs text-red-200">
                From Egyptian banks
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-100">
                Unique Banks
              </CardTitle>
              <Target className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {uniqueBanks.size}
              </div>
              <p className="text-xs text-green-200">
                Egyptian banks affected
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-100">
                Alert Cards
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {cardAlerts ? new Set(cardAlerts.map(alert => alert.card_id)).size : 0}
              </div>
              <p className="text-xs text-purple-200">
                Cards with alerts
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Search and Filters */}
        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 shadow-lg">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <SearchIcon className="h-5 w-5 text-blue-400" />
              Card Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by cardholder name..."
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

            {/* Special Filters */}
            <div className="flex flex-wrap gap-4 p-4 bg-gray-800/50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="egyptian-only"
                  checked={showOnlyEgyptian}
                  onCheckedChange={handleEgyptianOnlyChange}
                />
                <label htmlFor="egyptian-only" className="text-sm text-gray-300 cursor-pointer">
                  Show only Egyptian cards
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="alerts-only"
                  checked={showOnlyAlertsCards}
                  onCheckedChange={handleAlertsOnlyChange}
                />
                <label htmlFor="alerts-only" className="text-sm text-gray-300 cursor-pointer">
                  Show only cards with alerts
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <Select onValueChange={(value) => handleFilterChange('card_type', value)}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Card Type" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Credit">Credit</SelectItem>
                  <SelectItem value="Debit">Debit</SelectItem>
                  <SelectItem value="Prepaid">Prepaid</SelectItem>
                </SelectContent>
              </Select>

              <Select onValueChange={(value) => handleFilterChange('bank_name', value)}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Bank Name" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 max-h-60">
                  <SelectItem value="all">All Banks</SelectItem>
                  {cardStats?.bank_stats?.map(bank => (
                    <SelectItem key={bank.bank_name} value={bank.bank_name} className="text-white">
                      {bank.bank_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                placeholder="BIN (first 6 digits)"
                onChange={(e) => handleFilterChange('bin_number', e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
                maxLength={6}
              />

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
                  <SelectItem value="all">All Results</SelectItem>
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
                  onClick={() => setShowCardNumbers(!showCardNumbers)}
                  className="border-gray-700 text-gray-300 hover:text-white flex items-center gap-2"
                >
                  {showCardNumbers ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showCardNumbers ? 'Hide' : 'Show'} Card Numbers
                </Button>
              </div>
              <div className="text-gray-400 text-sm">
                Found: <span className="text-white font-semibold">{filteredCards.length}</span> cards | 
                Egyptian: <span className="text-red-400 font-semibold">{egyptianCards.length}</span> |
                With Alerts: <span className="text-purple-400 font-semibold">
                  {cardAlerts ? filteredCards.filter(card => cardAlerts.some(alert => alert.card_id === card.id)).length : 0}
                </span>
                {currentOffset > 0 && (
                  <span className="ml-2">
                    (showing {currentOffset + 1}-{currentOffset + filteredCards.length})
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
                <CreditCard className="h-5 w-5 text-blue-400" />
                <span>Card Results</span>
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
                <p className="text-red-400 mb-2">Error loading cards</p>
                <p className="text-gray-400 text-sm mb-4">{error.message}</p>
                <Button onClick={() => refetch()} className="bg-red-600 hover:bg-red-700">
                  Retry
                </Button>
              </div>
            ) : isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-400 mt-2">Searching cards...</p>
              </div>
            ) : filteredCards.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No cards found matching your search criteria</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700">
                        <TableHead className="text-gray-300">Card Number</TableHead>
                        <TableHead className="text-gray-300">Cardholder</TableHead>
                        <TableHead className="text-gray-300">Bank</TableHead>
                        <TableHead className="text-gray-300">Type</TableHead>
                        <TableHead className="text-gray-300">Scheme</TableHead>
                        <TableHead className="text-gray-300">Expiry</TableHead>
                        <TableHead className="text-gray-300">Country</TableHead>
                        <TableHead className="text-gray-300">Alert Status</TableHead>
                        <TableHead className="text-gray-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCards.map((card, index) => {
                        const hasAlert = cardAlerts?.some(alert => alert.card_id === card.id);
                        return (
                          <TableRow 
                            key={card.id} 
                            className={`border-gray-700 hover:bg-gray-800/50 cursor-pointer transition-all duration-300 ${card.is_egyptian ? 'bg-red-900/10' : ''} ${hasAlert ? 'bg-yellow-900/10' : ''}`}
                            onClick={() => navigate(`/card/${card.id}`)}
                          >
                            <TableCell className="text-white font-mono">
                              {formatCardNumber(card.number || '')}
                            </TableCell>
                            <TableCell className="text-gray-300">
                              <div className="truncate max-w-[150px]" title={card.cardholder || 'N/A'}>
                                {card.cardholder || 'N/A'}
                              </div>
                            </TableCell>
                            <TableCell className="text-white">
                              <div className="truncate max-w-[200px]" title={card.egyptian_bank || 'Unknown'}>
                                {card.egyptian_bank || 'Unknown'}
                                {card.is_egyptian && (
                                  <Badge className="ml-2 bg-red-600 text-white text-xs">EG</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getCardTypeColor(card.card_type || '')}>
                                {card.card_type || 'Unknown'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={getSchemeColor(card.scheme || '')}>
                                {card.scheme || 'Unknown'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-300 font-mono">
                              {card.expiry || 'N/A'}
                            </TableCell>
                            <TableCell className="text-gray-300">
                              {card.country || 'Unknown'}
                            </TableCell>
                            <TableCell>
                              {hasAlert ? (
                                <Badge className="bg-yellow-600 text-white">
                                  Has Alert
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-gray-400 border-gray-600">
                                  No Alert
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-gray-700 text-gray-300 hover:text-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/card/${card.id}`);
                                }}
                              >
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
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