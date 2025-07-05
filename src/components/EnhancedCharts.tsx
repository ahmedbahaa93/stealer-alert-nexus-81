
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ChartData {
  name?: string;
  value?: number;
  count?: number;
  country?: string;
  stealer_type?: string;
  domain?: string;
}

interface EnhancedChartsProps {
  countryData: Array<{ country: string; count: number }>;
  stealerData: Array<{ stealer_type: string; count: number }>;
  domainData: Array<{ domain: string; count: number }>;
  timelineData: Array<{ date: string; count: number }>;
  onCountryFilter?: (country: string | null) => void;
  selectedCountry?: string | null;
}

const COLORS = ['#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'];

export const EnhancedCharts = ({ 
  countryData, 
  stealerData, 
  domainData, 
  timelineData, 
  onCountryFilter,
  selectedCountry 
}: EnhancedChartsProps) => {
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

  const handleCountryClick = (country: string) => {
    if (onCountryFilter) {
      const newCountry = selectedCountry === country ? null : country;
      onCountryFilter(newCountry);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Country Distribution Bar Chart */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span>Country Distribution</span>
            {selectedCountry && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onCountryFilter && onCountryFilter(null)}
                className="border-gray-600 text-gray-300 hover:text-white"
              >
                Clear Filter
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={countryData.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="country" 
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fill: '#9CA3AF' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="count" 
                fill="#3B82F6"
                onClick={(data) => handleCountryClick(data.country)}
                className="cursor-pointer hover:opacity-80"
              />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 text-sm text-gray-400">
            Click on a bar to filter all stats by that country
          </div>
        </CardContent>
      </Card>

      {/* Stealer Types Bar Chart */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">
            Stealer Types {selectedCountry && `(${selectedCountry})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stealerData.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="stealer_type" 
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fill: '#9CA3AF' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Domains Table Chart */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">
            Top Compromised Domains {selectedCountry && `(${selectedCountry})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700">
                <TableHead className="text-gray-300">Rank</TableHead>
                <TableHead className="text-gray-300">Domain</TableHead>
                <TableHead className="text-gray-300">Count</TableHead>
                <TableHead className="text-gray-300">Risk Level</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {domainData.slice(0, 10).map((domainItem, index) => {
                const getRiskLevel = (count: number) => {
                  if (count > 1000) return { label: 'Critical', color: 'bg-red-900/30 text-red-300 border-red-800' };
                  if (count > 500) return { label: 'High', color: 'bg-orange-900/30 text-orange-300 border-orange-800' };
                  if (count > 100) return { label: 'Medium', color: 'bg-yellow-900/30 text-yellow-300 border-yellow-800' };
                  return { label: 'Low', color: 'bg-green-900/30 text-green-300 border-green-800' };
                };
                
                const risk = getRiskLevel(domainItem.count || 0);
                
                return (
                  <TableRow key={domainItem.domain} className="border-gray-700 hover:bg-gray-800/50">
                    <TableCell className="text-gray-300 font-medium">#{index + 1}</TableCell>
                    <TableCell className="text-blue-400 font-medium">{domainItem.domain}</TableCell>
                    <TableCell className="text-white">{domainItem.count?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={risk.color}>{risk.label}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Timeline Chart */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">
            Activity Timeline (30 Days) {selectedCountry && `(${selectedCountry})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={timelineData}>
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
              <Bar dataKey="count" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
