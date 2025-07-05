
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { Watchlist as WatchlistType } from '@/services/api';

interface WatchlistFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  newItem: {
    keyword: string;
    field_type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
  };
  onItemChange: (item: Partial<WatchlistType>) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading?: boolean;
}

export const WatchlistForm = ({
  isOpen,
  onOpenChange,
  newItem,
  onItemChange,
  onSubmit,
  isLoading = false
}: WatchlistFormProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-red-600 hover:bg-red-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Watchlist Item
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Add New Watchlist Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="keyword" className="text-gray-300">Keyword</Label>
            <Input
              id="keyword"
              value={newItem.keyword}
              onChange={(e) => onItemChange({ ...newItem, keyword: e.target.value })}
              placeholder="e.g., company.com, admin@, 192.168."
              className="bg-gray-800 border-gray-700 text-white"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="field_type" className="text-gray-300">Field Type</Label>
            <Select
              value={newItem.field_type}
              onValueChange={(value) => onItemChange({ ...newItem, field_type: value })}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="domain">Domain</SelectItem>
                <SelectItem value="username">Username/Email</SelectItem>
                <SelectItem value="ip">IP Address</SelectItem>
                <SelectItem value="machine_user">Machine User</SelectItem>
                <SelectItem value="computer_name">Computer Name</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="severity" className="text-gray-300">Severity</Label>
            <Select
              value={newItem.severity}
              onValueChange={(value: any) => onItemChange({ ...newItem, severity: value })}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-300">Description (Optional)</Label>
            <Textarea
              id="description"
              value={newItem.description}
              onChange={(e) => onItemChange({ ...newItem, description: e.target.value })}
              placeholder="Brief description of what to watch for..."
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-gray-700 text-gray-300"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-red-600 hover:bg-red-700"
              disabled={isLoading}
            >
              Add Item
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
