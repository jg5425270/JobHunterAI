import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, UserCog, BarChart3, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";

export default function QuickActions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddApplication, setShowAddApplication] = useState(false);
  
  const [newApplication, setNewApplication] = useState({
    title: "",
    company: "",
    platform: "",
    url: "",
    description: "",
    payRate: "",
    location: "",
    status: "pending",
  });

  const addApplicationMutation = useMutation({
    mutationFn: async (application: typeof newApplication) => {
      await apiRequest("POST", "/api/applications", application);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setShowAddApplication(false);
      setNewApplication({
        title: "",
        company: "",
        platform: "",
        url: "",
        description: "",
        payRate: "",
        location: "",
        status: "pending",
      });
      toast({
        title: "Application Added",
        description: "Your job application has been recorded.",
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

  const handleAddApplication = () => {
    if (!newApplication.title || !newApplication.company || !newApplication.platform) {
      toast({
        title: "Missing Information",
        description: "Please fill in the required fields (Title, Company, Platform).",
        variant: "destructive",
      });
      return;
    }
    
    addApplicationMutation.mutate(newApplication);
  };

  const handleAction = (action: string) => {
    switch (action) {
      case 'updateProfile':
        toast({
          title: "Update Profile",
          description: "Profile update functionality coming soon!",
        });
        break;
      case 'viewAnalytics':
        toast({
          title: "View Analytics",
          description: "Detailed analytics coming soon!",
        });
        break;
      case 'bankSettings':
        toast({
          title: "Bank Settings",
          description: "Bank account settings coming soon!",
        });
        break;
      default:
        break;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Dialog open={showAddApplication} onOpenChange={setShowAddApplication}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <Plus className="h-4 w-4 mr-2" />
                Manual Application
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Job Application</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Job Title *</Label>
                  <Input
                    id="title"
                    value={newApplication.title}
                    onChange={(e) => setNewApplication(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Senior Frontend Developer"
                  />
                </div>
                
                <div>
                  <Label htmlFor="company">Company *</Label>
                  <Input
                    id="company"
                    value={newApplication.company}
                    onChange={(e) => setNewApplication(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="e.g., TechCorp Inc."
                  />
                </div>
                
                <div>
                  <Label htmlFor="platform">Platform *</Label>
                  <Select 
                    value={newApplication.platform} 
                    onValueChange={(value) => setNewApplication(prev => ({ ...prev, platform: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
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
                  <Label htmlFor="payRate">Pay Rate</Label>
                  <Input
                    id="payRate"
                    value={newApplication.payRate}
                    onChange={(e) => setNewApplication(prev => ({ ...prev, payRate: e.target.value }))}
                    placeholder="e.g., $80-120/hour"
                  />
                </div>
                
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={newApplication.location}
                    onChange={(e) => setNewApplication(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g., Remote, New York, etc."
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
                
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAddApplication(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddApplication}
                    disabled={addApplicationMutation.isPending}
                  >
                    {addApplicationMutation.isPending ? "Adding..." : "Add Application"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => handleAction('updateProfile')}
          >
            <UserCog className="h-4 w-4 mr-2" />
            Update Profile
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => handleAction('viewAnalytics')}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            View Analytics
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => handleAction('bankSettings')}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Bank Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
