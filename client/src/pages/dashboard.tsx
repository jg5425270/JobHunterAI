import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import NavigationHeader from "@/components/navigation-header";
import StatsOverview from "@/components/stats-overview";
import ApplicationsTable from "@/components/applications-table";
import EmailPanel from "@/components/email-panel";
import AutoApplyControls from "@/components/auto-apply-controls";
import ProgressTracker from "@/components/progress-tracker";
import QuickActions from "@/components/quick-actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Mail, Settings } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();

  // Form states
  const [newApplication, setNewApplication] = useState({
    title: "",
    company: "",
    platform: "upwork",
    url: "",
    description: "",
    payRate: "",
    location: "Remote",
    status: "pending",
  });

  const [emailSettings, setEmailSettings] = useState({
    autoReply: false,
    replyTemplate: "",
    emailSignature: "",
  });

  // Get current settings
  const { data: settings } = useQuery({
    queryKey: ["/api/settings"],
    enabled: isAuthenticated,
  });

  // Load email settings from user settings
  useEffect(() => {
    if (settings) {
      setEmailSettings({
        autoReply: settings.autoReply || false,
        replyTemplate: settings.replyTemplate || "",
        emailSignature: settings.emailSignature || "",
      });
    }
  }, [settings]);

  // Add application mutation
  const addApplicationMutation = useMutation({
    mutationFn: async (application: typeof newApplication) => {
      await apiRequest("POST", "/api/applications", {
        ...application,
        payRate: application.payRate ? parseFloat(application.payRate) : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setNewApplication({
        title: "",
        company: "",
        platform: "upwork",
        url: "",
        description: "",
        payRate: "",
        location: "Remote",
        status: "pending",
      });
      toast({
        title: "Success",
        description: "Job application added successfully!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add application. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update email settings mutation
  const updateEmailSettingsMutation = useMutation({
    mutationFn: async (settings: typeof emailSettings) => {
      await apiRequest("POST", "/api/settings", settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Success",
        description: "Email settings updated successfully!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update email settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddApplication = () => {
    if (!newApplication.title || !newApplication.company) {
      toast({
        title: "Missing Information",
        description: "Please fill in job title and company name.",
        variant: "destructive",
      });
      return;
    }
    addApplicationMutation.mutate(newApplication);
  };

  const handleUpdateEmailSettings = () => {
    updateEmailSettingsMutation.mutate(emailSettings);
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <StatsOverview />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Add Tabs */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="application" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="application">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Application
                    </TabsTrigger>
                    <TabsTrigger value="email">
                      <Mail className="h-4 w-4 mr-2" />
                      Email Settings
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="application" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="title">Job Title *</Label>
                        <Input
                          id="title"
                          value={newApplication.title}
                          onChange={(e) => setNewApplication(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="e.g., React Developer"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="company">Company *</Label>
                        <Input
                          id="company"
                          value={newApplication.company}
                          onChange={(e) => setNewApplication(prev => ({ ...prev, company: e.target.value }))}
                          placeholder="e.g., TechCorp"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="platform">Platform</Label>
                        <Select 
                          value={newApplication.platform} 
                          onValueChange={(value) => setNewApplication(prev => ({ ...prev, platform: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="upwork">Upwork</SelectItem>
                            <SelectItem value="freelancer">Freelancer</SelectItem>
                            <SelectItem value="indeed">Indeed</SelectItem>
                            <SelectItem value="linkedin">LinkedIn</SelectItem>
                            <SelectItem value="remote">Remote.co</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="payRate">Pay Rate ($/hour)</Label>
                        <Input
                          id="payRate"
                          type="number"
                          value={newApplication.payRate}
                          onChange={(e) => setNewApplication(prev => ({ ...prev, payRate: e.target.value }))}
                          placeholder="80"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={newApplication.location}
                          onChange={(e) => setNewApplication(prev => ({ ...prev, location: e.target.value }))}
                          placeholder="Remote"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="url">Job URL</Label>
                        <Input
                          id="url"
                          value={newApplication.url}
                          onChange={(e) => setNewApplication(prev => ({ ...prev, url: e.target.value }))}
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newApplication.description}
                        onChange={(e) => setNewApplication(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Brief job description..."
                        rows={3}
                      />
                    </div>
                    
                    <Button 
                      onClick={handleAddApplication}
                      disabled={addApplicationMutation.isPending}
                      className="w-full"
                    >
                      {addApplicationMutation.isPending ? "Adding..." : "Add Application"}
                    </Button>
                  </TabsContent>
                  
                  <TabsContent value="email" className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="autoReply"
                        checked={emailSettings.autoReply}
                        onCheckedChange={(checked) => setEmailSettings(prev => ({ ...prev, autoReply: checked }))}
                      />
                      <Label htmlFor="autoReply">Enable Auto-Reply</Label>
                    </div>
                    
                    <div>
                      <Label htmlFor="replyTemplate">Auto-Reply Template</Label>
                      <Textarea
                        id="replyTemplate"
                        value={emailSettings.replyTemplate}
                        onChange={(e) => setEmailSettings(prev => ({ ...prev, replyTemplate: e.target.value }))}
                        placeholder="Thank you for your response. I'll get back to you soon..."
                        rows={4}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="emailSignature">Email Signature</Label>
                      <Textarea
                        id="emailSignature"
                        value={emailSettings.emailSignature}
                        onChange={(e) => setEmailSettings(prev => ({ ...prev, emailSignature: e.target.value }))}
                        placeholder="Best regards,\nYour Name\nPhone: +1234567890"
                        rows={3}
                      />
                    </div>
                    
                    <Button 
                      onClick={handleUpdateEmailSettings}
                      disabled={updateEmailSettingsMutation.isPending}
                      className="w-full"
                    >
                      {updateEmailSettingsMutation.isPending ? "Updating..." : "Update Email Settings"}
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            
            <ApplicationsTable />
            <EmailPanel />
          </div>
          
          <div className="space-y-6">
            <AutoApplyControls />
            <ProgressTracker />
            <QuickActions />
          </div>
        </div>
      </div>
    </div>
  );
}
