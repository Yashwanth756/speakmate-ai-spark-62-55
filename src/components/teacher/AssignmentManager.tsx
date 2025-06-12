
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Copy, 
  Clock,
  Users,
  BookOpen,
  Zap,
  Puzzle
} from "lucide-react";
import { useAssignments, Assignment } from "@/contexts/AssignmentContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface AssignmentManagerProps {
  selectedClass: string;
  selectedSection: string;
}

export const AssignmentManager: React.FC<AssignmentManagerProps> = ({
  selectedClass,
  selectedSection
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    assignments, 
    createAssignment, 
    updateAssignment, 
    deleteAssignment,
    getAssignmentsForTeacher,
    getProgressForAssignment
  } = useAssignments();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newAssignment, setNewAssignment] = useState({
    type: 'reflex' as 'reflex' | 'story' | 'puzzle',
    title: '',
    content: '',
    dueDate: '',
    metadata: {}
  });

  const teacherAssignments = getAssignmentsForTeacher(user?.classes || [], user?.sections || []);
  const filteredAssignments = teacherAssignments.filter(assignment =>
    (!selectedClass || selectedClass === 'all-classes' || assignment.targetClass === selectedClass) &&
    (!selectedSection || selectedSection === 'all-sections' || assignment.targetSection === selectedSection)
  );

  const handleCreateAssignment = () => {
    if (!newAssignment.title.trim() || !newAssignment.content.trim()) return;
    if (!selectedClass || selectedClass === 'all-classes' || !selectedSection || selectedSection === 'all-sections') {
      toast({
        title: "Selection Required",
        description: "Please select a specific class and section to create assignments.",
        variant: "destructive"
      });
      return;
    }

    createAssignment({
      ...newAssignment,
      targetClass: selectedClass,
      targetSection: selectedSection,
      createdBy: user?.fullName || 'Unknown Teacher',
      status: 'published'
    });

    toast({
      title: "Assignment Created!",
      description: `${newAssignment.title} has been assigned to ${selectedClass} - Section ${selectedSection}`,
    });

    setNewAssignment({
      type: 'reflex',
      title: '',
      content: '',
      dueDate: '',
      metadata: {}
    });
    setIsCreating(false);
  };

  const handleDeleteAssignment = (id: string, title: string) => {
    deleteAssignment(id);
    toast({
      title: "Assignment Deleted",
      description: `"${title}" has been removed.`,
    });
  };

  const handleCloneAssignment = (assignment: Assignment) => {
    if (!selectedClass || selectedClass === 'all-classes' || !selectedSection || selectedSection === 'all-sections') {
      toast({
        title: "Selection Required",
        description: "Please select a specific class and section to clone assignments.",
        variant: "destructive"
      });
      return;
    }

    createAssignment({
      ...assignment,
      title: `${assignment.title} (Copy)`,
      targetClass: selectedClass,
      targetSection: selectedSection,
      createdBy: user?.fullName || 'Unknown Teacher',
      status: 'published'
    });

    toast({
      title: "Assignment Cloned!",
      description: `Assignment copied to ${selectedClass} - Section ${selectedSection}`,
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'reflex': return <Zap className="h-4 w-4" />;
      case 'story': return <BookOpen className="h-4 w-4" />;
      case 'puzzle': return <Puzzle className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Create New Assignment */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Assignment Manager
            </CardTitle>
            <Button onClick={() => setIsCreating(!isCreating)}>
              {isCreating ? 'Cancel' : 'Create New'}
            </Button>
          </div>
        </CardHeader>
        {isCreating && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Assignment Type</Label>
                <Select 
                  value={newAssignment.type} 
                  onValueChange={(value: 'reflex' | 'story' | 'puzzle') => 
                    setNewAssignment(prev => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reflex">Reflex Challenge</SelectItem>
                    <SelectItem value="story">Story Builder</SelectItem>
                    <SelectItem value="puzzle">Word Puzzle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Target Class</Label>
                <Input value={selectedClass === 'all-classes' ? '' : selectedClass} disabled />
              </div>
              <div>
                <Label>Target Section</Label>
                <Input value={selectedSection === 'all-sections' ? '' : `Section ${selectedSection}`} disabled />
              </div>
            </div>
            <div>
              <Label>Title</Label>
              <Input
                placeholder="Enter assignment title..."
                value={newAssignment.title}
                onChange={(e) => setNewAssignment(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <Label>Content</Label>
              <Textarea
                placeholder="Enter assignment content..."
                value={newAssignment.content}
                onChange={(e) => setNewAssignment(prev => ({ ...prev, content: e.target.value }))}
                rows={4}
              />
            </div>
            <div>
              <Label>Due Date (Optional)</Label>
              <Input
                type="datetime-local"
                value={newAssignment.dueDate}
                onChange={(e) => setNewAssignment(prev => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>
            <Button onClick={handleCreateAssignment} className="w-full">
              Create Assignment
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Assignments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Assignments ({filteredAssignments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Class/Section</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.map((assignment) => {
                  const progress = getProgressForAssignment(assignment.id);
                  const completedCount = progress.filter(p => p.status === 'completed').length;
                  
                  return (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(assignment.type)}
                          <span className="capitalize">{assignment.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{assignment.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {assignment.content.substring(0, 50)}...
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{assignment.targetClass} - {assignment.targetSection}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(assignment.status)}>
                          {assignment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{completedCount}/{progress.length || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {assignment.dueDate ? (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm">
                              {new Date(assignment.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No due date</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleCloneAssignment(assignment)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteAssignment(assignment.id, assignment.title)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
