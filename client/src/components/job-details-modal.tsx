import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Mail, ExternalLink, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import type { JobApplication, EmailTracking } from "@shared/schema";

interface JobDetailsModalProps {
  application: JobApplication;
  onClose: () => void;
}

export default function JobDetailsModal({ application, onClose }: JobDetailsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [replyMessage, setReplyMessage] = useState("");
  const [showReplyForm, setShowReplyForm] = useState(false);

  const { data: emails = [] } = useQuery({
    queryKey: ["/api/emails/job", application.id],
    enabled: !!application.id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      await apiRequest("PUT", `/api/applications/${application.id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Status Updated",
        description: "Application status has been updated.",
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
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleReply = () => {
    if (!replyMessage.trim()) {
      toast({
        title: "Empty Message",
        description: "Please write a message before sending.",
        variant: "destructive",
      });
      return;
    }
    
    // In a real app, this would send the email
    toast({
      title: "Reply Feature Coming Soon",
      description: "Email reply functionality will be implemented soon.",
    });
    setShowReplyForm(false);
    setReplyMessage("");
  };

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

  const getEmailCategoryBadge = (category: string | null) => {
    if (!category) return null;
    
    const categoryConfig = {
      positive: { className: "bg-green-100 text-green-800" },
      negative: { className: "bg-red-100 text-red-800" },
      interview: { className: "bg-purple-100 text-purple-800" },
      offer: { className: "bg-blue-100 text-blue-800" },
      'follow-up': { className: "bg-yellow-100 text-yellow-800" },
    };

    const config = categoryConfig[category as keyof typeof categoryConfig] || 
                   { className: "bg-gray-100 text-gray-800" };
    
    return (
      <Badge variant="outline" className={config.className}>
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </Badge>
    );
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <DialogTitle>Application Details</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Job Title</Label>
              <p className="mt-1 text-sm text-gray-900">{application.title}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700">Company</Label>
              <p className="mt-1 text-sm text-gray-900">{application.company}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700">Platform</Label>
              <p className="mt-1 text-sm text-gray-900">{application.platform}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700">Pay Rate</Label>
              <p className="mt-1 text-sm text-gray-900">{application.payRate || "Not specified"}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700">Location</Label>
              <p className="mt-1 text-sm text-gray-900">{application.location || "Not specified"}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700">Applied Date</Label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(application.appliedAt || "").toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Status Update */}
          <div>
            <Label className="text-sm font-medium text-gray-700">Application Status</Label>
            <div className="mt-2 flex items-center gap-4">
              {getStatusBadge(application.status)}
              <Select
                value={application.status}
                onValueChange={(value) => updateStatusMutation.mutate(value)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="responded">Responded</SelectItem>
                  <SelectItem value="interview">Interview</SelectItem>
                  <SelectItem value="offer">Offer</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Job Description */}
          {application.description && (
            <div>
              <Label className="text-sm font-medium text-gray-700">Job Description</Label>
              <div className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                {application.description}
              </div>
            </div>
          )}

          {/* Job URL */}
          {application.url && (
            <div>
              <Label className="text-sm font-medium text-gray-700">Job URL</Label>
              <div className="mt-1">
                <a 
                  href={application.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  View Original Job Posting
                </a>
              </div>
            </div>
          )}

          {/* Email Thread */}
          <div>
            <Label className="text-sm font-medium text-gray-700">Email Thread</Label>
            <div className="mt-2 space-y-2">
              {emails.length === 0 ? (
                <p className="text-sm text-gray-500">No emails found for this application.</p>
              ) : (
                emails.map((email: EmailTracking) => (
                  <Card key={email.id} className="p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{email.subject}</div>
                        <div className="text-xs text-gray-500">
                          {email.sender} • {new Date(email.receivedAt).toLocaleString()}
                        </div>
                      </div>
                      {email.category && getEmailCategoryBadge(email.category)}
                    </div>
                    {email.content && (
                      <div className="text-sm text-gray-700 mt-2 line-clamp-3">
                        {email.content}
                      </div>
                    )}
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Reply Form */}
          {showReplyForm && (
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">Reply Message</Label>
              <Textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Write your reply..."
                rows={4}
              />
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowReplyForm(false);
                    setReplyMessage("");
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleReply}>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Reply
                </Button>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {!showReplyForm && (
            <Button onClick={() => setShowReplyForm(true)}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Reply to Email
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
