
import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiService } from '@/services/api';
import { Shield, Monitor, CreditCard, Key, Globe, Calendar } from 'lucide-react';

export const CredentialDetail = () => {
  const { id } = useParams<{ id: string }>();
  
  const { data: credentialDetail, isLoading } = useQuery({
    queryKey: ['credential-detail', id],
    queryFn: () => apiService.getCredentialDetail(Number(id)),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading credential details...</p>
        </div>
      </div>
    );
  }

  if (!credentialDetail) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl text-gray-400">Credential not found</h2>
        </div>
      </div>
    );
  }

  const { credential, related_cards, related_credentials } = credentialDetail;

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'bg-red-100 text-red-800 border-red-200';
    if (score >= 60) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getRiskLevel = (score: number) => {
    if (score >= 80) return 'Critical';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Medium';
    return 'Low';
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="border-b border-gray-800 pb-6">
          <h1 className="text-3xl font-bold text-white">Credential Details</h1>
          <p className="text-gray-400 mt-2">
            Comprehensive analysis of compromised credential #{credential.id}
          </p>
        </div>

        {/* Main Credential Info */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Key className="h-5 w-5 text-red-500" />
              Primary Credential Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Domain</label>
                <p className="text-white font-mono">{credential.domain || 'Unknown'}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Username</label>
                <p className="text-white font-mono">{credential.username || 'Unknown'}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Password</label>
                <p className="text-white font-mono bg-gray-800 p-2 rounded border">
                  {credential.password || 'Hidden'}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Risk Level</label>
                <Badge className={getRiskColor(credential.confidence_score)}>
                  {getRiskLevel(credential.confidence_score)} ({credential.confidence_score}%)
                </Badge>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Stealer Type</label>
                <p className="text-white">{credential.stealer_type || 'Unknown'}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Discovery Date</label>
                <p className="text-white">
                  {credential.log_date ? new Date(credential.log_date).toLocaleString() : 'Unknown'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabbed Details */}
        <Tabs defaultValue="system" className="space-y-6">
          <TabsList className="bg-gray-900 border-gray-800">
            <TabsTrigger value="system" className="data-[state=active]:bg-red-600">
              <Monitor className="h-4 w-4 mr-2" />
              System Info
            </TabsTrigger>
            <TabsTrigger value="cards" className="data-[state=active]:bg-red-600">
              <CreditCard className="h-4 w-4 mr-2" />
              Related Cards ({related_cards.length})
            </TabsTrigger>
            <TabsTrigger value="credentials" className="data-[state=active]:bg-red-600">
              <Key className="h-4 w-4 mr-2" />
              Related Credentials ({related_credentials.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="system">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Infected System Information</CardTitle>
              </CardHeader>
              <CardContent>
                {credential.system_info ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400">IP Address</label>
                      <p className="text-white font-mono">{credential.system_info.ip || 'Unknown'}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400">Country</label>
                      <p className="text-white">{credential.system_info.country || 'Unknown'}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400">Computer Name</label>
                      <p className="text-white">{credential.system_info.computer_name || 'Unknown'}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400">Operating System</label>
                      <p className="text-white">{credential.system_info.os_version || 'Unknown'}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400">Machine User</label>
                      <p className="text-white">{credential.system_info.machine_user || 'Unknown'}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400">HWID</label>
                      <p className="text-white font-mono text-sm">{credential.system_info.hwid || 'Unknown'}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400">RAM Size</label>
                      <p className="text-white">{credential.system_info.ram_size || 'Unknown'}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400">CPU</label>
                      <p className="text-white">{credential.system_info.cpu_name || 'Unknown'}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400">Language</label>
                      <p className="text-white">{credential.system_info.language || 'Unknown'}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400">No system information available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cards">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Related Credit Cards</CardTitle>
              </CardHeader>
              <CardContent>
                {related_cards.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-800">
                        <TableHead className="text-gray-300">Card Number</TableHead>
                        <TableHead className="text-gray-300">Cardholder</TableHead>
                        <TableHead className="text-gray-300">Expiry</TableHead>
                        <TableHead className="text-gray-300">Type</TableHead>
                        <TableHead className="text-gray-300">Date Found</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {related_cards.map((card) => (
                        <TableRow key={card.id} className="border-gray-800">
                          <TableCell className="text-white font-mono">
                            {card.number ? `****-****-****-${card.number.slice(-4)}` : 'Hidden'}
                          </TableCell>
                          <TableCell className="text-gray-300">{card.cardholder || 'Unknown'}</TableCell>
                          <TableCell className="text-gray-300">{card.expiry || 'Unknown'}</TableCell>
                          <TableCell className="text-gray-300">{card.card_type || 'Unknown'}</TableCell>
                          <TableCell className="text-gray-300">
                            {card.log_date ? new Date(card.log_date).toLocaleDateString() : 'Unknown'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-gray-400 text-center py-8">No related credit cards found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="credentials">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Related Credentials from Same System</CardTitle>
              </CardHeader>
              <CardContent>
                {related_credentials.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-800">
                        <TableHead className="text-gray-300">Domain</TableHead>
                        <TableHead className="text-gray-300">Username</TableHead>
                        <TableHead className="text-gray-300">Risk Level</TableHead>
                        <TableHead className="text-gray-300">Date Found</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {related_credentials.map((cred) => (
                        <TableRow key={cred.id} className="border-gray-800">
                          <TableCell className="text-white">{cred.domain || 'Unknown'}</TableCell>
                          <TableCell className="text-gray-300">{cred.username || 'Unknown'}</TableCell>
                          <TableCell>
                            <Badge className={getRiskColor(cred.confidence_score)}>
                              {getRiskLevel(cred.confidence_score)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {cred.log_date ? new Date(cred.log_date).toLocaleDateString() : 'Unknown'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-gray-400 text-center py-8">No related credentials found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
