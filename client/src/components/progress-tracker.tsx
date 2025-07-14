import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, Circle } from "lucide-react";

export default function ProgressTracker() {
  const { data: weeklyStats = [], isLoading } = useQuery({
    queryKey: ["/api/stats/weekly"],
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const { data: settings } = useQuery({
    queryKey: ["/api/settings"],
  });

  const dailyTarget = settings?.dailyTarget || 7;
  const today = new Date().toISOString().split('T')[0];
  
  // Create a 7-day progress array
  const weekProgress = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toISOString().split('T')[0];
    
    const stat = weeklyStats.find((s: any) => s.date === dateStr);
    const applicationsCount = stat?.applicationsCount || 0;
    const isToday = dateStr === today;
    const isComplete = applicationsCount >= dailyTarget;
    const isPartial = applicationsCount > 0 && applicationsCount < dailyTarget;
    
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'long' }),
      date: dateStr,
      applications: applicationsCount,
      target: dailyTarget,
      isToday,
      isComplete,
      isPartial,
      isPast: date < new Date(today),
    };
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weekly Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="h-8 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {weekProgress.map((day) => (
            <div key={day.date} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  day.isComplete ? 'bg-green-500' : 
                  day.isPartial ? 'bg-yellow-500' : 
                  'bg-gray-300'
                }`}></div>
                <span className={`text-sm font-medium ${
                  day.isToday ? 'text-primary' : 
                  day.isComplete ? 'text-gray-700' : 
                  'text-gray-500'
                }`}>
                  {day.day}
                  {day.isToday && ' (Today)'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-sm ${
                  day.isComplete ? 'text-green-600' : 
                  day.isPartial ? 'text-yellow-600' : 
                  'text-gray-500'
                }`}>
                  {day.applications}/{day.target}
                </span>
                {day.isComplete ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : day.isPartial ? (
                  <Clock className="h-4 w-4 text-yellow-500" />
                ) : (
                  <Circle className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Weekly Goal:</span>
            <span className="font-medium text-gray-900">
              {weekProgress.reduce((sum, day) => sum + day.applications, 0)} / {dailyTarget * 7}
            </span>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-500"
              style={{ 
                width: `${Math.min(100, (weekProgress.reduce((sum, day) => sum + day.applications, 0) / (dailyTarget * 7)) * 100)}%` 
              }}
            ></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
