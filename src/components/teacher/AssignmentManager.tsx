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
const backend_url = import.meta.env.VITE_backend_url
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
  const [newAssignment, setNewAssignment] = useState<{
    type:  'word_scramble' | 'vocabulary_builder' | 'word_search',
    title: string,
    content: string,
    dueDate: string,
    isRequired: boolean,
    metadata: any
  }>({
    type: 'word_scramble',
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

  // Word Scramble specific state
  const [scrambleWords, setScrambleWords] = useState<Array<{word: string, difficulty: 'easy' | 'medium' | 'hard'}>>([]);
  const [newScrambleWord, setNewScrambleWord] = useState('');
  const [newScrambleDifficulty, setNewScrambleDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');

  // Vocabulary Builder specific state
  const [vocabularyWords, setVocabularyWords] = useState<Array<{
    word: string,
    definition: string,
    wrongDefinitions: string[],
    partOfSpeech: string,
    hint: string,
    example: string,
    difficulty?: 'easy' | 'medium' | 'hard'
  }>>([]);
  const [newVocabWord, setNewVocabWord] = useState({
    word: '',
    definition: '',
    wrongDefinitions: ['', '', ''],
    partOfSpeech: '',
    hint: '',
    example: '',
    difficulty: ''
  });

  // Word Search specific state
  const [wordSearchWords, setWordSearchWords] = useState<Array<{word: string, definition: string, difficulty:string}>>([]);
  const [newWordSearchWord, setNewWordSearchWord] = useState('');
  const [newWordSearchDefinition, setNewWordSearchDefinition] = useState('');
  const [newWordSearchDifficulty, setNewWordSearchDifficulty] = useState('');


  // Reset form when type changes (for clarity)
  const handleAssignmentTypeChange = (type: 'word_scramble' | 'vocabulary_builder' | 'word_search') => {
    setNewAssignment({
      type,
      title: '',
      content: '',
      dueDate: '',
      isRequired: true,
      metadata: {}
    });
    // if (type === 'puzzle') {
    //   setPuzzleWords([]);
    //   setPuzzleWordInput('');
    // }
    // if (type === 'quick_quiz') {
    //   setQuizQuestions([{ question: '', answer: '' }]);
    //   setQuizTimer(60);
    // }
    if (type === 'word_scramble') {
      setScrambleWords([]);
      setNewScrambleWord('');
      setNewScrambleDifficulty('easy');
    }
    if (type === 'vocabulary_builder') {
      setVocabularyWords([]);
      setNewVocabWord({
        word: '',
        definition: '',
        wrongDefinitions: ['', '', ''],
        partOfSpeech: '',
        hint: '',
        example: '',
        difficulty: ''
      });
    }
    if (type === 'word_search') {
      setWordSearchWords([]);
      setNewWordSearchWord('');
      setNewWordSearchDefinition('');
      setNewWordSearchDifficulty('')
    }
  };

  const teacherAssignments = getAssignmentsForTeacher(user?.classes || [], user?.sections || []);
  // console.log('Teacher Assignments:', teacherAssignments);
  const filteredAssignments = teacherAssignments.filter(assignment =>
    (!selectedClass || selectedClass === 'all-classes' || assignment.targetClass === selectedClass) &&
    (!selectedSection || selectedSection === 'all-sections' || assignment.targetSection === selectedSection)
  );

  const handleCreateAssignment = () => {
    // Validation per type:
    
    // if (newAssignment.type === 'quick_quiz') {
    //   if (!newAssignment.title.trim() || quizQuestions.length === 0 || quizQuestions.some(q => !q.question.trim() || !q.answer.trim())) {
    //     toast({
    //       title: "Quiz Incomplete",
    //       description: "Please provide the quiz title and all questions and answers.",
    //       variant: "destructive"
    //     });
    //     return;
    //   }
    // } 
     if (newAssignment.type === 'word_scramble') {
      if (!newAssignment.title.trim() || scrambleWords.length === 0) {
        toast({
          title: "Word Scramble Incomplete",
          description: "Please provide the title and at least one word.",
          variant: "destructive"
        });
        return;
      }
    } else if (newAssignment.type === 'vocabulary_builder') {
      if (!newAssignment.title.trim() || vocabularyWords.length === 0) {
        toast({
          title: "Vocabulary Builder Incomplete",
          description: "Please provide the title and at least one vocabulary word.",
          variant: "destructive"
        });
        return;
      }
    } else if (newAssignment.type === 'word_search') {
      if (!newAssignment.title.trim() || wordSearchWords.length === 0) {
        toast({
          title: "Word Search Incomplete",
          description: "Please provide the title and at least one word with definition.",
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

    // if (newAssignment.type === 'puzzle') {
    //   assignmentToCreate = {
    //     ...newAssignment,
    //     title: newAssignment.title || 'Word Puzzle',
    //     content: newAssignment.content || 'Word puzzle assignment',
    //     targetClass: selectedClass,
    //     targetSection: selectedSection,
    //     createdBy: user?.fullName || 'Unknown Teacher',
    //     status: "published",
    //     metadata: { ...newAssignment.metadata, puzzleWords: puzzleWords }
    //   };
    //   console.log(puzzleWords);
    // } else if (newAssignment.type === 'story') {
    //   assignmentToCreate = {
    //     ...newAssignment,
    //     targetClass: selectedClass,
    //     targetSection: selectedSection,
    //     createdBy: user?.fullName || 'Unknown Teacher',
    //     status: "published",
    //     metadata: {}
    //   };
    // } else if (newAssignment.type === 'reflex') {
    //   assignmentToCreate = {
    //     ...newAssignment,
    //     title: newAssignment.title || 'Reflex Challenge',
    //     targetClass: selectedClass,
    //     targetSection: selectedSection,
    //     createdBy: user?.fullName || 'Unknown Teacher',
    //     status: "published",
    //     metadata: {}
    //   };
    // } else if (newAssignment.type === 'quick_quiz') {
    //   assignmentToCreate = {
    //     ...newAssignment,
    //     targetClass: selectedClass,
    //     targetSection: selectedSection,
    //     createdBy: user?.fullName || 'Unknown Teacher',
    //     status: "published",
    //     metadata: {
    //       quizTimer,
    //       questions: quizQuestions
    //     }
    //   };
    // } 
     if (newAssignment.type === 'word_scramble') {
      assignmentToCreate = {
        ...newAssignment,
        targetClass: selectedClass,
        targetSection: selectedSection,
        createdBy: user?.fullName || 'Unknown Teacher',
        status: "published",
        metadata: {
          scrambleWords: scrambleWords,
          // vocabularyWords: []
        }
      };
      console.log(scrambleWords, assignmentToCreate);
      const wordsToAdd = scrambleWords

      const sendWordsToServer = async () => {
        const payload = {
          classes: selectedClass,
          section: selectedSection,
          words: wordsToAdd
        };

        try {
          const response = await fetch(backend_url + "update-wordscramble-words", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
          });

          const data = await response.json();
          console.log("Server response:", data);
          alert(`Server says: ${data.message}`);
        } catch (error) {
          console.error("Error sending data:", error);
          alert("Error sending data to server");
        }
      };
      sendWordsToServer();

    } else if (newAssignment.type === 'vocabulary_builder') {
      assignmentToCreate = {
        ...newAssignment,
        targetClass: selectedClass,
        targetSection: selectedSection,
        createdBy: user?.fullName || 'Unknown Teacher',
        status: "published",
        metadata: {
          vocabularyWords: vocabularyWords
        }
        
      };
      console.log(vocabularyWords);
      const sendWordsToServer = async () => {
        const wordsToAdd = vocabularyWords

        const payload = {
          classes:selectedClass,
          section: selectedSection,
          words: wordsToAdd
        };

        try {
          const response = await fetch(backend_url + "update-vocab", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
          });

          const data = await response.json();
          console.log("Server response:", data);
          alert(`Server says: ${data.message}`);
        } catch (error) {
          console.error("Error:", error);
          alert("Error sending data to server");
        }
      };

      sendWordsToServer()



    } else if (newAssignment.type === 'word_search') {
      assignmentToCreate = {
        ...newAssignment,
        targetClass: selectedClass,
        targetSection: selectedSection,
        createdBy: user?.fullName || 'Unknown Teacher',
        status: "published",
        metadata: {
          searchWords: wordSearchWords
        }
      };
      console.log(wordSearchWords);

      const sendWordSearchData = async () => {
        const dataToSend = wordSearchWords;

        const payload = {
          classes: selectedClass,
          section: selectedSection,
          words: dataToSend
        };

        try {
          const response = await fetch(backend_url + "update-wordsearch", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
          });

          const data = await response.json();
          console.log("Server response:", data);
          alert(`Server says: ${data.message}`);
        } catch (error) {
          console.error("Error:", error);
          alert("Error sending data to server");
        }
      };

      sendWordSearchData();


    }
    // console.log('asig ', assignmentToCreate)

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
    setScrambleWords([]);
    setNewScrambleWord('');
    setNewScrambleDifficulty('easy');
    setVocabularyWords([]);
    setNewVocabWord({
      word: '',
      definition: '',
      wrongDefinitions: ['', '', ''],
      partOfSpeech: '',
      hint: '',
      example: '',
      difficulty: ''
    });
    setWordSearchWords([]);
    setNewWordSearchWord('');
    setNewWordSearchDefinition('');
    setNewWordSearchDifficulty('')
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
      case 'word_scramble': return <Puzzle className="h-4 w-4" />;
      case 'vocabulary_builder': return <BookOpen className="h-4 w-4" />;
      case 'word_search': return <Puzzle className="h-4 w-4" />;
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

  const addScrambleWord = () => {
    if (newScrambleWord.trim()) {
      setScrambleWords([...scrambleWords, { word: newScrambleWord.trim(), difficulty: newScrambleDifficulty }]);
      setNewScrambleWord('');
      setNewScrambleDifficulty('easy');
    }
  };

  const removeScrambleWord = (index: number) => {
    setScrambleWords(scrambleWords.filter((_, i) => i !== index));
  };

  const addVocabularyWord = () => {
    if (newVocabWord.word.trim() && newVocabWord.definition.trim()) {
      setVocabularyWords([...vocabularyWords, { ...newVocabWord }]);
      setNewVocabWord({
        word: '',
        definition: '',
        wrongDefinitions: ['', '', ''],
        partOfSpeech: '',
        hint: '',
        example: '',
        difficulty: ''
      });
    }
  };

  const removeVocabularyWord = (index: number) => {
    setVocabularyWords(vocabularyWords.filter((_, i) => i !== index));
  };

  const addWordSearchWord = () => {
    if (newWordSearchWord.trim() && newWordSearchDefinition.trim()) {
      setWordSearchWords([...wordSearchWords, { word: newWordSearchWord.trim(), definition: newWordSearchDefinition.trim(), difficulty:newWordSearchDifficulty }]);
      setNewWordSearchWord('');
      setNewWordSearchDefinition('');
      setNewWordSearchDifficulty('')
    }
  };

  const removeWordSearchWord = (index: number) => {
    setWordSearchWords(wordSearchWords.filter((_, i) => i !== index));
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
                    {/* <SelectItem value="reflex">Reflex Challenge</SelectItem> */}
                    {/* <SelectItem value="story">Story Builder</SelectItem> */}
                    {/* <SelectItem value="puzzle">Word Puzzle</SelectItem> */}
                    {/* <SelectItem value="quick_quiz">Quick Quiz</SelectItem> */}
                    <SelectItem value="word_scramble">Word Scramble</SelectItem>
                    <SelectItem value="vocabulary_builder">Vocabulary Builder</SelectItem>
                    <SelectItem value="word_search">Word Search</SelectItem>
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

            {/* Word Scramble form */}
            {newAssignment.type === 'word_scramble' && (
              <div className="space-y-4">
                <div>
                  <Label>Assignment Title</Label>
                  <Input
                    placeholder="Enter word scramble title..."
                    value={newAssignment.title}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Instructions (optional)</Label>
                  <Textarea
                    placeholder="Instructions for students..."
                    value={newAssignment.content}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, content: e.target.value }))}
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Add Words</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter word"
                      value={newScrambleWord}
                      onChange={(e) => setNewScrambleWord(e.target.value)}
                    />
                    <Select value={newScrambleDifficulty} onValueChange={(value: any) => setNewScrambleDifficulty(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={addScrambleWord} type="button">Add</Button>
                  </div>
                  <div className="mt-2 space-y-2">
                    {scrambleWords.map((word, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span>{word.word} ({word.difficulty})</span>
                        <Button onClick={() => removeScrambleWord(index)} variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Vocabulary Builder form */}
            {newAssignment.type === 'vocabulary_builder' && (
              <div className="space-y-4">
                <div>
                  <Label>Assignment Title</Label>
                  <Input
                    placeholder="Enter vocabulary builder title..."
                    value={newAssignment.title}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Instructions (optional)</Label>
                  <Textarea
                    placeholder="Instructions for students..."
                    value={newAssignment.content}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, content: e.target.value }))}
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Add Vocabulary Word</Label>
                  <div className="space-y-3 border p-4 rounded">
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Word"
                        value={newVocabWord.word}
                        onChange={(e) => setNewVocabWord(prev => ({ ...prev, word: e.target.value }))}
                      />
                      <Input
                        placeholder="Part of Speech"
                        value={newVocabWord.partOfSpeech}
                        onChange={(e) => setNewVocabWord(prev => ({ ...prev, partOfSpeech: e.target.value }))}
                      />
                      <Input
                        placeholder="easy | medium | hard"
                        value={newVocabWord.difficulty}
                        onChange={(e) => setNewVocabWord(prev => ({ ...prev, difficulty: e.target.value }))}
                      />
                    </div>
                    
                    <Textarea
                      placeholder="Correct Definition"
                      value={newVocabWord.definition}
                      onChange={(e) => setNewVocabWord(prev => ({ ...prev, definition: e.target.value }))}
                      rows={2}
                    />
                    <div>
                      <Label>Wrong Definitions (3 required)</Label>
                      {newVocabWord.wrongDefinitions.map((def, index) => (
                        <Input
                          key={index}
                          placeholder={`Wrong definition ${index + 1}`}
                          value={def}
                          onChange={(e) => {
                            const updated = [...newVocabWord.wrongDefinitions];
                            updated[index] = e.target.value;
                            setNewVocabWord(prev => ({ ...prev, wrongDefinitions: updated }));
                          }}
                          className="mt-1"
                        />
                      ))}
                    </div>
                    <Input
                      placeholder="Hint (optional)"
                      value={newVocabWord.hint}
                      onChange={(e) => setNewVocabWord(prev => ({ ...prev, hint: e.target.value }))}
                    />
                    <Textarea
                      placeholder="Example sentence"
                      value={newVocabWord.example}
                      onChange={(e) => setNewVocabWord(prev => ({ ...prev, example: e.target.value }))}
                      rows={2}
                    />
                    <Button onClick={addVocabularyWord} type="button">Add Word</Button>
                  </div>
                  <div className="mt-2 space-y-2">
                    {vocabularyWords.map((word, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span>{word.word} - {word.definition.substring(0, 50)}...</span>
                        <Button onClick={() => removeVocabularyWord(index)} variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Word Search form */}
            {newAssignment.type === 'word_search' && (
              <div className="space-y-4">
                <div>
                  <Label>Assignment Title</Label>
                  <Input
                    placeholder="Enter word search title..."
                    value={newAssignment.title}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Instructions (optional)</Label>
                  <Textarea
                    placeholder="Instructions for students..."
                    value={newAssignment.content}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, content: e.target.value }))}
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Add Words with Definitions</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Word"
                      value={newWordSearchWord}
                      onChange={(e) => setNewWordSearchWord(e.target.value)}
                    />
                    <Input
                      placeholder="Definition"
                      value={newWordSearchDefinition}
                      onChange={(e) => setNewWordSearchDefinition(e.target.value)}
                    />
                    <Input
                      placeholder="easy | medium | hard"
                      value={newWordSearchDifficulty}
                      onChange={(e) => setNewWordSearchDifficulty(e.target.value)}
                    />
                    <Button onClick={addWordSearchWord} type="button">Add</Button>
                  </div>
                  <div className="mt-2 space-y-2">
                    {wordSearchWords.map((word, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span>{word.word} - {word.definition}</span>
                        <Button onClick={() => removeWordSearchWord(index)} variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

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
                          <span className="capitalize">{assignment.type.replace('_', ' ')}</span>
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
