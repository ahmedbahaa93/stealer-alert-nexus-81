import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

interface TimelineData {
  date: string;
  count: number;
}

interface TimelineChartProps {
  data: TimelineData[];
}

export const TimelineChart: React.FC<TimelineChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Activity Timeline (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-400">No timeline data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxCount = Math.max(...data.map(d => d.count), 1);
  
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Activity Timeline (Last 30 Days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Simple bar chart */}
          <div className="flex items-end justify-between h-64 gap-1">
            {data.map((item, index) => {
              const height = (item.count / maxCount) * 100;
              return (
                <div key={index} className="flex flex-col items-center flex-1 group">
                  <div className="relative flex-1 flex items-end w-full">
                    <div
                      className="w-full bg-red-500 rounded-t transition-all duration-300 group-hover:bg-red-400"
                      style={{ height: `${height}%` }}
                      title={`${item.date}: ${item.count} credentials`}
                    />
                  </div>
                  <div className="text-xs text-gray-400 mt-2 transform -rotate-45 origin-left">
                    {new Date(item.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-800">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">
                {data.reduce((sum, item) => sum + item.count, 0)}
              </p>
              <p className="text-gray-400 text-sm">Total Credentials</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">
                {Math.round(data.reduce((sum, item) => sum + item.count, 0) / data.length)}
              </p>
              <p className="text-gray-400 text-sm">Daily Average</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">
                {Math.max(...data.map(d => d.count))}
              </p>
              <p className="text-gray-400 text-sm">Peak Day</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};