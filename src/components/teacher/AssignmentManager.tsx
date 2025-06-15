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
    getProgressForAssignment,
    markAssignmentAsRequired
  } = useAssignments();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newAssignment, setNewAssignment] = useState({
    type: 'reflex' as 'reflex' | 'story' | 'puzzle',
    title: '',
    content: '',
    dueDate: '',
    isRequired: true,
    metadata: {}
  });

  // Additional state for puzzle word input (just for clarity & better UX)
  const [puzzleWordInput, setPuzzleWordInput] = useState('');
  const [puzzleWords, setPuzzleWords] = useState<string[]>([]);

  // Add quiz-specific state
  const [quizTimer, setQuizTimer] = useState(60); // seconds
  const [quizQuestions, setQuizQuestions] = useState([{ question: '', answer: '' }]);

  // Reset form when type changes (for clarity)
  const handleAssignmentTypeChange = (type: 'reflex' | 'story' | 'puzzle' | 'quick_quiz') => {
    setNewAssignment({
      type,
      title: '',
      content: '',
      dueDate: '',
      isRequired: true,
      metadata: {}
    });
    if (type === 'puzzle') {
      setPuzzleWords([]);
      setPuzzleWordInput('');
    }
    if (type === 'quick_quiz') {
      setQuizQuestions([{ question: '', answer: '' }]);
      setQuizTimer(60);
    }
  };

  const teacherAssignments = getAssignmentsForTeacher(user?.classes || [], user?.sections || []);
  const filteredAssignments = teacherAssignments.filter(assignment =>
    (!selectedClass || selectedClass === 'all-classes' || assignment.targetClass === selectedClass) &&
    (!selectedSection || selectedSection === 'all-sections' || assignment.targetSection === selectedSection)
  );

  const handleCreateAssignment = () => {
    // Validation per type:
    if (newAssignment.type === 'quick_quiz') {
      if (!newAssignment.title.trim() || quizQuestions.length === 0 || quizQuestions.some(q => !q.question.trim() || !q.answer.trim())) {
        toast({
          title: "Quiz Incomplete",
          description: "Please provide the quiz title and all questions and answers.",
          variant: "destructive"
        });
        return;
      }
    } else {
      if (!newAssignment.title.trim() && newAssignment.type !== 'puzzle') return;
      if (newAssignment.type === 'reflex' && !newAssignment.content.trim()) return;
      if (newAssignment.type === 'story' && (!newAssignment.title.trim() || !newAssignment.content.trim())) return;
      if (newAssignment.type === 'puzzle' && puzzleWords.length === 0) return;
    }

    if (!selectedClass || selectedClass === 'all-classes' || !selectedSection || selectedSection === 'all-sections') {
      toast({
        title: "Selection Required",
        description: "Please select a specific class and section to create assignments.",
        variant: "destructive"
      });
      return;
    }

    let assignmentToCreate: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>;

    if (newAssignment.type === 'puzzle') {
      assignmentToCreate = {
        ...newAssignment,
        title: newAssignment.title || 'Word Puzzle',
        content: newAssignment.content || 'Word puzzle assignment',
        targetClass: selectedClass,
        targetSection: selectedSection,
        createdBy: user?.fullName || 'Unknown Teacher',
        status: "published",
        metadata: { ...newAssignment.metadata, words: puzzleWords }
      };
    } else if (newAssignment.type === 'story') {
      assignmentToCreate = {
        ...newAssignment,
        targetClass: selectedClass,
        targetSection: selectedSection,
        createdBy: user?.fullName || 'Unknown Teacher',
        status: "published",
        metadata: {}
      };
    } else if (newAssignment.type === 'reflex') {
      assignmentToCreate = {
        ...newAssignment,
        title: newAssignment.title || 'Reflex Challenge',
        targetClass: selectedClass,
        targetSection: selectedSection,
        createdBy: user?.fullName || 'Unknown Teacher',
        status: "published",
        metadata: {}
      };
    } else if (newAssignment.type === 'quick_quiz') {
      assignmentToCreate = {
        ...newAssignment,
        targetClass: selectedClass,
        targetSection: selectedSection,
        createdBy: user?.fullName || 'Unknown Teacher',
        status: "published",
        metadata: {
          quizTimer,
          questions: quizQuestions
        }
      };
    }

    createAssignment(assignmentToCreate);

    toast({
      title: "Assignment Created!",
      description: `${assignmentToCreate.title} has been assigned to ${selectedClass} - Section ${selectedSection}`,
    });

    setNewAssignment({
      type: newAssignment.type,
      title: '',
      content: '',
      dueDate: '',
      isRequired: true,
      metadata: {}
    });
    setPuzzleWords([]);
    setPuzzleWordInput('');
    setIsCreating(false);
    setQuizQuestions([{ question: '', answer: '' }]);
    setQuizTimer(60);
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
      case 'quick_quiz': return <BookOpen className="h-4 w-4" />;
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

  const handleToggleRequired = (assignmentId: string, currentStatus: boolean) => {
    markAssignmentAsRequired(assignmentId, !currentStatus);
    toast({
      title: "Assignment Updated",
      description: `Assignment ${!currentStatus ? 'marked as required' : 'no longer required'}`,
    });
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
                  onValueChange={(value: any) => handleAssignmentTypeChange(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reflex">Reflex Challenge</SelectItem>
                    <SelectItem value="story">Story Builder</SelectItem>
                    <SelectItem value="puzzle">Word Puzzle</SelectItem>
                    <SelectItem value="quick_quiz">Quick Quiz</SelectItem>
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

            {/* Conditional Quick Quiz form */}
            {newAssignment.type === 'quick_quiz' && (
              <div className="space-y-4">
                <div>
                  <Label>Quiz Title</Label>
                  <Input
                    placeholder="Enter quiz title..."
                    value={newAssignment.title}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Quiz Instructions (optional)</Label>
                  <Textarea
                    placeholder="Brief instructions for students..."
                    value={newAssignment.content}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, content: e.target.value }))}
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Timer (seconds)</Label>
                    <Input
                      type="number"
                      min={10}
                      max={3600}
                      value={quizTimer}
                      onChange={e => setQuizTimer(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Number of Questions</Label>
                    <Input
                      type="number"
                      min={1}
                      value={quizQuestions.length}
                      onChange={e => {
                        const val = Math.max(1, Number(e.target.value));
                        setQuizQuestions(arr => {
                          if (val > arr.length) {
                            // Add blanks
                            return arr.concat(Array(val - arr.length).fill({ question: '', answer: '' }));
                          } else if (val < arr.length) {
                            // Truncate
                            return arr.slice(0, val);
                          }
                          return arr;
                        });
                      }}
                    />
                  </div>
                </div>
                <div>
                  <Label>Questions & Answers</Label>
                  <div className="space-y-3">
                    {quizQuestions.map((q, idx) => (
                      <div key={idx} className="flex flex-col md:flex-row gap-2 items-center">
                        <Input
                          className="flex-1"
                          placeholder={`Question ${idx + 1}`}
                          value={q.question}
                          onChange={e => setQuizQuestions(arr => {
                            const updated = [...arr];
                            updated[idx].question = e.target.value;
                            return updated;
                          })}
                        />
                        <Input
                          className="flex-1"
                          placeholder="Answer"
                          value={q.answer}
                          onChange={e => setQuizQuestions(arr => {
                            const updated = [...arr];
                            updated[idx].answer = e.target.value;
                            return updated;
                          })}
                        />
                        {quizQuestions.length > 1 && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setQuizQuestions(arr => arr.filter((_, i) => i !== idx))}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="mt-2"
                    variant="outline"
                    onClick={() => setQuizQuestions(arr => [...arr, { question: '', answer: '' }])}
                  >
                    Add Question
                  </Button>
                </div>
              </div>
            )}

            {/* Existing dynamic forms for other types */}
            {newAssignment.type === 'reflex' && (
              <>
                <div>
                  <Label>Challenge Title</Label>
                  <Input
                    placeholder="Enter challenge title..."
                    value={newAssignment.title}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Challenge Question</Label>
                  <Textarea
                    placeholder="Enter the reflex challenge question..."
                    value={newAssignment.content}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, content: e.target.value }))}
                    rows={3}
                  />
                </div>
              </>
            )}
            {newAssignment.type === 'story' && (
              <>
                <div>
                  <Label>Story Title</Label>
                  <Input
                    placeholder="Enter story title..."
                    value={newAssignment.title}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Story Content</Label>
                  <Textarea
                    placeholder="Write your story here..."
                    value={newAssignment.content}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, content: e.target.value }))}
                    rows={5}
                  />
                </div>
              </>
            )}
            {newAssignment.type === 'puzzle' && (
              <>
                <div>
                  <Label>Puzzle Title (optional)</Label>
                  <Input
                    placeholder="Enter puzzle title..."
                    value={newAssignment.title}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Puzzle Description (optional)</Label>
                  <Textarea
                    placeholder="Describe the puzzle/challenge (optional)..."
                    value={newAssignment.content}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, content: e.target.value }))}
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Words for Puzzle</Label>
                  <div className="flex flex-col gap-1">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add word"
                        value={puzzleWordInput}
                        onChange={(e) => setPuzzleWordInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && puzzleWordInput.trim()) {
                            e.preventDefault();
                            if (!puzzleWords.includes(puzzleWordInput.trim())) {
                              setPuzzleWords([...puzzleWords, puzzleWordInput.trim()]);
                            }
                            setPuzzleWordInput('');
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          if (puzzleWordInput.trim() && !puzzleWords.includes(puzzleWordInput.trim())) {
                            setPuzzleWords([...puzzleWords, puzzleWordInput.trim()]);
                          }
                          setPuzzleWordInput('');
                        }}
                        size="sm"
                        variant="outline"
                      >
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {puzzleWords.map(word => (
                        <span key={word} className="bg-blue-100 text-blue-800 rounded px-2 py-0.5 text-xs flex items-center gap-1">
                          {word}
                          <button
                            type="button"
                            className="ml-1 text-red-500 hover:text-red-700"
                            onClick={() => setPuzzleWords(puzzleWords.filter(w => w !== word))}
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
            {/* Shared fields */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label>Due Date (Optional)</Label>
                <Input
                  type="datetime-local"
                  value={newAssignment.dueDate}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="required"
                  checked={newAssignment.isRequired}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, isRequired: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="required">Required Assignment</Label>
              </div>
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
                  <TableHead>Required</TableHead>
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
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={assignment.isRequired || false}
                            onChange={() => handleToggleRequired(assignment.id, assignment.isRequired || false)}
                            className="rounded"
                          />
                          <span className="text-sm">
                            {assignment.isRequired ? 'Required' : 'Optional'}
                          </span>
                        </div>
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
