import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiService, Watchlist as WatchlistType } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Eye } from 'lucide-react';
import { WatchlistForm } from '@/components/watchlist/WatchlistForm';
import { WatchlistTable } from '@/components/watchlist/WatchlistTable';
import { WatchlistEmptyState } from '@/components/watchlist/WatchlistEmptyState';
import { WatchlistLoadingState } from '@/components/watchlist/WatchlistLoadingState';

export const Watchlist = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState<{
    keyword: string;
    field_type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
  }>({
    keyword: '',
    field_type: 'domain',
    severity: 'medium',
    description: '',
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: watchlistItems, isLoading } = useQuery({
    queryKey: ['watchlist'],
    queryFn: () => apiService.getWatchlist(),
  });

  const createMutation = useMutation({
    mutationFn: (item: Partial<WatchlistType>) => apiService.createWatchlistItem(item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      setIsDialogOpen(false);
      setNewItem({ keyword: '', field_type: 'domain', severity: 'medium', description: '' });
      toast({
        title: "Watchlist Item Added",
        description: "New watchlist item has been created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create watchlist item",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiService.deleteWatchlistItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      toast({
        title: "Item Deleted",
        description: "Watchlist item has been removed",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete watchlist item",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(newItem);
  };

  const handleItemChange = (item: Partial<WatchlistType>) => {
    setNewItem(prev => ({ ...prev, ...item }));
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const handleAddClick = () => {
    setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="border-b border-gray-800 pb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">Watchlist Management</h1>
              <p className="text-gray-400 mt-2">
                Configure keywords and patterns to monitor for in new stealer logs
              </p>
            </div>
            <WatchlistForm
              isOpen={isDialogOpen}
              onOpenChange={setIsDialogOpen}
              newItem={newItem}
              onItemChange={handleItemChange}
              onSubmit={handleSubmit}
              isLoading={createMutation.isPending}
            />
          </div>
        </div>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Active Watchlist Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <WatchlistLoadingState />
            ) : watchlistItems && watchlistItems.length > 0 ? (
              <WatchlistTable 
                items={watchlistItems}
                onDelete={handleDelete}
                isDeleting={deleteMutation.isPending}
              />
            ) : (
              <WatchlistEmptyState onAddClick={handleAddClick} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
