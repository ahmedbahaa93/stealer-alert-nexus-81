
import { EnhancedAlertsPanel } from "@/components/EnhancedAlertsPanel";
import { AlertCircle, Database, CreditCard, Clock, Shield, User, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface DashboardAlertsProps {
  alerts: any[];
  cardAlerts: any[];
  filteredStats: {
    credentialAlerts: number;
    cardAlerts: number;
  };
  alertsPerPage: number;
  onResolveAlert: (alertId: number) => Promise<void>;
  onMarkFalsePositive: (alertId: number) => Promise<void>;
  onResolveCardAlert: (alertId: number) => Promise<void>;
  onMarkCardAlertFalsePositive: (alertId: number) => Promise<void>;
  onAlertsPerPageChange: (newLimit: number) => void;
  isLoading: boolean;
}

export const DashboardAlerts = ({
  alerts,
  cardAlerts,
  filteredStats,
  alertsPerPage,
  onResolveAlert,
  onMarkFalsePositive,
  onResolveCardAlert,
  onMarkCardAlertFalsePositive,
  onAlertsPerPageChange,
  isLoading
}: DashboardAlertsProps) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-red-100 text-red-800 border-red-200';
      case 'reviewed': return 'bg-green-100 text-green-800 border-green-200';
      case 'false_positive': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <AlertCircle className="h-6 w-6 text-red-400" />
        Recent Security Alerts - Full Details
        <div className="flex items-center gap-4 ml-auto text-sm">
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-900/30 rounded-full">
            <Database className="h-4 w-4 text-blue-400" />
            <span className="text-blue-400">{filteredStats.credentialAlerts} Credential</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-green-900/30 rounded-full">
            <CreditCard className="h-4 w-4 text-green-400" />
            <span className="text-green-400">{filteredStats.cardAlerts} Card</span>
          </div>
        </div>
      </h2>
      
      {isLoading ? (
        <div className="h-96 bg-gray-800 rounded animate-pulse"></div>
      ) : (
        <div className="space-y-6">
          {/* Credential Alerts - Full Details */}
          {alerts && alerts.length > 0 && (
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Database className="h-5 w-5 text-blue-400" />
                  Credential Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {alerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity?.toUpperCase() || 'UNKNOWN'}
                        </Badge>
                        <Badge className={getStatusColor(alert.status)}>
                          {alert.status?.replace('_', ' ').toUpperCase() || 'NEW'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Clock className="h-4 w-4" />
                        {new Date(alert.created_at).toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-gray-400 text-sm">Matched Field</p>
                        <p className="text-white font-medium">{alert.matched_field}: {alert.matched_value}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Domain</p>
                        <p className="text-blue-400">{alert.domain || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Username</p>
                        <p className="text-gray-300">{alert.credential_username || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Stealer Type</p>
                        <p className="text-gray-300">{alert.stealer_type || 'Unknown'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pt-3 border-t border-gray-600">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-gray-400 text-sm">System Country</p>
                          <p className="text-gray-300">{alert.system_country || 'Unknown'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-gray-400 text-sm">Computer</p>
                          <p className="text-gray-300">{alert.computer_name || 'Unknown'}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">System IP</p>
                        <p className="text-gray-300 font-mono">{alert.system_ip || 'N/A'}</p>
                      </div>
                    </div>

                    {alert.status === 'new' && (
                      <div className="flex gap-2 pt-3 border-t border-gray-600">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onResolveAlert(alert.id)}
                          className="border-gray-600 text-gray-300 hover:text-white"
                        >
                          Resolve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onMarkFalsePositive(alert.id)}
                          className="border-gray-600 text-gray-300 hover:text-white"
                        >
                          False Positive
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Card Alerts - Full Details */}
          {cardAlerts && cardAlerts.length > 0 && (
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-green-400" />
                  Card Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cardAlerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity?.toUpperCase() || 'UNKNOWN'}
                        </Badge>
                        <Badge className={getStatusColor(alert.status)}>
                          {alert.status?.replace('_', ' ').toUpperCase() || 'NEW'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Clock className="h-4 w-4" />
                        {new Date(alert.created_at).toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-gray-400 text-sm">Matched BIN</p>
                        <p className="text-white font-mono font-medium">{alert.matched_bin}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Bank Name</p>
                        <p className="text-green-400">{alert.bank_name}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Card Number</p>
                        <p className="text-gray-300 font-mono">
                          {alert.card_number ? `${alert.card_number.slice(0, 4)}****${alert.card_number.slice(-4)}` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Description</p>
                        <p className="text-gray-300">{alert.description || 'N/A'}</p>
                      </div>
                    </div>

                    {alert.status === 'new' && (
                      <div className="flex gap-2 pt-3 border-t border-gray-600">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onResolveCardAlert(alert.id)}
                          className="border-gray-600 text-gray-300 hover:text-white"
                        >
                          Resolve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onMarkCardAlertFalsePositive(alert.id)}
                          className="border-gray-600 text-gray-300 hover:text-white"
                        >
                          False Positive
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Show message if no alerts */}
          {(!alerts || alerts.length === 0) && (!cardAlerts || cardAlerts.length === 0) && (
            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="text-center py-8">
                <Shield className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No recent alerts found</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
