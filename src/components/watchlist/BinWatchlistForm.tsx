import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Upload, FileText } from 'lucide-react';
import { BinWatchlist } from '@/services/api';
import { toast } from '@/hooks/use-toast';

interface BinWatchlistFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onFileUpload: (file: File) => Promise<void>;
  onManualAdd: (item: Partial<BinWatchlist>) => Promise<void>;
  isLoading?: boolean;
}

export const BinWatchlistForm = ({
  isOpen,
  onOpenChange,
  onFileUpload,
  onManualAdd,
  isLoading = false
}: BinWatchlistFormProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [manualItem, setManualItem] = useState({
    bin_number: '',
    scheme: '',
    bank_name: '',
    country: 'EG',
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical'
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        setSelectedFile(file);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please select a .txt file",
          variant: "destructive",
        });
      }
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;
    
    try {
      await onFileUpload(selectedFile);
      setSelectedFile(null);
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!manualItem.bin_number || !manualItem.bank_name) {
      toast({
        title: "Missing Information",
        description: "BIN number and bank name are required",
        variant: "destructive",
      });
      return;
    }

    try {
      await onManualAdd(manualItem);
      setManualItem({
        bin_number: '',
        scheme: '',
        bank_name: '',
        country: 'EG',
        severity: 'medium'
      });
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-red-600 hover:bg-red-700">
          <Plus className="h-4 w-4 mr-2" />
          Add BIN Watchlist
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">Add BIN to Watchlist</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800">
            <TabsTrigger value="upload" className="data-[state=active]:bg-red-600">
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </TabsTrigger>
            <TabsTrigger value="manual" className="data-[state=active]:bg-red-600">
              <FileText className="h-4 w-4 mr-2" />
              Manual Entry
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Upload BIN File (.txt)</Label>
                <p className="text-sm text-gray-400 mb-2">
                  Format: BIN,Scheme,Bank,Country (one per line)
                </p>
                <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center">
                  <Input
                    type="file"
                    accept=".txt"
                    onChange={handleFileChange}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                  {selectedFile && (
                    <p className="text-green-400 mt-2">
                      Selected: {selectedFile.name}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="text-white font-medium mb-2">Example Format:</h4>
                <pre className="text-gray-300 text-sm">
{`426336,Visa,BANQUE MISR,EG
627084,Mastercard,National Bank of Egypt,EG
458456,Visa,Commercial International Bank,EG`}
                </pre>
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
                  onClick={handleFileUpload}
                  disabled={!selectedFile || isLoading}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isLoading ? 'Uploading...' : 'Upload BINs'}
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="manual" className="space-y-4">
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bin_number" className="text-gray-300">BIN Number</Label>
                  <Input
                    id="bin_number"
                    value={manualItem.bin_number}
                    onChange={(e) => setManualItem(prev => ({ ...prev, bin_number: e.target.value }))}
                    placeholder="e.g., 426336"
                    className="bg-gray-800 border-gray-700 text-white"
                    maxLength={6}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scheme" className="text-gray-300">Scheme</Label>
                  <Select
                    value={manualItem.scheme}
                    onValueChange={(value) => setManualItem(prev => ({ ...prev, scheme: value }))}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Select scheme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Visa">Visa</SelectItem>
                      <SelectItem value="Mastercard">Mastercard</SelectItem>
                      <SelectItem value="Maestro">Maestro</SelectItem>
                      <SelectItem value="American Express">American Express</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bank_name" className="text-gray-300">Bank Name</Label>
                  <Input
                    id="bank_name"
                    value={manualItem.bank_name}
                    onChange={(e) => setManualItem(prev => ({ ...prev, bank_name: e.target.value }))}
                    placeholder="e.g., BANQUE MISR"
                    className="bg-gray-800 border-gray-700 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country" className="text-gray-300">Country</Label>
                  <Input
                    id="country"
                    value={manualItem.country}
                    onChange={(e) => setManualItem(prev => ({ ...prev, country: e.target.value }))}
                    placeholder="e.g., EG"
                    className="bg-gray-800 border-gray-700 text-white"
                    maxLength={2}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="severity" className="text-gray-300">Severity</Label>
                <Select
                  value={manualItem.severity}
                  onValueChange={(value: any) => setManualItem(prev => ({ ...prev, severity: value }))}
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
                  {isLoading ? 'Adding...' : 'Add BIN'}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};