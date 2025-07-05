
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BarChart3, Filter, Download, Calendar } from 'lucide-react';

interface ChartData {
  date?: string;
  country?: string;
  stealer_type?: string;
  domain?: string;
  count: number;
  [key: string]: any;
}

interface EnhancedChartProps {
  data: ChartData[];
  title: string;
  type: 'timeline' | 'country' | 'stealer' | 'domain';
  onFilterChange?: (filters: any) => void;
}

export const EnhancedChart: React.FC<EnhancedChartProps> = ({ 
  data, 
  title, 
  type,
  onFilterChange 
}) => {
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    search: '',
    limit: 10
  });

  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  // Handle empty or undefined data
  const safeData = Array.isArray(data) ? data : [];
  
  const filteredData = safeData.filter(item => {
    if (!item || typeof item.count !== 'number') return false;
    
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const searchableFields = [item.country, item.stealer_type, item.domain].filter(Boolean);
      if (!searchableFields.some(field => field?.toLowerCase().includes(searchTerm))) {
        return false;
      }
    }
    
    if (filters.dateFrom && item.date) {
      if (new Date(item.date) < new Date(filters.dateFrom)) return false;
    }
    
    if (filters.dateTo && item.date) {
      if (new Date(item.date) > new Date(filters.dateTo)) return false;
    }
    
    return true;
  }).slice(0, filters.limit);

  const maxCount = filteredData.length > 0 ? Math.max(...filteredData.map(d => d.count), 1) : 1;

  const handleExport = () => {
    const dataStr = JSON.stringify(filteredData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type}_data_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getLabel = (item: ChartData): string => {
    switch (type) {
      case 'timeline':
        return item.date ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
      case 'country':
        return item.country || 'Unknown';
      case 'stealer':
        return item.stealer_type || 'Unknown';
      case 'domain':
        return item.domain || 'Unknown';
      default:
        return 'Unknown';
    }
  };

  return (
    <Card className="bg-gray-900 border-gray-800 animate-scale-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {title}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={viewMode === 'chart' ? 'default' : 'outline'}
              onClick={() => setViewMode('chart')}
              className="transition-colors duration-300"
            >
              Chart
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'table' ? 'default' : 'outline'}
              onClick={() => setViewMode('table')}
              className="transition-colors duration-300"
            >
              Table
            </Button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Input
            placeholder="Search..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="bg-gray-800 border-gray-700 text-white w-40"
          />
          
          {type === 'timeline' && (
            <>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="bg-gray-800 border-gray-700 text-white w-40"
              />
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="bg-gray-800 border-gray-700 text-white w-40"
              />
            </>
          )}
          
          <Select value={filters.limit.toString()} onValueChange={(value) => handleFilterChange('limit', value)}>
            <SelectTrigger className="bg-gray-800 border-gray-700 text-white w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            size="sm"
            variant="outline"
            onClick={handleExport}
            className="border-gray-700 text-gray-300"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredData.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">
              {safeData.length === 0 ? 'No data available' : 'No data matches the current filters'}
            </p>
          </div>
        ) : viewMode === 'chart' ? (
          <div className="space-y-4">
            {type === 'timeline' ? (
              // Timeline Chart
              <div className="flex items-end justify-between h-64 gap-1">
                {filteredData.map((item, index) => {
                  const height = (item.count / maxCount) * 100;
                  return (
                    <div key={index} className="flex flex-col items-center flex-1 group animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
                      <div className="relative flex-1 flex items-end w-full">
                        <div
                          className="w-full bg-red-500 rounded-t transition-all duration-500 group-hover:bg-red-400 hover-scale"
                          style={{ height: `${height}%`, minHeight: '4px' }}
                          title={`${getLabel(item)}: ${item.count.toLocaleString()} items`}
                        />
                      </div>
                      <div className="text-xs text-gray-400 mt-2 transform -rotate-45 origin-left">
                        {getLabel(item)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Bar Chart for other types
              <div className="space-y-3">
                {filteredData.map((item, index) => {
                  const percentage = (item.count / maxCount) * 100;
                  return (
                    <div key={index} className="animate-slide-in-right hover-scale" style={{ animationDelay: `${index * 0.1}s` }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-300 text-sm truncate flex-1 mr-2">{getLabel(item)}</span>
                        <span className="text-white font-medium">{item.count.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-800">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">
                  {filteredData.reduce((sum, item) => sum + item.count, 0).toLocaleString()}
                </p>
                <p className="text-gray-400 text-sm">Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">
                  {Math.round(filteredData.reduce((sum, item) => sum + item.count, 0) / filteredData.length).toLocaleString() || 0}
                </p>
                <p className="text-gray-400 text-sm">Average</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">
                  {Math.max(...filteredData.map(d => d.count)).toLocaleString()}
                </p>
                <p className="text-gray-400 text-sm">Peak</p>
              </div>
            </div>
          </div>
        ) : (
          // Table View
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-gray-300 pb-2">Item</th>
                  <th className="text-right text-gray-300 pb-2">Count</th>
                  <th className="text-right text-gray-300 pb-2">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, index) => {
                  const totalCount = filteredData.reduce((sum, d) => sum + d.count, 0);
                  const percentage = totalCount > 0 ? ((item.count / totalCount) * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={index} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors duration-300">
                      <td className="text-white py-2 truncate">{getLabel(item)}</td>
                      <td className="text-white text-right py-2">{item.count.toLocaleString()}</td>
                      <td className="text-gray-400 text-right py-2">{percentage}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
