import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { LogOut, Users, BookOpen, Calendar, MessageSquare, FileText, GraduationCap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Student {
  user_id: string;
  full_name: string;
  email: string;
}

interface Mark {
  id: string;
  marks: number;
  total_marks: number;
  exam_type: string;
  exam_date: string;
  student_id: string;
  subject_id: string;
  subjects: { name: string; code: string };
  profiles: { full_name: string };
}

interface Attendance {
  id: string;
  date: string;
  status: string;
  student_id: string;
  subject_id: string;
  subjects: { name: string; code: string };
  profiles: { full_name: string };
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  status: string;
  grade: number;
  submitted_at: string;
  student_id: string;
  subject_id: string;
  subjects: { name: string; code: string };
  profiles: { full_name: string };
}

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface FeedbackItem {
  id: string;
  content: string;
  feedback_type: string | null;
  created_at: string;
  student_id: string;
  subject_id: string;
  subjects: { name: string; code: string };
  profiles: { full_name: string };
}

interface AssignmentPost {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  created_at: string;
  subject_id: string;
  subjects: { name: string; code: string };
}

const TeacherDashboard = () => {
  const { profile, signOut } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [assignmentPosts, setAssignmentPosts] = useState<AssignmentPost[]>([]);
  const [loading, setLoading] = useState(true);

  const [newAttendance, setNewAttendance] = useState({
    student_id: '',
    subject_id: '',
    date: new Date().toISOString().slice(0, 10),
    status: 'present',
  });

  const [newFeedback, setNewFeedback] = useState({
    student_id: '',
    subject_id: '',
    feedback_type: 'general',
    content: '',
  });

  const [newAssignmentPost, setNewAssignmentPost] = useState({
    subject_id: '',
    title: '',
    description: '',
    due_date: '',
  });

  useEffect(() => {
    if (profile) {
      fetchTeacherData();
    }
  }, [profile]);

  const fetchTeacherData = async () => {
    try {
      // Fetch all students
      const { data: studentsData, error: studentsError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .eq('role', 'student')
        .order('full_name');

      // Fetch all marks
      const { data: marksData, error: marksError } = await supabase
        .from('marks')
        .select(`
          id, marks, total_marks, exam_type, exam_date, student_id, subject_id,
          subjects (name, code),
          profiles!marks_student_id_fkey (full_name)
        `)
        .order('exam_date', { ascending: false });

      // Fetch all attendance
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select(`
          id, date, status, student_id, subject_id,
          subjects (name, code),
          profiles!attendance_student_id_fkey (full_name)
        `)
        .order('date', { ascending: false });

      // Fetch all assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select(`
          id, title, description, status, grade, submitted_at, student_id, subject_id,
          subjects (name, code),
          profiles!assignments_student_id_fkey (full_name)
        `)
        .order('submitted_at', { ascending: false });

      // Fetch subjects
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select('id, name, code')
        .order('name');

      // Fetch feedback (posted items)
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('feedback')
        .select(`
          id, content, feedback_type, created_at, student_id, subject_id,
          subjects (name, code),
          profiles!feedback_student_id_fkey (full_name)
        `)
        .order('created_at', { ascending: false });

      // Fetch assignment posts by this teacher
      const { data: postsData, error: postsError } = await supabase
        .from('assignment_posts')
        .select(`
          id, title, description, due_date, created_at, subject_id,
          subjects (name, code)
        `)
        .eq('teacher_id', profile?.user_id)
        .order('created_at', { ascending: false });

      if (studentsError || marksError || attendanceError || assignmentsError || subjectsError || feedbackError || postsError) {
        throw new Error('Failed to fetch data');
      }

      setStudents(studentsData || []);
      setMarks(marksData || []);
      setAttendance(attendanceData || []);
      setAssignments(assignmentsData || []);
      setSubjects(subjectsData || []);
      setFeedbackList(feedbackData || []);
      setAssignmentPosts(postsData || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleCreateAttendance = async () => {
    if (!newAttendance.student_id || !newAttendance.subject_id || !newAttendance.status) {
      toast({ title: 'Missing fields', description: 'Please select student, subject, and status.', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('attendance').insert([
      {
        student_id: newAttendance.student_id,
        subject_id: newAttendance.subject_id,
        date: newAttendance.date,
        status: newAttendance.status,
        teacher_id: profile?.user_id as string,
      },
    ]);
    if (error) {
      toast({ title: 'Error', description: 'Failed to add attendance.', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Attendance recorded.' });
      setNewAttendance({ ...newAttendance, student_id: '', subject_id: '', status: 'present' });
      fetchTeacherData();
    }
  };

  const handleCreateFeedback = async () => {
    if (!newFeedback.student_id || !newFeedback.subject_id || !newFeedback.content) {
      toast({ title: 'Missing fields', description: 'Please select student, subject, and enter content.', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('feedback').insert([
      {
        student_id: newFeedback.student_id,
        subject_id: newFeedback.subject_id,
        teacher_id: profile?.user_id as string,
        content: newFeedback.content,
        feedback_type: newFeedback.feedback_type,
      },
    ]);
    if (error) {
      toast({ title: 'Error', description: 'Failed to send feedback.', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Feedback sent.' });
      setNewFeedback({ student_id: '', subject_id: '', feedback_type: 'general', content: '' });
      fetchTeacherData();
    }
  };

  const handleCreateAssignmentPost = async () => {
    if (!newAssignmentPost.subject_id || !newAssignmentPost.title) {
      toast({ title: 'Missing fields', description: 'Please select subject and enter title.', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('assignment_posts').insert([
      {
        subject_id: newAssignmentPost.subject_id,
        title: newAssignmentPost.title,
        description: newAssignmentPost.description || null,
        due_date: newAssignmentPost.due_date || null,
        teacher_id: profile?.user_id as string,
      },
    ]);
    if (error) {
      toast({ title: 'Error', description: 'Failed to post assignment.', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Assignment posted.' });
      setNewAssignmentPost({ subject_id: '', title: '', description: '', due_date: '' });
      fetchTeacherData();
    }
  };

  const getTotalStudents = () => students.length;
  const getTotalAssignments = () => assignments.length;
  const getUngradedAssignments = () => assignments.filter(a => a.status === 'submitted').length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6" />
            <h1 className="text-xl font-semibold">Teacher Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Welcome, {profile?.full_name}</span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getTotalStudents()}</div>
              <p className="text-xs text-muted-foreground mt-2">Active students</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getTotalAssignments()}</div>
              <p className="text-xs text-muted-foreground mt-2">Submitted assignments</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending Grading</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getUngradedAssignments()}</div>
              <p className="text-xs text-muted-foreground mt-2">Need attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Recent Marks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{marks.length}</div>
              <p className="text-xs text-muted-foreground mt-2">Total marks recorded</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Tabs */}
        <Tabs defaultValue="students" className="space-y-4">
          <TabsList>
            <TabsTrigger value="students" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Students
            </TabsTrigger>
            <TabsTrigger value="marks" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Marks
            </TabsTrigger>
            <TabsTrigger value="attendance" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Attendance
            </TabsTrigger>
            <TabsTrigger value="assignments" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Assignments
            </TabsTrigger>
            <TabsTrigger value="feedback" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Feedback
            </TabsTrigger>
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Assignment Posts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students">
            <Card>
              <CardHeader>
                <CardTitle>All Students</CardTitle>
                <CardDescription>Manage student information and records</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {students.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No students found.</p>
                  ) : (
                    students.map((student) => (
                      <div key={student.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-medium">{student.full_name}</h3>
                          <p className="text-sm text-muted-foreground">{student.email}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            View Profile
                          </Button>
                          <Button variant="outline" size="sm">
                            Add Marks
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="marks">
            <Card>
              <CardHeader>
                <CardTitle>Student Marks</CardTitle>
                <CardDescription>View and manage student grades</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {marks.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No marks recorded yet.</p>
                  ) : (
                    marks.map((mark) => (
                      <div key={mark.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-medium">{mark.profiles.full_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {mark.subjects.name} - {mark.exam_type}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(mark.exam_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold">
                            {mark.marks}/{mark.total_marks}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {Math.round((mark.marks / mark.total_marks) * 100)}%
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Records</CardTitle>
                <CardDescription>View and manage student attendance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 mb-6 border rounded-lg space-y-4">
                  <h3 className="font-medium">Add Attendance</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-2">
                      <Label>Student</Label>
                      <Select value={newAttendance.student_id} onValueChange={(v) => setNewAttendance({ ...newAttendance, student_id: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select student" />
                        </SelectTrigger>
                        <SelectContent>
                          {students.map((s) => (
                            <SelectItem key={s.user_id} value={s.user_id}>{s.full_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Subject</Label>
                      <Select value={newAttendance.subject_id} onValueChange={(v) => setNewAttendance({ ...newAttendance, subject_id: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map((subj) => (
                            <SelectItem key={subj.id} value={subj.id}>{subj.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input type="date" value={newAttendance.date} onChange={(e) => setNewAttendance({ ...newAttendance, date: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={newAttendance.status} onValueChange={(v) => setNewAttendance({ ...newAttendance, status: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="present">Present</SelectItem>
                          <SelectItem value="absent">Absent</SelectItem>
                          <SelectItem value="late">Late</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={handleCreateAttendance}>Save Attendance</Button>
                </div>
                <div className="space-y-4">
                  {attendance.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No attendance records yet.</p>
                  ) : (
                    attendance.map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-medium">{record.profiles.full_name}</h3>
                          <p className="text-sm text-muted-foreground">{record.subjects.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(record.date).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge 
                          variant={
                            record.status === 'present' ? 'default' : 
                            record.status === 'late' ? 'secondary' : 'destructive'
                          }
                        >
                          {record.status}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assignments">
            <Card>
              <CardHeader>
                <CardTitle>Student Assignments</CardTitle>
                <CardDescription>Review and grade student submissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 mb-6 border rounded-lg space-y-4">
                  <h3 className="font-medium">Post New Assignment</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Subject</Label>
                      <Select value={newAssignmentPost.subject_id} onValueChange={(v) => setNewAssignmentPost({ ...newAssignmentPost, subject_id: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map((subj) => (
                            <SelectItem key={subj.id} value={subj.id}>{subj.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input value={newAssignmentPost.title} onChange={(e) => setNewAssignmentPost({ ...newAssignmentPost, title: e.target.value })} placeholder="Enter title" />
                    </div>
                    <div className="space-y-2">
                      <Label>Due Date</Label>
                      <Input type="date" value={newAssignmentPost.due_date} onChange={(e) => setNewAssignmentPost({ ...newAssignmentPost, due_date: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={newAssignmentPost.description} onChange={(e) => setNewAssignmentPost({ ...newAssignmentPost, description: e.target.value })} placeholder="Enter description" />
                  </div>
                  <Button onClick={handleCreateAssignmentPost}>Post Assignment</Button>
                </div>
                <div className="space-y-4">
                  {assignments.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No assignments submitted yet.</p>
                  ) : (
                    assignments.map((assignment) => (
                      <div key={assignment.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-medium">{assignment.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {assignment.profiles.full_name} - {assignment.subjects.name}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Badge 
                              variant={
                                assignment.status === 'graded' ? 'default' : 
                                assignment.status === 'returned' ? 'secondary' : 'outline'
                              }
                            >
                              {assignment.status}
                            </Badge>
                            {assignment.status === 'submitted' && (
                              <Button variant="outline" size="sm">
                                Grade
                              </Button>
                            )}
                          </div>
                        </div>
                        {assignment.description && (
                          <p className="text-sm mb-2">{assignment.description}</p>
                        )}
                        {assignment.grade && (
                          <div className="text-sm font-medium mb-2">
                            Grade: {assignment.grade}/100
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Submitted: {new Date(assignment.submitted_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feedback">
            <Card>
              <CardHeader>
                <CardTitle>Teacher Feedback</CardTitle>
                <CardDescription>Send feedback to students and view recent feedback</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 mb-6 border rounded-lg space-y-4">
                  <h3 className="font-medium">Send Feedback</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-2">
                      <Label>Student</Label>
                      <Select value={newFeedback.student_id} onValueChange={(v) => setNewFeedback({ ...newFeedback, student_id: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select student" />
                        </SelectTrigger>
                        <SelectContent>
                          {students.map((s) => (
                            <SelectItem key={s.user_id} value={s.user_id}>{s.full_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Subject</Label>
                      <Select value={newFeedback.subject_id} onValueChange={(v) => setNewFeedback({ ...newFeedback, subject_id: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map((subj) => (
                            <SelectItem key={subj.id} value={subj.id}>{subj.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Input value={newFeedback.feedback_type} onChange={(e) => setNewFeedback({ ...newFeedback, feedback_type: e.target.value })} placeholder="e.g. general, warning, praise" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Content</Label>
                    <Textarea value={newFeedback.content} onChange={(e) => setNewFeedback({ ...newFeedback, content: e.target.value })} placeholder="Write feedback..." />
                  </div>
                  <Button onClick={handleCreateFeedback}>Send Feedback</Button>
                </div>
                <div className="space-y-4">
                  {feedbackList.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No feedback yet.</p>
                  ) : (
                    feedbackList.map((item) => (
                      <div key={item.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-medium">{item.subjects.name}</h3>
                            <p className="text-sm text-muted-foreground">To: {item.profiles.full_name}</p>
                          </div>
                          <Badge variant="outline">{item.feedback_type || 'general'}</Badge>
                        </div>
                        <p className="text-sm mb-2">{item.content}</p>
                        <p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="posts">
            <Card>
              <CardHeader>
                <CardTitle>Assignment Posts</CardTitle>
                <CardDescription>Create and view assignment posts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 mb-6 border rounded-lg space-y-4">
                  <h3 className="font-medium">Create Assignment Post</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Subject</Label>
                      <Select value={newAssignmentPost.subject_id} onValueChange={(v) => setNewAssignmentPost({ ...newAssignmentPost, subject_id: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map((subj) => (
                            <SelectItem key={subj.id} value={subj.id}>{subj.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input value={newAssignmentPost.title} onChange={(e) => setNewAssignmentPost({ ...newAssignmentPost, title: e.target.value })} placeholder="Enter title" />
                    </div>
                    <div className="space-y-2">
                      <Label>Due Date</Label>
                      <Input type="date" value={newAssignmentPost.due_date} onChange={(e) => setNewAssignmentPost({ ...newAssignmentPost, due_date: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={newAssignmentPost.description} onChange={(e) => setNewAssignmentPost({ ...newAssignmentPost, description: e.target.value })} placeholder="Enter description" />
                  </div>
                  <Button onClick={handleCreateAssignmentPost}>Create Post</Button>
                </div>
                <div className="space-y-4">
                  {assignmentPosts.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No assignment posts yet.</p>
                  ) : (
                    assignmentPosts.map((post) => (
                      <div key={post.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-medium">{post.title}</h3>
                            <p className="text-sm text-muted-foreground">{post.subjects.name}</p>
                          </div>
                          {post.due_date && (
                            <Badge variant="outline">Due: {new Date(post.due_date).toLocaleDateString()}</Badge>
                          )}
                        </div>
                        {post.description && <p className="text-sm">{post.description}</p>}
                        <p className="text-xs text-muted-foreground mt-2">Posted: {new Date(post.created_at).toLocaleDateString()}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default TeacherDashboard;