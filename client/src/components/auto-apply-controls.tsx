import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";

export default function AutoApplyControls() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/settings"],
  });

  const [localSettings, setLocalSettings] = useState({
    dailyTarget: 7,
    preferredLocation: "Remote",
    minPayRate: 50,
    autoApplyEnabled: true,
  });

  // Update local settings when data is loaded
  useState(() => {
    if (settings) {
      setLocalSettings({
        dailyTarget: settings.dailyTarget || 7,
        preferredLocation: settings.preferredLocation || "Remote",
        minPayRate: settings.minPayRate || 50,
        autoApplyEnabled: settings.autoApplyEnabled ?? true,
      });
    }
  }, [settings]);

  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: typeof localSettings) => {
      await apiRequest("POST", "/api/settings", newSettings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Settings Saved",
        description: "Your auto-apply settings have been updated.",
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
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveSettingsMutation.mutate(localSettings);
  };

  const handleToggleAutoApply = (enabled: boolean) => {
    setLocalSettings(prev => ({ ...prev, autoApplyEnabled: enabled }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Auto-Apply Control</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Auto-Apply Control</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-apply-switch" className="text-sm font-medium text-gray-700">
              Auto-Apply Status
            </Label>
            <Switch
              id="auto-apply-switch"
              checked={localSettings.autoApplyEnabled}
              onCheckedChange={handleToggleAutoApply}
            />
          </div>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="daily-target" className="block text-sm font-medium text-gray-700">
                Daily Target
              </Label>
              <Input
                id="daily-target"
                type="number"
                value={localSettings.dailyTarget}
                onChange={(e) => setLocalSettings(prev => ({ 
                  ...prev, 
                  dailyTarget: parseInt(e.target.value) || 0 
                }))}
                className="mt-1"
                min="1"
                max="50"
              />
            </div>
            
            <div>
              <Label htmlFor="preferred-location" className="block text-sm font-medium text-gray-700">
                Preferred Location
              </Label>
              <Select 
                value={localSettings.preferredLocation} 
                onValueChange={(value) => setLocalSettings(prev => ({ 
                  ...prev, 
                  preferredLocation: value 
                }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Remote">Remote</SelectItem>
                  <SelectItem value="New York">New York</SelectItem>
                  <SelectItem value="San Francisco">San Francisco</SelectItem>
                  <SelectItem value="Los Angeles">Los Angeles</SelectItem>
                  <SelectItem value="Chicago">Chicago</SelectItem>
                  <SelectItem value="Any">Any Location</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="min-pay-rate" className="block text-sm font-medium text-gray-700">
                Min. Pay Rate ($/hour)
              </Label>
              <Input
                id="min-pay-rate"
                type="number"
                value={localSettings.minPayRate}
                onChange={(e) => setLocalSettings(prev => ({ 
                  ...prev, 
                  minPayRate: parseInt(e.target.value) || 0 
                }))}
                className="mt-1"
                min="0"
                step="5"
              />
            </div>
          </div>
          
          <Button 
            onClick={handleSave} 
            className="w-full"
            disabled={saveSettingsMutation.isPending}
          >
            {saveSettingsMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
