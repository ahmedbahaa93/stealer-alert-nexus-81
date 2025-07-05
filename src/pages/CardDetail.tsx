import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, CreditCard, Shield, AlertTriangle, MapPin, Calendar, User, Building2, Computer, Eye, EyeOff, ExternalLink } from "lucide-react";
import { apiService } from "@/services/api";
import { toast } from "@/hooks/use-toast";

export const CardDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const cardId = parseInt(id || '0');
  const [showFullNumber, setShowFullNumber] = useState(false);

  const { data: cardDetail, isLoading } = useQuery({
    queryKey: ['cardDetail', cardId],
    queryFn: () => apiService.getCardDetail(cardId),
  });

  const formatCardNumber = (number: string) => {
    if (!number) return 'N/A';
    if (showFullNumber) {
      return number.replace(/(\d{4})(?=\d)/g, '$1 ');
    }
    return `${number.slice(0, 4)} **** **** ${number.slice(-4)}`;
  };

  const getBinInfo = (cardNumber: string) => {
    if (!cardNumber || cardNumber.length < 6) return null;
    return cardDetail?.card.bin_info;
  };

  const getCardTypeColor = (cardType: string) => {
    switch (cardType?.toLowerCase()) {
      case 'credit': return 'bg-red-100 text-red-800 border-red-200';
      case 'debit': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'prepaid': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSchemeColor = (scheme: string) => {
    switch (scheme?.toLowerCase()) {
      case 'visa': return 'bg-blue-600 text-white';
      case 'mastercard': return 'bg-red-600 text-white';
      case 'maestro': return 'bg-orange-600 text-white';
      case 'american express': return 'bg-green-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-800 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-96 bg-gray-800 rounded"></div>
              <div className="h-96 bg-gray-800 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!cardDetail) {
    return (
      <div className="min-h-screen bg-gray-950 p-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Card Not Found</h1>
          <Button onClick={() => navigate(-1)} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const { card, related_cards, related_credentials } = cardDetail;
  const binInfo = getBinInfo(card.number || '');

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            onClick={() => navigate(-1)} 
            variant="outline"
            className="text-gray-300 border-gray-700 hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-white">Card Details</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Card Information */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-6 w-6 text-blue-400" />
                  <div>
                    <CardTitle className="text-white text-xl">Credit Card Details</CardTitle>
                    <p className="text-gray-400 mt-1">Card ID: #{card.id}</p>
                  </div>
                </div>
                {card.is_egyptian && (
                  <Badge className="bg-red-600 text-white">
                    Egyptian Bank
                  </Badge>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Card Number</label>
                  <div className="flex items-center gap-2">
                    <p className="text-white font-mono text-lg">
                      {formatCardNumber(card.number || '')}
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowFullNumber(!showFullNumber)}
                      className="text-gray-400 hover:text-white"
                    >
                      {showFullNumber ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400">Cardholder Name</label>
                  <p className="text-white font-medium">{card.cardholder || 'N/A'}</p>
                </div>

                <div>
                  <label className="text-sm text-gray-400">CVV</label>
                  <p className="text-white font-mono">{card.cvv || 'N/A'}</p>
                </div>

                <div>
                  <label className="text-sm text-gray-400">Expiry Date</label>
                  <p className="text-white font-mono">{card.expiry || 'N/A'}</p>
                </div>

                <div>
                  <label className="text-sm text-gray-400">Card Type</label>
                  <Badge className={getCardTypeColor(card.card_type || '')}>
                    {card.card_type || 'Unknown'}
                  </Badge>
                </div>

                <div>
                  <label className="text-sm text-gray-400">Scheme</label>
                  <Badge className={getSchemeColor(card.scheme || '')}>
                    {card.scheme || 'Unknown'}
                  </Badge>
                </div>
              </div>

              {binInfo && (
                <>
                  <Separator className="bg-gray-700" />
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-blue-400" />
                      Bank Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-400">Bank Name</label>
                        <p className="text-white font-medium">{binInfo.issuer}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">BIN Range</label>
                        <p className="text-blue-400 font-mono">{card.number?.slice(0, 6) || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Country</label>
                        <p className="text-white font-medium">{binInfo.country}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Card Class</label>
                        <p className="text-white font-medium">{binInfo.card_type}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <Separator className="bg-gray-700" />
              
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Discovery Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">Source File</label>
                    <p className="text-white font-medium break-all">{card.source_file || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Discovered Date</label>
                    <p className="text-white font-medium">
                      {card.created_at ? new Date(card.created_at).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Log Date</label>
                    <p className="text-white font-medium">
                      {card.log_date ? new Date(card.log_date).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Stealer Type</label>
                    <Badge variant="outline" className="border-gray-600">
                      {card.stealer_type || 'Unknown'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Information */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Computer className="h-5 w-5 text-green-400" />
                System Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Machine User</label>
                  <p className="text-white font-medium">{card.machine_user || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">IP Address</label>
                  <p className="text-white font-mono">{card.ip || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Country</label>
                  <p className="text-white font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    {card.country || 'N/A'}
                  </p>
                </div>
                {card.stealer_type && (
                  <div>
                    <label className="text-sm text-gray-400">Stealer Type</label>
                    <Badge variant="outline" className="border-gray-600">
                      {card.stealer_type}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Related Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Related Cards */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Related Cards</CardTitle>
            </CardHeader>
            <CardContent>
              {related_cards && related_cards.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-300">Card Number</TableHead>
                      <TableHead className="text-gray-300">Cardholder</TableHead>
                      <TableHead className="text-gray-300">Type</TableHead>
                      <TableHead className="text-gray-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {related_cards.map((relatedCard) => (
                      <TableRow key={relatedCard.id} className="border-gray-700">
                        <TableCell className="text-white font-mono">
                          {relatedCard.number ? `${relatedCard.number.slice(0, 4)}****${relatedCard.number.slice(-4)}` : 'N/A'}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {relatedCard.cardholder || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge className={getCardTypeColor(relatedCard.card_type || '')}>
                            {relatedCard.card_type || 'Unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/card/${relatedCard.id}`)}
                            className="border-gray-700 text-gray-300 hover:text-white"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-gray-400 text-center py-4">No related cards found</p>
              )}
            </CardContent>
          </Card>

          {/* Related Credentials */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Related Credentials</CardTitle>
            </CardHeader>
            <CardContent>
              {related_credentials && related_credentials.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-300">Domain</TableHead>
                      <TableHead className="text-gray-300">Username</TableHead>
                      <TableHead className="text-gray-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {related_credentials.map((credential) => (
                      <TableRow key={credential.id} className="border-gray-700">
                        <TableCell className="text-white">
                          {credential.domain || credential.url || 'N/A'}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {credential.username || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/credential/${credential.id}`)}
                            className="border-gray-700 text-gray-300 hover:text-white"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-gray-400 text-center py-4">No related credentials found</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};