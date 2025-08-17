import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Upload, FileText, Calendar, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

interface AssignmentPost {
  id: string;
  title: string;
  description: string;
  due_date: string;
  max_points: number;
  instructions: string;
  subjects: { name: string; code: string };
  created_at: string;
}

interface MySubmission {
  id: string;
  assignment_post_id?: string;
  status: string;
  grade?: number;
  teacher_comments?: string;
  submitted_at: string;
  file_name?: string;
  file_url?: string;
  description?: string;
  title?: string;
}

const StudentAssignments = () => {
  const [assignmentPosts, setAssignmentPosts] = useState<AssignmentPost[]>([]);
  const [mySubmissions, setMySubmissions] = useState<MySubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentPost | null>(null);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);

  // Submission form state
  const [submissionData, setSubmissionData] = useState({
    description: '',
    file: null as File | null,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch available assignment posts with proper join
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignment_posts')
        .select(`
          id, title, description, due_date, max_points, instructions, created_at,
          subjects!assignment_posts_subject_id_fkey (name, code)
        `)
        .order('due_date', { ascending: true });

      // Fetch my submissions
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: submissionsData, error: submissionsError } = await supabase
        .from('assignments')
        .select('id, assignment_post_id, status, grade, teacher_comments, submitted_at, file_name, file_url, description, title')
        .eq('student_id', user.id)
        .order('submitted_at', { ascending: false });

      if (assignmentsError || submissionsError) {
        throw new Error('Failed to fetch data');
      }

      setAssignmentPosts((assignmentsData as any) || []);
      setMySubmissions((submissionsData as any) || []);
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

  const handleSubmitAssignment = async () => {
    if (!selectedAssignment || (!submissionData.description && !submissionData.file)) {
      toast({
        title: 'Error',
        description: 'Please provide either a description or upload a file',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let fileUrl = '';
      let fileName = '';

      // Upload file if provided
      if (submissionData.file) {
        const fileExt = submissionData.file.name.split('.').pop();
        const filePath = `${user.id}/${selectedAssignment.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('assignments')
          .upload(filePath, submissionData.file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('assignments')
          .getPublicUrl(filePath);

        fileUrl = publicUrl;
        fileName = submissionData.file.name;
      }

      // Create submission record
      const { error } = await supabase
        .from('assignments')
        .insert({
          title: selectedAssignment.title,
          description: submissionData.description,
          student_id: user.id,
          subject_id: '', // This will be linked via assignment_post_id
          assignment_post_id: selectedAssignment.id,
          status: 'submitted',
          file_name: fileName,
          file_url: fileUrl,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Assignment submitted successfully',
      });

      // Reset form
      setSubmissionData({ description: '', file: null });
      setIsSubmitDialogOpen(false);
      setSelectedAssignment(null);
      fetchData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit assignment',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getSubmissionForAssignment = (assignmentId: string) => {
    return mySubmissions.find(sub => 
      sub.assignment_post_id === assignmentId || 
      sub.title === assignmentPosts.find(ap => ap.id === assignmentId)?.title
    );
  };

  const downloadFile = async (fileUrl: string, fileName: string) => {
    try {
      // Create a temporary link element to trigger download
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = fileName || 'assignment-file';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download file',
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
      <Tabs defaultValue="available" className="space-y-4">
        <TabsList>
          <TabsTrigger value="available" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Available Assignments
          </TabsTrigger>
          <TabsTrigger value="submitted" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            My Submissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="available">
          <div className="space-y-4">
            {assignmentPosts.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-center py-8">
                    No assignments available at the moment.
                  </p>
                </CardContent>
              </Card>
            ) : (
              assignmentPosts.map((assignment) => {
                const submission = getSubmissionForAssignment(assignment.id);
                const isOverdue = new Date(assignment.due_date) < new Date();
                const isSubmitted = !!submission;

                return (
                  <Card key={assignment.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{assignment.title}</CardTitle>
                          <CardDescription className="flex items-center gap-4 mt-1">
                            <span>{assignment.subjects.name}</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Due: {format(new Date(assignment.due_date), 'PPP')}
                            </span>
                            <Badge variant="outline">{assignment.max_points} points</Badge>
                            {isOverdue && !isSubmitted && (
                              <Badge variant="destructive">Overdue</Badge>
                            )}
                            {isSubmitted && (
                              <Badge variant="default">Submitted</Badge>
                            )}
                          </CardDescription>
                        </div>
                        {!isSubmitted && !isOverdue && (
                          <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm"
                                onClick={() => setSelectedAssignment(assignment)}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Submit
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Submit Assignment</DialogTitle>
                                <DialogDescription>
                                  Submit your work for: {selectedAssignment?.title}
                                </DialogDescription>
                              </DialogHeader>
                              
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Description/Answer</label>
                                  <Textarea
                                    value={submissionData.description}
                                    onChange={(e) => setSubmissionData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Enter your answer or description here..."
                                    rows={5}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Upload File (Optional)</label>
                                  <Input
                                    type="file"
                                    onChange={(e) => setSubmissionData(prev => ({ 
                                      ...prev, 
                                      file: e.target.files?.[0] || null 
                                    }))}
                                    accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                                  />
                                  <p className="text-xs text-muted-foreground">
                                    Supported formats: PDF, Word documents, images, text files
                                  </p>
                                </div>

                                <div className="flex justify-end gap-2">
                                  <Button 
                                    variant="outline" 
                                    onClick={() => {
                                      setIsSubmitDialogOpen(false);
                                      setSelectedAssignment(null);
                                      setSubmissionData({ description: '', file: null });
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button onClick={handleSubmitAssignment} disabled={submitting}>
                                    {submitting ? (
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                                    ) : (
                                      <Upload className="h-4 w-4 mr-2" />
                                    )}
                                    Submit Assignment
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {assignment.description && (
                        <p className="text-sm mb-3">{assignment.description}</p>
                      )}
                      {assignment.instructions && (
                        <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
                          <strong>Instructions:</strong>
                          <p className="mt-1">{assignment.instructions}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="submitted">
          <div className="space-y-4">
            {mySubmissions.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-center py-8">
                    No submissions yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              mySubmissions.map((submission) => (
                <Card key={submission.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{submission.title || 'Untitled Assignment'}</CardTitle>
                        <CardDescription className="flex items-center gap-4 mt-1">
                          <span>Submitted: {format(new Date(submission.submitted_at), 'PPP')}</span>
                          <Badge 
                            variant={
                              submission.status === 'graded' ? 'default' : 
                              submission.status === 'returned' ? 'secondary' : 'outline'
                            }
                          >
                            {submission.status}
                          </Badge>
                          {submission.grade && (
                            <Badge variant="default">{submission.grade}/100</Badge>
                          )}
                        </CardDescription>
                      </div>
                      {submission.file_url && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => downloadFile(submission.file_url!, submission.file_name || 'assignment-file')}
                        >
                          📎 Download File
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {submission.description && (
                      <div className="mb-3">
                        <strong className="text-sm">Your Submission:</strong>
                        <p className="text-sm mt-1">{submission.description}</p>
                      </div>
                    )}
                    {submission.teacher_comments && (
                  {submission.file_name && (
                    <div className="mb-3">
                      <strong className="text-sm">Attached File:</strong>
                      <p className="text-sm mt-1 text-blue-600">{submission.file_name}</p>
                    </div>
                  )}
                      <div className="text-sm p-3 bg-muted/50 rounded-lg">
                        <strong>Teacher Comments:</strong>
                        <p className="mt-1">{submission.teacher_comments}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentAssignments;