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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Mail, Edit, Trash2, Users, Send } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import type { Contact } from "@shared/schema";

export default function Contacts() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  
  const [showAddContact, setShowAddContact] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [showEmailCampaign, setShowEmailCampaign] = useState(false);
  
  const [newContact, setNewContact] = useState({
    name: "",
    email: "",
    company: "",
    jobTitle: "",
    industry: "",
    notes: "",
    tags: [] as string[],
  });

  const [emailCampaign, setEmailCampaign] = useState({
    name: "",
    subject: "",
    template: "",
  });

  const { data: contacts = [], isLoading: contactsLoading } = useQuery({
    queryKey: ["/api/contacts"],
    enabled: isAuthenticated,
  });

  const { data: resumeTemplates = [] } = useQuery({
    queryKey: ["/api/resume-templates"],
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

  const addContactMutation = useMutation({
    mutationFn: async (contact: typeof newContact) => {
      await apiRequest("POST", "/api/contacts", contact);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      setShowAddContact(false);
      setNewContact({
        name: "",
        email: "",
        company: "",
        jobTitle: "",
        industry: "",
        notes: "",
        tags: [],
      });
      toast({
        title: "Contact Added",
        description: "Contact has been added successfully.",
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
        description: "Failed to add contact. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/contacts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({
        title: "Contact Deleted",
        description: "Contact has been deleted successfully.",
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
        description: "Failed to delete contact. Please try again.",
        variant: "destructive",
      });
    },
  });

  const sendEmailCampaignMutation = useMutation({
    mutationFn: async (campaign: typeof emailCampaign & { contactIds: number[] }) => {
      await apiRequest("POST", "/api/email-campaigns", campaign);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-campaigns"] });
      setShowEmailCampaign(false);
      setSelectedContacts([]);
      setEmailCampaign({
        name: "",
        subject: "",
        template: "",
      });
      toast({
        title: "Email Campaign Created",
        description: "Email campaign has been created and will be sent.",
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
        description: "Failed to create email campaign. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddContact = () => {
    if (!newContact.name || !newContact.email) {
      toast({
        title: "Missing Information",
        description: "Please provide at least name and email.",
        variant: "destructive",
      });
      return;
    }
    
    addContactMutation.mutate(newContact);
  };

  const handleDeleteContact = (id: number) => {
    if (confirm("Are you sure you want to delete this contact?")) {
      deleteContactMutation.mutate(id);
    }
  };

  const handleSelectContact = (id: number) => {
    setSelectedContacts(prev => 
      prev.includes(id) 
        ? prev.filter(contactId => contactId !== id)
        : [...prev, id]
    );
  };

  const handleSendEmailCampaign = () => {
    if (!emailCampaign.subject || !emailCampaign.template || selectedContacts.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please provide subject, template, and select at least one contact.",
        variant: "destructive",
      });
      return;
    }
    
    sendEmailCampaignMutation.mutate({
      ...emailCampaign,
      contactIds: selectedContacts,
    });
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
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <div className="flex gap-2">
            <Dialog open={showEmailCampaign} onOpenChange={setShowEmailCampaign}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  disabled={selectedContacts.length === 0}
                  className="flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  Send Resume ({selectedContacts.length})
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Send Resume Campaign</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="campaign-name">Campaign Name</Label>
                    <Input
                      id="campaign-name"
                      value={emailCampaign.name}
                      onChange={(e) => setEmailCampaign(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., January Resume Outreach"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="subject">Email Subject</Label>
                    <Input
                      id="subject"
                      value={emailCampaign.subject}
                      onChange={(e) => setEmailCampaign(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="e.g., Application for [Job Title] Position"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="template">Email Template</Label>
                    <Textarea
                      id="template"
                      value={emailCampaign.template}
                      onChange={(e) => setEmailCampaign(prev => ({ ...prev, template: e.target.value }))}
                      placeholder="Dear [Name], I hope this email finds you well..."
                      rows={6}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowEmailCampaign(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSendEmailCampaign}
                      disabled={sendEmailCampaignMutation.isPending}
                    >
                      {sendEmailCampaignMutation.isPending ? "Sending..." : "Send Campaign"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Contact
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Contact</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={newContact.name}
                      onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="John Doe"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newContact.email}
                      onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="john.doe@company.com"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={newContact.company}
                      onChange={(e) => setNewContact(prev => ({ ...prev, company: e.target.value }))}
                      placeholder="TechCorp Inc."
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="jobTitle">Job Title</Label>
                    <Input
                      id="jobTitle"
                      value={newContact.jobTitle}
                      onChange={(e) => setNewContact(prev => ({ ...prev, jobTitle: e.target.value }))}
                      placeholder="HR Manager"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <Input
                      id="industry"
                      value={newContact.industry}
                      onChange={(e) => setNewContact(prev => ({ ...prev, industry: e.target.value }))}
                      placeholder="Technology"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={newContact.notes}
                      onChange={(e) => setNewContact(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional notes about this contact..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowAddContact(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleAddContact}
                      disabled={addContactMutation.isPending}
                    >
                      {addContactMutation.isPending ? "Adding..." : "Add Contact"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Your Contacts ({contacts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contactsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600">Loading contacts...</p>
              </div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No contacts yet</p>
                <Button onClick={() => setShowAddContact(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Contact
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Select</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Job Title</TableHead>
                      <TableHead>Industry</TableHead>
                      <TableHead>Last Contact</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contacts.map((contact: Contact) => (
                      <TableRow key={contact.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedContacts.includes(contact.id)}
                            onChange={() => handleSelectContact(contact.id)}
                            className="rounded border-gray-300"
                          />
                        </TableCell>
                        <TableCell className="font-medium">{contact.name}</TableCell>
                        <TableCell>{contact.email}</TableCell>
                        <TableCell>{contact.company || "-"}</TableCell>
                        <TableCell>{contact.jobTitle || "-"}</TableCell>
                        <TableCell>{contact.industry || "-"}</TableCell>
                        <TableCell>
                          {contact.lastContacted 
                            ? new Date(contact.lastContacted).toLocaleDateString()
                            : "Never"
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteContact(contact.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}