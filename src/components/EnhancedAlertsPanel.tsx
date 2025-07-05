
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, CardAlert } from "@/services/api";
import { AlertTriangle, CheckCircle, XCircle, Calendar, User } from "lucide-react";

interface EnhancedAlertsPanelProps {
  alerts: Alert[];
  cardAlerts?: CardAlert[];
  onResolveAlert: (alertId: number) => void;
  onMarkFalsePositive: (alertId: number) => void;
  onResolveCardAlert?: (alertId: number) => void;
  onMarkCardAlertFalsePositive?: (alertId: number) => void;
  alertsPerPage?: number;
  onAlertsPerPageChange?: (newLimit: number) => void;
}

export const EnhancedAlertsPanel = ({
  alerts,
  cardAlerts = [],
  onResolveAlert,
  onMarkFalsePositive,
  onResolveCardAlert,
  onMarkCardAlertFalsePositive,
  alertsPerPage = 10,
  onAlertsPerPageChange,
}: EnhancedAlertsPanelProps) => {
  const [filterType, setFilterType] = useState<'all' | 'credential' | 'card'>('all');

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-900/30 text-red-300 border-red-800';
      case 'high': return 'bg-orange-900/30 text-orange-300 border-orange-800';
      case 'medium': return 'bg-yellow-900/30 text-yellow-300 border-yellow-800';
      case 'low': return 'bg-green-900/30 text-green-300 border-green-800';
      default: return 'bg-gray-900/30 text-gray-300 border-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-red-900/30 text-red-300 border-red-800';
      case 'reviewed': return 'bg-green-900/30 text-green-300 border-green-800';
      case 'false_positive': return 'bg-gray-900/30 text-gray-300 border-gray-800';
      default: return 'bg-gray-900/30 text-gray-300 border-gray-800';
    }
  };

  // Combine and filter alerts
  const combinedAlerts = [
    ...alerts.map(alert => ({ ...alert, type: 'credential' as const })),
    ...cardAlerts.map(alert => ({ ...alert, type: 'card' as const }))
  ];

  const filteredAlerts = combinedAlerts.filter(alert => {
    if (filterType === 'all') return true;
    return alert.type === filterType;
  });

  const displayedAlerts = filteredAlerts.slice(0, alertsPerPage);

  const handlePerPageChange = (value: string) => {
    const newLimit = parseInt(value);
    if (onAlertsPerPageChange) {
      onAlertsPerPageChange(newLimit);
    }
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            Security Alerts
            <Badge variant="outline" className="text-gray-300 border-gray-600">
              {filteredAlerts.length} total
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Show:</span>
              <Select value={alertsPerPage.toString()} onValueChange={handlePerPageChange}>
                <SelectTrigger className="w-20 bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Filter:</span>
              <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                <SelectTrigger className="w-32 bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">All Alerts</SelectItem>
                  <SelectItem value="credential">Credential</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {displayedAlerts.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl text-gray-400 mb-2">No Alerts Found</h3>
            <p className="text-gray-500">No security alerts match the current filter.</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="border-gray-800">
                  <TableHead className="text-gray-300">Type</TableHead>
                  <TableHead className="text-gray-300">Severity</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Matched Field</TableHead>
                  <TableHead className="text-gray-300">Matched Value</TableHead>
                  <TableHead className="text-gray-300">Created</TableHead>
                  <TableHead className="text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedAlerts.map((alert) => (
                  <TableRow key={`${alert.type}-${alert.id}`} className="border-gray-800">
                    <TableCell>
                      <Badge 
                        className={alert.type === 'credential' 
                          ? 'bg-blue-900/30 text-blue-300 border-blue-800' 
                          : 'bg-green-900/30 text-green-300 border-green-800'
                        }
                      >
                        {alert.type === 'credential' ? 'Credential' : 'Card'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(alert.status)}>
                        {alert.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {alert.type === 'credential' 
                        ? (alert as Alert).matched_field 
                        : 'BIN'
                      }
                    </TableCell>
                    <TableCell className="text-white font-mono text-sm">
                      {alert.type === 'credential' 
                        ? (alert as Alert).matched_value 
                        : (alert as CardAlert & { type: string }).matched_bin
                      }
                    </TableCell>
                    <TableCell className="text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(alert.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {alert.status === 'new' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => {
                                if (alert.type === 'credential') {
                                  onResolveAlert(alert.id);
                                } else if (onResolveCardAlert) {
                                  onResolveCardAlert(alert.id);
                                }
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Resolve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (alert.type === 'credential') {
                                  onMarkFalsePositive(alert.id);
                                } else if (onMarkCardAlertFalsePositive) {
                                  onMarkCardAlertFalsePositive(alert.id);
                                }
                              }}
                              className="border-gray-600 text-gray-300 hover:text-white"
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              False Positive
                            </Button>
                          </>
                        )}
                        {alert.status === 'reviewed' && (
                          <div className="flex items-center gap-1 text-green-300">
                            <CheckCircle className="h-3 w-3" />
                            <span className="text-xs">Resolved</span>
                            {alert.reviewed_by && (
                              <span className="text-xs text-gray-400">
                                by {alert.reviewed_by}
                              </span>
                            )}
                          </div>
                        )}
                        {alert.status === 'false_positive' && (
                          <div className="flex items-center gap-1 text-gray-400">
                            <XCircle className="h-3 w-3" />
                            <span className="text-xs">False Positive</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredAlerts.length > alertsPerPage && (
              <div className="mt-4 text-center text-sm text-gray-400">
                Showing {displayedAlerts.length} of {filteredAlerts.length} alerts
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
