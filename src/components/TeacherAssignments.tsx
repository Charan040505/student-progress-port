import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { BookOpen, CalendarIcon, Plus, Eye } from 'lucide-react';
import { format } from 'date-fns';

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface AssignmentPost {
  id: string;
  title: string;
  description: string;
  subject_id: string;
  due_date: string;
  max_points: number;
  instructions: string;
  subjects: { name: string; code: string };
  created_at: string;
}

interface Submission {
  id: string;
  student_id: string;
  status: string;
  grade: number;
  submitted_at: string;
  profiles: { full_name: string };
}

const TeacherAssignments = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assignmentPosts, setAssignmentPosts] = useState<AssignmentPost[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject_id: '',
    due_date: new Date(),
    max_points: 100,
    instructions: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedAssignment) {
      fetchSubmissions(selectedAssignment);
    }
  }, [selectedAssignment]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch subjects
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select('id, name, code')
        .order('name');

      // Fetch assignment posts with proper join
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignment_posts')
        .select(`
          id, title, description, subject_id, due_date, max_points, instructions, created_at,
          subjects!assignment_posts_subject_id_fkey (name, code)
        `)
        .order('created_at', { ascending: false });

      if (subjectsError || assignmentsError) {
        throw new Error('Failed to fetch data');
      }

      setSubjects(subjectsData || []);
      setAssignmentPosts((assignmentsData as any) || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load assignments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async (assignmentPostId: string) => {
    try {
      // Note: This would require joining assignment_posts with assignments table
      // For now, we'll show a placeholder
      setSubmissions([]);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

  const createAssignment = async () => {
    if (!formData.title || !formData.subject_id) {
      toast({
        title: 'Error',
        description: 'Please fill in required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('assignment_posts')
        .insert({
          title: formData.title,
          description: formData.description,
          subject_id: formData.subject_id,
          teacher_id: user.id,
          due_date: format(formData.due_date, 'yyyy-MM-dd'),
          max_points: formData.max_points,
          instructions: formData.instructions,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Assignment created successfully',
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        subject_id: '',
        due_date: new Date(),
        max_points: 100,
        instructions: '',
      });
      setIsCreateDialogOpen(false);
      fetchData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create assignment',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            Assignment Management
          </h2>
          <p className="text-muted-foreground">Create and manage assignments</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Assignment</DialogTitle>
              <DialogDescription>
                Create a new assignment for students to complete
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title *</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Assignment title"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject *</label>
                  <Select value={formData.subject_id} onValueChange={(value) => setFormData(prev => ({ ...prev, subject_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name} ({subject.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Due Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(formData.due_date, 'PPP')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.due_date}
                        onSelect={(date) => date && setFormData(prev => ({ ...prev, due_date: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Points</label>
                  <Input
                    type="number"
                    value={formData.max_points}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_points: Number(e.target.value) }))}
                    min="1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the assignment"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Instructions</label>
                <Textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                  placeholder="Detailed instructions for students"
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createAssignment}>
                  Create Assignment
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Assignment List */}
      <div className="space-y-4">
        {assignmentPosts.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center py-8">
                No assignments created yet. Create your first assignment above.
              </p>
            </CardContent>
          </Card>
        ) : (
          assignmentPosts.map((assignment) => (
            <Card key={assignment.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{assignment.title}</CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-1">
                      <span>{assignment.subjects.name}</span>
                      <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
                      <Badge variant="outline">{assignment.max_points} points</Badge>
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View Submissions
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {assignment.description && (
                  <p className="text-sm mb-2">{assignment.description}</p>
                )}
                {assignment.instructions && (
                  <div className="text-sm text-muted-foreground">
                    <strong>Instructions:</strong> {assignment.instructions}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default TeacherAssignments;