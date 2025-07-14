import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import NavigationHeader from "@/components/navigation-header";
import StatsOverview from "@/components/stats-overview";
import ApplicationsTable from "@/components/applications-table";
import EmailPanel from "@/components/email-panel";
import AutoApplyControls from "@/components/auto-apply-controls";
import ProgressTracker from "@/components/progress-tracker";
import QuickActions from "@/components/quick-actions";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

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
