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
import { Plus, FileText, Edit, Trash2, Star, StarOff, Download } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import type { ResumeTemplate } from "@shared/schema";

export default function Resumes() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ResumeTemplate | null>(null);
  
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    industry: "",
    skills: [] as string[],
    content: "",
    isDefault: false,
  });

  const { data: templates = [], isLoading: templatesLoading } = useQuery({
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

  const addTemplateMutation = useMutation({
    mutationFn: async (template: typeof newTemplate) => {
      await apiRequest("POST", "/api/resume-templates", template);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resume-templates"] });
      setShowAddTemplate(false);
      setNewTemplate({
        name: "",
        industry: "",
        skills: [],
        content: "",
        isDefault: false,
      });
      toast({
        title: "Template Created",
        description: "Resume template has been created successfully.",
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
        description: "Failed to create template. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<ResumeTemplate> }) => {
      await apiRequest("PUT", `/api/resume-templates/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resume-templates"] });
      setEditingTemplate(null);
      toast({
        title: "Template Updated",
        description: "Resume template has been updated successfully.",
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
        description: "Failed to update template. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/resume-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resume-templates"] });
      toast({
        title: "Template Deleted",
        description: "Resume template has been deleted successfully.",
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
        description: "Failed to delete template. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddTemplate = () => {
    if (!newTemplate.name || !newTemplate.content) {
      toast({
        title: "Missing Information",
        description: "Please provide template name and content.",
        variant: "destructive",
      });
      return;
    }
    
    addTemplateMutation.mutate(newTemplate);
  };

  const handleUpdateTemplate = (updates: Partial<ResumeTemplate>) => {
    if (!editingTemplate) return;
    
    updateTemplateMutation.mutate({ id: editingTemplate.id, updates });
  };

  const handleDeleteTemplate = (id: number) => {
    if (confirm("Are you sure you want to delete this template?")) {
      deleteTemplateMutation.mutate(id);
    }
  };

  const handleToggleDefault = (template: ResumeTemplate) => {
    updateTemplateMutation.mutate({
      id: template.id,
      updates: { isDefault: !template.isDefault }
    });
  };

  const handleAddSkill = (skillInput: string, isEditing: boolean = false) => {
    const skill = skillInput.trim();
    if (!skill) return;
    
    if (isEditing && editingTemplate) {
      const newSkills = [...(editingTemplate.skills || []), skill];
      setEditingTemplate({ ...editingTemplate, skills: newSkills });
    } else {
      setNewTemplate(prev => ({ ...prev, skills: [...prev.skills, skill] }));
    }
  };

  const handleRemoveSkill = (skillToRemove: string, isEditing: boolean = false) => {
    if (isEditing && editingTemplate) {
      const newSkills = (editingTemplate.skills || []).filter(skill => skill !== skillToRemove);
      setEditingTemplate({ ...editingTemplate, skills: newSkills });
    } else {
      setNewTemplate(prev => ({ ...prev, skills: prev.skills.filter(skill => skill !== skillToRemove) }));
    }
  };

  const downloadTemplate = (template: ResumeTemplate) => {
    const blob = new Blob([template.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
          <h1 className="text-2xl font-bold text-gray-900">Resume Templates</h1>
          <Dialog open={showAddTemplate} onOpenChange={setShowAddTemplate}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Resume Template</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="template-name">Template Name *</Label>
                  <Input
                    id="template-name"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Software Developer Template"
                  />
                </div>
                
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={newTemplate.industry}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, industry: e.target.value }))}
                    placeholder="e.g., Technology, Healthcare"
                  />
                </div>
                
                <div>
                  <Label>Skills</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {newTemplate.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="cursor-pointer">
                        {skill}
                        <button
                          onClick={() => handleRemoveSkill(skill)}
                          className="ml-2 text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <Input
                    placeholder="Add a skill and press Enter"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddSkill(e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                </div>
                
                <div>
                  <Label htmlFor="content">Resume Content *</Label>
                  <Textarea
                    id="content"
                    value={newTemplate.content}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Enter your resume content here..."
                    rows={12}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is-default"
                    checked={newTemplate.isDefault}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, isDefault: e.target.checked }))}
                  />
                  <Label htmlFor="is-default">Set as default template</Label>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAddTemplate(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddTemplate}
                    disabled={addTemplateMutation.isPending}
                  >
                    {addTemplateMutation.isPending ? "Creating..." : "Create Template"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Your Resume Templates ({templates.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {templatesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600">Loading templates...</p>
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No resume templates yet</p>
                <Button onClick={() => setShowAddTemplate(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Template
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {templates.map((template: ResumeTemplate) => (
                  <Card key={template.id} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {template.name}
                            {template.isDefault && <Star className="h-4 w-4 text-yellow-500" />}
                          </CardTitle>
                          <p className="text-sm text-gray-600 mt-1">
                            {template.industry && `Industry: ${template.industry}`}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleDefault(template)}
                          >
                            {template.isDefault ? <StarOff className="h-4 w-4" /> : <Star className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadTemplate(template)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingTemplate(template)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTemplate(template.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {template.skills && template.skills.length > 0 && (
                        <div className="mb-3">
                          <div className="flex flex-wrap gap-1">
                            {template.skills.map((skill, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded max-h-32 overflow-y-auto">
                        {template.content.substring(0, 200)}...
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        Created: {new Date(template.createdAt).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Template Dialog */}
      {editingTemplate && (
        <Dialog open={true} onOpenChange={() => setEditingTemplate(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Resume Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Template Name</Label>
                <Input
                  id="edit-name"
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate(prev => ({ ...prev!, name: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-industry">Industry</Label>
                <Input
                  id="edit-industry"
                  value={editingTemplate.industry || ""}
                  onChange={(e) => setEditingTemplate(prev => ({ ...prev!, industry: e.target.value }))}
                />
              </div>
              
              <div>
                <Label>Skills</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(editingTemplate.skills || []).map((skill, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer">
                      {skill}
                      <button
                        onClick={() => handleRemoveSkill(skill, true)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
                <Input
                  placeholder="Add a skill and press Enter"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddSkill(e.currentTarget.value, true);
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-content">Resume Content</Label>
                <Textarea
                  id="edit-content"
                  value={editingTemplate.content}
                  onChange={(e) => setEditingTemplate(prev => ({ ...prev!, content: e.target.value }))}
                  rows={12}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-is-default"
                  checked={editingTemplate.isDefault}
                  onChange={(e) => setEditingTemplate(prev => ({ ...prev!, isDefault: e.target.checked }))}
                />
                <Label htmlFor="edit-is-default">Set as default template</Label>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setEditingTemplate(null)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleUpdateTemplate(editingTemplate)}
                  disabled={updateTemplateMutation.isPending}
                >
                  {updateTemplateMutation.isPending ? "Updating..." : "Update Template"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}