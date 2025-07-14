import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Download, Filter, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import type { JobApplication } from "@shared/schema";

interface ApplicationsTableProps {
  applications?: JobApplication[];
  onSelectApplication?: (application: JobApplication) => void;
  isLoading?: boolean;
}

export default function ApplicationsTable({ 
  applications: propApplications, 
  onSelectApplication,
  isLoading: propIsLoading 
}: ApplicationsTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: applications = [], isLoading: queryIsLoading } = useQuery({
    queryKey: ["/api/applications"],
    enabled: !propApplications, // Only fetch if not provided as prop
  });

  const isLoading = propIsLoading || queryIsLoading;
  const displayApplications = propApplications || applications;

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "outline" as const, className: "status-pending" },
      responded: { variant: "default" as const, className: "status-responded" },
      interview: { variant: "secondary" as const, className: "status-interview" },
      offer: { variant: "default" as const, className: "status-offer" },
      declined: { variant: "destructive" as const, className: "status-declined" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPlatformBadge = (platform: string) => {
    const platformConfig = {
      upwork: { className: "platform-upwork" },
      freelancer: { className: "platform-freelancer" },
      indeed: { className: "platform-indeed" },
      linkedin: { className: "platform-linkedin" },
      remote: { className: "platform-remote" },
    };

    const config = platformConfig[platform.toLowerCase() as keyof typeof platformConfig] || 
                   { className: "bg-gray-100 text-gray-800" };
    
    return (
      <Badge variant="outline" className={config.className}>
        {platform}
      </Badge>
    );
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/export/applications?format=csv', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'job_applications.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Successful",
        description: "Applications exported as CSV",
      });
    } catch (error) {
      if (error instanceof Error && isUnauthorizedError(error)) {
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
        title: "Export Failed",
        description: "Failed to export applications",
        variant: "destructive",
      });
    }
  };

  const formatTimeAgo = (date: Date | string) => {
    const now = new Date();
    const applicationDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - applicationDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Recent Applications</CardTitle>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {displayApplications.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No applications found</p>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add First Application
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayApplications.map((application) => (
                  <TableRow key={application.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {application.title}
                        </div>
                        {application.payRate && (
                          <div className="text-sm text-gray-500">
                            {application.payRate}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-900">
                      {application.company}
                    </TableCell>
                    <TableCell>
                      {getPlatformBadge(application.platform)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(application.status)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatTimeAgo(application.appliedAt || new Date())}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectApplication?.(application)}
                        className="p-2"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
