
import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Download, Eye, EyeOff } from "lucide-react";
import { Credential } from "@/services/api";

interface CredentialsTableProps {
  credentials: Credential[];
  onExport: (format: 'csv' | 'json' | 'pdf') => void;
}

export const CredentialsTable = ({ credentials, onExport }: CredentialsTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [confidenceFilter, setConfidenceFilter] = useState('all');
  const [showPasswords, setShowPasswords] = useState(false);

  const getRiskLevel = (confidence: number) => {
    if (confidence >= 80) return 'critical';
    if (confidence >= 60) return 'high';
    if (confidence >= 40) return 'medium';
    return 'low';
  };

  const filteredCredentials = credentials.filter(cred => {
    const searchableText = [
      cred.username || '',
      cred.domain || '',
      cred.stealer_type || '',
      cred.url || ''
    ].join(' ').toLowerCase();
    
    const matchesSearch = searchableText.includes(searchTerm.toLowerCase());
    
    const riskLevel = getRiskLevel(cred.confidence_score);
    const matchesRisk = confidenceFilter === 'all' || riskLevel === confidenceFilter;
    
    return matchesSearch && matchesRisk;
  });

  const getRiskColor = (confidence: number) => {
    const level = getRiskLevel(confidence);
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compromised Credentials</CardTitle>
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search credentials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={confidenceFilter} onValueChange={setConfidenceFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by risk" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risk Levels</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => setShowPasswords(!showPasswords)}
            className="flex items-center gap-2"
          >
            {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showPasswords ? 'Hide' : 'Show'} Passwords
          </Button>
          <Select onValueChange={(value) => onExport(value as 'csv' | 'json' | 'pdf')}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Export" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">Export CSV</SelectItem>
              <SelectItem value="json">Export JSON</SelectItem>
              <SelectItem value="pdf">Export PDF</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Password</TableHead>
              <TableHead>Domain/URL</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead>Risk Level</TableHead>
              <TableHead>Discovered</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCredentials.map((cred) => (
              <TableRow key={cred.id}>
                <TableCell className="font-medium">
                  {cred.username || 'N/A'}
                </TableCell>
                <TableCell>
                  {showPasswords ? (cred.password || 'N/A') : '••••••••'}
                </TableCell>
                <TableCell>
                  {cred.domain || cred.url || 'N/A'}
                </TableCell>
                <TableCell>
                  {cred.stealer_type || 'Unknown'}
                </TableCell>
                <TableCell>
                  {cred.confidence_score}%
                </TableCell>
                <TableCell>
                  <Badge className={getRiskColor(cred.confidence_score)}>
                    {getRiskLevel(cred.confidence_score)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {cred.log_date ? new Date(cred.log_date).toLocaleDateString() : 
                   new Date(cred.created_at).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
