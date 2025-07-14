import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Send, TrendingUp, Reply, DollarSign } from "lucide-react";

export default function StatsOverview() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-2 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const targetDailyApplications = 7;
  const progressPercentage = stats?.todayApplications ? (stats.todayApplications / targetDailyApplications) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card className="border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Applications Today</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.todayApplications || 0}</p>
            </div>
            <div className="h-12 w-12 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center">
              <Send className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Target: {targetDailyApplications}/day</span>
              <span className="text-gray-600">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Applied</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalApplications || 0}</p>
            </div>
            <div className="h-12 w-12 bg-secondary bg-opacity-10 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-secondary" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-secondary">
              {stats?.totalApplications && stats.totalApplications > 0 
                ? `+${Math.round(((stats.totalApplications - (stats.totalApplications - stats.todayApplications)) / (stats.totalApplications - stats.todayApplications)) * 100)}% from last week`
                : "Getting started..."
              }
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Response Rate</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.responseRate || 0}%</p>
            </div>
            <div className="h-12 w-12 bg-accent bg-opacity-10 rounded-lg flex items-center justify-center">
              <Reply className="h-6 w-6 text-accent" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-600">
              {stats?.totalResponses || 0} responses
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Weekly Earnings</p>
              <p className="text-2xl font-bold text-gray-900">${stats?.weeklyEarnings || 0}</p>
            </div>
            <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-600">Target: $200/day</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
