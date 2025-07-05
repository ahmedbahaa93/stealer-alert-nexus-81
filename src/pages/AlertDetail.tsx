
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, AlertCircle, CheckCircle, Clock, Shield, ExternalLink, AlertTriangle } from "lucide-react";
import { apiService, Alert as AlertType } from "@/services/api";
import { toast } from "@/hooks/use-toast";

export const AlertDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const alertId = parseInt(id || '0');

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => apiService.getAlerts(),
  });

  const alert = alerts?.find(a => a.id === alertId);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'high': return <Shield className="h-5 w-5 text-orange-500" />;
      case 'medium': return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'low': return <CheckCircle className="h-5 w-5 text-green-500" />;
      default: return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
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

  const handleResolveAlert = async () => {
    try {
      await apiService.resolveAlert(alertId);
      toast({
        title: "Alert Resolved",
        description: "The alert has been marked as resolved.",
      });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      navigate('/alerts');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resolve alert. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleMarkFalsePositive = async () => {
    try {
      await apiService.markAlertFalsePositive(alertId);
      toast({
        title: "Marked as False Positive",
        description: "The alert has been marked as a false positive.",
      });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      navigate('/alerts');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark as false positive. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleViewRecord = () => {
    if (alert?.record_type === 'credential' && alert?.record_id) {
      navigate(`/credential/${alert.record_id}`);
    } else if (alert?.record_type === 'card' && alert?.record_id) {
      navigate(`/card/${alert.record_id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-800 rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-gray-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!alert) {
    return (
      <div className="min-h-screen bg-gray-950 p-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Alert Not Found</h1>
          <Button onClick={() => navigate('/alerts')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Alerts
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
          <Button 
            onClick={() => navigate('/alerts')} 
            variant="outline"
            className="text-gray-300 border-gray-700 hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Alerts
          </Button>
          <h1 className="text-2xl font-bold text-white">Alert Details</h1>
        </div>

        <Card className="bg-gray-900 border-gray-800 shadow-xl">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {getSeverityIcon(alert.severity)}
                <div>
                  <CardTitle className="text-white text-xl">
                    {alert.matched_field} Match Alert
                  </CardTitle>
                  <p className="text-gray-400 mt-1">Alert ID: #{alert.id}</p>
                </div>
              </div>
              <Badge className={getSeverityColor(alert.severity)} style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
                {alert.severity.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          
          <Separator className="bg-gray-700" />
          
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  Alert Information
                </h3>
                <div className="space-y-4 bg-gray-800/50 p-4 rounded-lg">
                  <div>
                    <label className="text-sm text-gray-400 font-medium">Matched Field</label>
                    <p className="text-white font-medium mt-1">{alert.matched_field}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 font-medium">Matched Value</label>
                    <p className="text-white font-medium break-all mt-1 bg-gray-900 p-2 rounded font-mono text-sm">
                      {alert.matched_value}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 font-medium">Record Type</label>
                    <p className="text-white font-medium capitalize mt-1">{alert.record_type}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 font-medium">Status</label>
                    <div className="mt-1">
                      <Badge variant={alert.status === 'new' ? 'destructive' : 'secondary'}>
                        {alert.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-400" />
                  Additional Details
                </h3>
                <div className="space-y-4 bg-gray-800/50 p-4 rounded-lg">
                  <div>
                    <label className="text-sm text-gray-400 font-medium">Severity Level</label>
                    <div className="mt-1 flex items-center gap-2">
                      {getSeverityIcon(alert.severity)}
                      <span className="text-white font-medium capitalize">{alert.severity}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 font-medium">Record ID</label>
                    <p className="text-blue-400 font-medium mt-1">#{alert.record_id}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 font-medium">Created</label>
                    <p className="text-white mt-1">{new Date(alert.created_at).toLocaleString()}</p>
                  </div>
                  {alert.reviewed_at && (
                    <div>
                      <label className="text-sm text-gray-400 font-medium">Reviewed</label>
                      <p className="text-white mt-1">{new Date(alert.reviewed_at).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Separator className="bg-gray-700" />

            <div className="flex flex-col sm:flex-row flex-wrap gap-3">
              {alert.status === 'new' && (
                <>
                  <Button 
                    onClick={handleResolveAlert} 
                    variant="default"
                    className="bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-none"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Resolve Alert
                  </Button>
                  <Button 
                    onClick={handleMarkFalsePositive} 
                    variant="outline"
                    className="text-orange-400 border-orange-800 hover:bg-orange-900/30 flex-1 sm:flex-none"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Mark as False Positive
                  </Button>
                </>
              )}
              <Button 
                onClick={handleViewRecord} 
                variant="outline"
                className="text-blue-400 border-blue-800 hover:bg-blue-900/30 flex-1 sm:flex-none"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View {alert.record_type} Record
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
