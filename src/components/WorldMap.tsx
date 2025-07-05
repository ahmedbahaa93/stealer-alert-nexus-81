import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe } from 'lucide-react';

interface CountryData {
  country: string;
  count: number;
}

interface WorldMapProps {
  data: CountryData[];
}

export const WorldMap: React.FC<WorldMapProps> = ({ data }) => {
  // Get max count for color intensity calculation
  const maxCount = Math.max(...data.map(d => d.count), 1);
  
  // Create a map of country codes to counts for easy lookup
  const countryMap = data.reduce((acc, item) => {
    // Simple country name to code mapping (you might want to use a proper library)
    const countryCode = getCountryCode(item.country);
    acc[countryCode] = item.count;
    return acc;
  }, {} as Record<string, number>);

  const getIntensity = (count: number) => {
    return Math.min(count / maxCount, 1);
  };

  const getColor = (intensity: number) => {
    const red = Math.round(255 * intensity);
    return `rgb(${red}, 0, 0)`;
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Global Threat Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Simple list view since we can't use external map libraries */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.slice(0, 10).map((country, index) => {
              const intensity = getIntensity(country.count);
              return (
                <div 
                  key={country.country}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ backgroundColor: `rgba(239, 68, 68, ${intensity * 0.3})` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-red-600 rounded-full text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <span className="text-white font-medium">{country.country}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-white font-bold">{country.count}</span>
                    <p className="text-gray-400 text-sm">infections</p>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Heat map legend */}
          <div className="flex items-center justify-between mt-6 p-4 bg-gray-800 rounded-lg">
            <span className="text-gray-400 text-sm">Infection Intensity</span>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">Low</span>
              <div className="flex">
                {[0.2, 0.4, 0.6, 0.8, 1.0].map((intensity, i) => (
                  <div
                    key={i}
                    className="w-4 h-4"
                    style={{ backgroundColor: `rgba(239, 68, 68, ${intensity})` }}
                  />
                ))}
              </div>
              <span className="text-gray-400 text-sm">High</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Simple country name to code mapping (you might want to expand this)
function getCountryCode(countryName: string): string {
  const mapping: Record<string, string> = {
    'United States': 'US',
    'Germany': 'DE',
    'Russia': 'RU',
    'Brazil': 'BR',
    'China': 'CN',
    'India': 'IN',
    'United Kingdom': 'GB',
    'France': 'FR',
    'Italy': 'IT',
    'Spain': 'ES',
    'Canada': 'CA',
    'Australia': 'AU',
    'Japan': 'JP',
    'South Korea': 'KR',
    'Mexico': 'MX',
    'Netherlands': 'NL',
    'Poland': 'PL',
    'Turkey': 'TR',
    'Ukraine': 'UA',
    'Romania': 'RO',
  };
  
  return mapping[countryName] || countryName.substring(0, 2).toUpperCase();
}