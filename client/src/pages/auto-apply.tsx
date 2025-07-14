import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import NavigationHeader from "@/components/navigation-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Pause, Settings, Target, TrendingUp, Clock, Filter, Plus, X } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";

export default function AutoApply() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  
  const [autoApplyEnabled, setAutoApplyEnabled] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [newKeyword, setNewKeyword] = useState("");
  
  const [settings, setSettings] = useState({
    dailyTarget: 7,
    minPayRate: 50,
    maxPayRate: 200,
    interviewFreeOnly: true,
    preferredJobTypes: ['contract', 'freelance'],
    userSkills: [] as string[],
    excludeKeywords: [] as string[],
    includeKeywords: [] as string[],
    preferredLocation: 'Remote',
    autoApplyDelay: 30, // seconds between applications
    maxDailyApplications: 10,
    enableSmartFiltering: true,
    requirementMatchThreshold: 60, // percentage
  });

  const { data: userSettings } = useQuery({
    queryKey: ["/api/settings"],
    enabled: isAuthenticated,
  });

  const { data: recentApplications = [] } = useQuery({
    queryKey: ["/api/applications"],
    enabled: isAuthenticated,
  });

  const { data: todayStats } = useQuery({
    queryKey: ["/api/stats/today"],
    enabled: isAuthenticated,
  });

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

  useEffect(() => {
    if (userSettings) {
      setSettings({
        ...settings,
        dailyTarget: userSettings.dailyTarget || 7,
        minPayRate: userSettings.minPayRate || 50,
        interviewFreeOnly: userSettings.interviewFreeOnly || true,
        preferredJobTypes: userSettings.preferredJobTypes || ['contract', 'freelance'],
        userSkills: userSettings.userSkills || [],
        preferredLocation: userSettings.preferredLocation || 'Remote',
      });
      setAutoApplyEnabled(userSettings.autoApplyEnabled || false);
    }
  }, [userSettings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<typeof settings>) => {
      await apiRequest("PUT", "/api/settings", newSettings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Settings Updated",
        description: "Your auto-apply settings have been saved.",
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
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleAutoApplyMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      await apiRequest("POST", "/api/auto-apply/toggle", { enabled });
    },
    onSuccess: (_, enabled) => {
      setAutoApplyEnabled(enabled);
      setIsRunning(enabled);
      toast({
        title: enabled ? "Auto-Apply Started" : "Auto-Apply Stopped",
        description: enabled ? "System is now searching for and applying to jobs." : "Auto-apply has been disabled.",
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
        description: "Failed to toggle auto-apply. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate(settings);
  };

  const handleToggleAutoApply = () => {
    toggleAutoApplyMutation.mutate(!autoApplyEnabled);
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !settings.userSkills.includes(newSkill.trim())) {
      setSettings(prev => ({
        ...prev,
        userSkills: [...prev.userSkills, newSkill.trim()]
      }));
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSettings(prev => ({
      ...prev,
      userSkills: prev.userSkills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleAddKeyword = (type: 'include' | 'exclude') => {
    if (newKeyword.trim()) {
      const keywordList = type === 'include' ? 'includeKeywords' : 'excludeKeywords';
      if (!settings[keywordList].includes(newKeyword.trim())) {
        setSettings(prev => ({
          ...prev,
          [keywordList]: [...prev[keywordList], newKeyword.trim()]
        }));
        setNewKeyword("");
      }
    }
  };

  const handleRemoveKeyword = (keywordToRemove: string, type: 'include' | 'exclude') => {
    const keywordList = type === 'include' ? 'includeKeywords' : 'excludeKeywords';
    setSettings(prev => ({
      ...prev,
      [keywordList]: prev[keywordList].filter(keyword => keyword !== keywordToRemove)
    }));
  };

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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Auto-Apply System</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={autoApplyEnabled}
                onCheckedChange={handleToggleAutoApply}
                disabled={toggleAutoApplyMutation.isPending}
              />
              <Label className="text-sm font-medium">
                {autoApplyEnabled ? "Enabled" : "Disabled"}
              </Label>
            </div>
            <Button
              onClick={handleToggleAutoApply}
              disabled={toggleAutoApplyMutation.isPending}
              variant={autoApplyEnabled ? "destructive" : "default"}
              className="flex items-center gap-2"
            >
              {autoApplyEnabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {autoApplyEnabled ? "Stop Auto-Apply" : "Start Auto-Apply"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Today's Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {todayStats?.applicationsCount || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Target: {settings.dailyTarget} applications
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {todayStats?.responseRate || 0}%
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {todayStats?.totalResponses || 0} responses received
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="text-sm font-medium">
                  {isRunning ? "Running" : "Stopped"}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {isRunning ? "Actively searching for jobs" : "Not currently applying"}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="settings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="filters">Filters</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Auto-Apply Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="daily-target">Daily Application Target</Label>
                      <Input
                        id="daily-target"
                        type="number"
                        value={settings.dailyTarget}
                        onChange={(e) => setSettings(prev => ({ ...prev, dailyTarget: parseInt(e.target.value) || 7 }))}
                        min="1"
                        max="20"
                      />
                    </div>

                    <div>
                      <Label htmlFor="min-pay">Minimum Pay Rate ($/hour)</Label>
                      <Input
                        id="min-pay"
                        type="number"
                        value={settings.minPayRate}
                        onChange={(e) => setSettings(prev => ({ ...prev, minPayRate: parseInt(e.target.value) || 50 }))}
                        min="10"
                      />
                    </div>

                    <div>
                      <Label htmlFor="max-pay">Maximum Pay Rate ($/hour)</Label>
                      <Input
                        id="max-pay"
                        type="number"
                        value={settings.maxPayRate}
                        onChange={(e) => setSettings(prev => ({ ...prev, maxPayRate: parseInt(e.target.value) || 200 }))}
                        min="10"
                      />
                    </div>

                    <div>
                      <Label htmlFor="location">Preferred Location</Label>
                      <Select value={settings.preferredLocation} onValueChange={(value) => setSettings(prev => ({ ...prev, preferredLocation: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Remote">Remote</SelectItem>
                          <SelectItem value="United States">United States</SelectItem>
                          <SelectItem value="Canada">Canada</SelectItem>
                          <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                          <SelectItem value="Australia">Australia</SelectItem>
                          <SelectItem value="Anywhere">Anywhere</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="interview-free"
                        checked={settings.interviewFreeOnly}
                        onCheckedChange={(checked) => setSettings(prev => ({ ...prev, interviewFreeOnly: checked }))}
                      />
                      <Label htmlFor="interview-free">Interview-free jobs only</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="smart-filtering"
                        checked={settings.enableSmartFiltering}
                        onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableSmartFiltering: checked }))}
                      />
                      <Label htmlFor="smart-filtering">Enable smart filtering</Label>
                    </div>

                    <div>
                      <Label htmlFor="apply-delay">Delay between applications (seconds)</Label>
                      <Input
                        id="apply-delay"
                        type="number"
                        value={settings.autoApplyDelay}
                        onChange={(e) => setSettings(prev => ({ ...prev, autoApplyDelay: parseInt(e.target.value) || 30 }))}
                        min="10"
                        max="300"
                      />
                    </div>

                    <div>
                      <Label htmlFor="match-threshold">Requirement match threshold (%)</Label>
                      <Input
                        id="match-threshold"
                        type="number"
                        value={settings.requirementMatchThreshold}
                        onChange={(e) => setSettings(prev => ({ ...prev, requirementMatchThreshold: parseInt(e.target.value) || 60 }))}
                        min="30"
                        max="100"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Your Skills</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {settings.userSkills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="cursor-pointer">
                        {skill}
                        <button
                          onClick={() => handleRemoveSkill(skill)}
                          className="ml-2 text-red-500 hover:text-red-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a skill..."
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                    />
                    <Button onClick={handleAddSkill} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveSettings}
                    disabled={updateSettingsMutation.isPending}
                  >
                    {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="filters">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Job Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Include Keywords</Label>
                    <p className="text-sm text-gray-600 mb-2">Jobs must contain these keywords</p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {settings.includeKeywords.map((keyword, index) => (
                        <Badge key={index} variant="default" className="cursor-pointer">
                          {keyword}
                          <button
                            onClick={() => handleRemoveKeyword(keyword, 'include')}
                            className="ml-2 text-red-500 hover:text-red-700"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add keyword to include..."
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword('include')}
                      />
                      <Button onClick={() => handleAddKeyword('include')} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label>Exclude Keywords</Label>
                    <p className="text-sm text-gray-600 mb-2">Skip jobs containing these keywords</p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {settings.excludeKeywords.map((keyword, index) => (
                        <Badge key={index} variant="destructive" className="cursor-pointer">
                          {keyword}
                          <button
                            onClick={() => handleRemoveKeyword(keyword, 'exclude')}
                            className="ml-2 text-white hover:text-gray-200"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add keyword to exclude..."
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword('exclude')}
                      />
                      <Button onClick={() => handleAddKeyword('exclude')} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveSettings}
                    disabled={updateSettingsMutation.isPending}
                  >
                    {updateSettingsMutation.isPending ? "Saving..." : "Save Filters"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentApplications.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No recent applications</p>
                    <p className="text-sm text-gray-400 mt-2">Start auto-apply to see activity here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentApplications.slice(0, 10).map((application: any) => (
                      <div key={application.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-medium">{application.title}</h4>
                          <p className="text-sm text-gray-600">{application.company}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Applied {new Date(application.appliedAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={application.status === 'pending' ? 'default' : 'secondary'}>
                            {application.status}
                          </Badge>
                          <p className="text-sm text-gray-600 mt-1">
                            ${application.payRate}/hr
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}