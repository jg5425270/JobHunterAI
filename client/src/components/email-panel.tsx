import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Mail, TrendingUp } from "lucide-react";

export default function EmailPanel() {
  const { data: unreadEmails = [], isLoading } = useQuery({
    queryKey: ["/api/emails/unread"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: settings } = useQuery({
    queryKey: ["/api/settings"],
  });

  // Mock data for demonstration - in real app this would come from API
  const emailStats = {
    unread: unreadEmails.length,
    autoReplied: 8,
    positive: 5,
    total: 26,
  };

  const recentEmail = unreadEmails[0];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email Integration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Integration</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900">Inbox Status</h3>
              <Badge 
                variant={settings?.emailIntegrationEnabled ? "default" : "secondary"}
                className={settings?.emailIntegrationEnabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                {settings?.emailIntegrationEnabled ? "Connected" : "Disconnected"}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Unread:</span>
                <span className="font-medium text-gray-900">{emailStats.unread}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Auto-replied:</span>
                <span className="font-medium text-gray-900">{emailStats.autoReplied}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Positive responses:</span>
                <span className="font-medium text-green-600">{emailStats.positive}</span>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900">Recent Email</h3>
              <Button variant="link" size="sm" className="p-0 h-auto">
                View All
              </Button>
            </div>
            <div className="space-y-2">
              {recentEmail ? (
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{recentEmail.subject}</div>
                  <div className="text-gray-600">{recentEmail.sender} • {
                    new Date(recentEmail.receivedAt).toLocaleString()
                  }</div>
                  <div className="text-gray-500 text-xs mt-1 truncate">
                    {recentEmail.content?.substring(0, 100)}...
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  No recent emails
                </div>
              )}
            </div>
          </div>
        </div>
        
        {!settings?.emailIntegrationEnabled && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center">
              <Mail className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-blue-900">Email Integration Disabled</p>
                <p className="text-sm text-blue-700">
                  Connect your email to automatically track job responses and enable auto-reply.
                </p>
              </div>
            </div>
            <Button className="mt-2 bg-blue-600 hover:bg-blue-700 text-white" size="sm">
              Enable Email Integration
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
