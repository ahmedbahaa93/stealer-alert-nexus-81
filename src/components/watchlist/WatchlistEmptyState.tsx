
import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Plus } from 'lucide-react';

interface WatchlistEmptyStateProps {
  onAddClick: () => void;
}

export const WatchlistEmptyState = ({ onAddClick }: WatchlistEmptyStateProps) => {
  return (
    <div className="text-center py-12">
      <AlertTriangle className="h-16 w-16 text-gray-600 mx-auto mb-4" />
      <h3 className="text-xl text-gray-400 mb-2">No Watchlist Items</h3>
      <p className="text-gray-500 mb-4">
        Add keywords to monitor for in new stealer logs
      </p>
      <Button
        onClick={onAddClick}
        className="bg-red-600 hover:bg-red-700"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add First Item
      </Button>
    </div>
  );
};
