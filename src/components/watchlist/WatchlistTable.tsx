
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { Watchlist as WatchlistType } from '@/services/api';

interface WatchlistTableProps {
  items: WatchlistType[];
  onDelete: (id: number) => void;
  isDeleting?: boolean;
}

export const WatchlistTable = ({ items, onDelete, isDeleting = false }: WatchlistTableProps) => {
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
    <Table>
      <TableHeader>
        <TableRow className="border-gray-800">
          <TableHead className="text-gray-300">Keyword</TableHead>
          <TableHead className="text-gray-300">Field Type</TableHead>
          <TableHead className="text-gray-300">Severity</TableHead>
          <TableHead className="text-gray-300">Description</TableHead>
          <TableHead className="text-gray-300">Created</TableHead>
          <TableHead className="text-gray-300">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id} className="border-gray-800">
            <TableCell className="text-white font-mono">{item.keyword}</TableCell>
            <TableCell className="text-gray-300 capitalize">{item.field_type}</TableCell>
            <TableCell>
              <Badge className={getSeverityColor(item.severity)}>
                {item.severity}
              </Badge>
            </TableCell>
            <TableCell className="text-gray-300">
              {item.description || 'No description'}
            </TableCell>
            <TableCell className="text-gray-300">
              {new Date(item.created_at).toLocaleDateString()}
            </TableCell>
            <TableCell>
              <Button
                size="sm"
                variant="outline"
                className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                onClick={() => onDelete(item.id)}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
