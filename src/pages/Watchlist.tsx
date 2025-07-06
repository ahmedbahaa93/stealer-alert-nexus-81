
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { apiService, Watchlist as WatchlistType, BinWatchlist } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Eye, CreditCard, Trash2, ArrowLeft } from 'lucide-react';
import { WatchlistForm } from '@/components/watchlist/WatchlistForm';
import { WatchlistTable } from '@/components/watchlist/WatchlistTable';
import { WatchlistEmptyState } from '@/components/watchlist/WatchlistEmptyState';
import { WatchlistLoadingState } from '@/components/watchlist/WatchlistLoadingState';
import { BinWatchlistForm } from '@/components/watchlist/BinWatchlistForm';

export const Watchlist = () => {
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBinDialogOpen, setIsBinDialogOpen] = useState(false);
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

  const { data: binWatchlistItems, isLoading: binLoading } = useQuery({
    queryKey: ['binWatchlist'],
    queryFn: () => apiService.getBinWatchlist(),
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

  const createBinMutation = useMutation({
    mutationFn: (item: Partial<BinWatchlist>) => apiService.createBinWatchlistItem(item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['binWatchlist'] });
      toast({
        title: "BIN Added to Watchlist",
        description: "BIN has been added to watchlist successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add BIN to watchlist",
        variant: "destructive",
      });
    },
  });

  const uploadBinMutation = useMutation({
    mutationFn: (file: File) => apiService.uploadBinFile(file),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['binWatchlist'] });
      toast({
        title: "BINs Uploaded Successfully",
        description: `${data.count} BINs have been added to the watchlist`,
      });
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload BIN file",
        variant: "destructive",
      });
    },
  });

  const deleteBinMutation = useMutation({
    mutationFn: (id: number) => apiService.deleteBinWatchlistItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['binWatchlist'] });
      toast({
        title: "BIN Removed",
        description: "BIN has been removed from watchlist",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove BIN from watchlist",
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

  const handleDeleteBin = (id: number) => {
    deleteBinMutation.mutate(id);
  };

  const handleAddClick = () => {
    setIsDialogOpen(true);
  };

  const handleFileUpload = async (file: File) => {
    await uploadBinMutation.mutateAsync(file);
  };

  const handleManualBinAdd = async (item: Partial<BinWatchlist>) => {
    await createBinMutation.mutateAsync(item);
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

  return (
    <div className="min-h-screen bg-gray-950 p-6">
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">Watchlist Management</h1>
              <p className="text-gray-400 mt-2">
                Configure keywords, patterns, and BINs to monitor for in new stealer logs
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="keywords" className="space-y-6">
          <TabsList className="bg-gray-900 border-gray-800">
            <TabsTrigger value="keywords" className="data-[state=active]:bg-red-600">
              <Eye className="h-4 w-4 mr-2" />
              Keyword Watchlist
            </TabsTrigger>
            <TabsTrigger value="bins" className="data-[state=active]:bg-red-600">
              <CreditCard className="h-4 w-4 mr-2" />
              BIN Watchlist
            </TabsTrigger>
          </TabsList>

          <TabsContent value="keywords">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Active Keyword Watchlist Items
                  </CardTitle>
                  <WatchlistForm
                    isOpen={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    newItem={newItem}
                    onItemChange={handleItemChange}
                    onSubmit={handleSubmit}
                    isLoading={createMutation.isPending}
                  />
                </div>
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
          </TabsContent>

          <TabsContent value="bins">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-white flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    BIN Watchlist Items
                  </CardTitle>
                  <BinWatchlistForm
                    isOpen={isBinDialogOpen}
                    onOpenChange={setIsBinDialogOpen}
                    onFileUpload={handleFileUpload}
                    onManualAdd={handleManualBinAdd}
                    isLoading={uploadBinMutation.isPending || createBinMutation.isPending}
                  />
                </div>
              </CardHeader>
              <CardContent>
                {binLoading ? (
                  <WatchlistLoadingState />
                ) : binWatchlistItems && binWatchlistItems.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-800">
                        <TableHead className="text-gray-300">BIN Number</TableHead>
                        <TableHead className="text-gray-300">Scheme</TableHead>
                        <TableHead className="text-gray-300">Bank Name</TableHead>
                        <TableHead className="text-gray-300">Country</TableHead>
                        <TableHead className="text-gray-300">Severity</TableHead>
                        <TableHead className="text-gray-300">Created</TableHead>
                        <TableHead className="text-gray-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {binWatchlistItems.map((item) => (
                        <TableRow key={item.id} className="border-gray-800">
                          <TableCell className="text-white font-mono">{item.bin_number}</TableCell>
                          <TableCell className="text-gray-300">{item.scheme || 'N/A'}</TableCell>
                          <TableCell className="text-gray-300">{item.bank_name}</TableCell>
                          <TableCell className="text-gray-300">{item.country}</TableCell>
                          <TableCell>
                            <Badge className={getSeverityColor(item.severity)}>
                              {item.severity}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {new Date(item.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                              onClick={() => handleDeleteBin(item.id)}
                              disabled={deleteBinMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <CreditCard className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl text-gray-400 mb-2">No BIN Watchlist Items</h3>
                    <p className="text-gray-500 mb-4">
                      Add BINs to monitor for in new card data
                    </p>
                    <Button
                      onClick={() => setIsBinDialogOpen(true)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Add First BIN
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
