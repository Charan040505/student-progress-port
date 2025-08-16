import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { LogOut, Upload, BookOpen, Calendar, MessageSquare, FileText } from 'lucide-react';

interface Mark {
  id: string;
  marks: number;
  total_marks: number;
  exam_type: string;
  exam_date: string;
  subjects: { name: string; code: string };
}

interface Attendance {
  id: string;
  date: string;
  status: string;
  subjects: { name: string; code: string };
}

interface Feedback {
  id: string;
  content: string;
  feedback_type: string;
  created_at: string;
  subjects: { name: string; code: string };
  profiles: { full_name: string };
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  status: string;
  grade: number;
  teacher_comments: string;
  submitted_at: string;
  subjects: { name: string; code: string };
}

const StudentDashboard = () => {
  const { profile, signOut } = useAuth();
  const [marks, setMarks] = useState<Mark[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchStudentData();
    }
  }, [profile]);

  const fetchStudentData = async () => {
    try {
      // Fetch marks
      const { data: marksData, error: marksError } = await supabase
        .from('marks')
        .select(`
          id, marks, total_marks, exam_type, exam_date,
          subjects (name, code)
        `)
        .eq('student_id', profile?.user_id)
        .order('exam_date', { ascending: false });

      // Fetch attendance
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select(`
          id, date, status,
          subjects (name, code)
        `)
        .eq('student_id', profile?.user_id)
        .order('date', { ascending: false });

      // Fetch feedback
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('feedback')
        .select(`
          id, content, feedback_type, created_at,
          subjects (name, code),
          profiles!feedback_teacher_id_fkey (full_name)
        `)
        .eq('student_id', profile?.user_id)
        .order('created_at', { ascending: false });

      // Fetch assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select(`
          id, title, description, status, grade, teacher_comments, submitted_at,
          subjects (name, code)
        `)
        .eq('student_id', profile?.user_id)
        .order('submitted_at', { ascending: false });

      if (marksError || attendanceError || feedbackError || assignmentsError) {
        throw new Error('Failed to fetch data');
      }

      setMarks(marksData || []);
      setAttendance(attendanceData || []);
      setFeedback(feedbackData || []);
      setAssignments(assignmentsData || []);
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

  const calculateAttendancePercentage = () => {
    if (attendance.length === 0) return 0;
    const presentCount = attendance.filter(a => a.status === 'present').length;
    return Math.round((presentCount / attendance.length) * 100);
  };

  const calculateAverageGrade = () => {
    if (marks.length === 0) return 0;
    const total = marks.reduce((sum, mark) => sum + (mark.marks / mark.total_marks) * 100, 0);
    return Math.round(total / marks.length);
  };

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
            <BookOpen className="h-6 w-6" />
            <h1 className="text-xl font-semibold">Student Dashboard</h1>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{calculateAverageGrade()}%</div>
              <Progress value={calculateAverageGrade()} className="mt-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{calculateAttendancePercentage()}%</div>
              <Progress value={calculateAttendancePercentage()} className="mt-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{assignments.length}</div>
              <p className="text-xs text-muted-foreground mt-2">
                {assignments.filter(a => a.status === 'graded').length} graded
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Tabs */}
        <Tabs defaultValue="marks" className="space-y-4">
          <TabsList>
            <TabsTrigger value="marks" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Marks
            </TabsTrigger>
            <TabsTrigger value="attendance" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Attendance
            </TabsTrigger>
            <TabsTrigger value="feedback" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Feedback
            </TabsTrigger>
            <TabsTrigger value="assignments" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Assignments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="marks">
            <Card>
              <CardHeader>
                <CardTitle>Your Marks</CardTitle>
                <CardDescription>View your grades across all subjects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {marks.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No marks recorded yet.</p>
                  ) : (
                    marks.map((mark) => (
                      <div key={mark.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-medium">{mark.subjects.name}</h3>
                          <p className="text-sm text-muted-foreground">{mark.exam_type}</p>
                          <p className="text-xs text-muted-foreground">{new Date(mark.exam_date).toLocaleDateString()}</p>
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
                <CardTitle>Attendance Record</CardTitle>
                <CardDescription>Your attendance across all subjects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {attendance.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No attendance records yet.</p>
                  ) : (
                    attendance.map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-medium">{record.subjects.name}</h3>
                          <p className="text-sm text-muted-foreground">{new Date(record.date).toLocaleDateString()}</p>
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

          <TabsContent value="feedback">
            <Card>
              <CardHeader>
                <CardTitle>Teacher Feedback</CardTitle>
                <CardDescription>Feedback provided by your teachers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {feedback.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No feedback yet.</p>
                  ) : (
                    feedback.map((item) => (
                      <div key={item.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium">{item.subjects.name}</h3>
                          <Badge variant="outline">{item.feedback_type}</Badge>
                        </div>
                        <p className="text-sm mb-2">{item.content}</p>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>From: {item.profiles.full_name}</span>
                          <span>{new Date(item.created_at).toLocaleDateString()}</span>
                        </div>
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
                <CardTitle>Your Assignments</CardTitle>
                <CardDescription>View and upload assignments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assignments.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No assignments submitted yet.</p>
                  ) : (
                    assignments.map((assignment) => (
                      <div key={assignment.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-medium">{assignment.title}</h3>
                            <p className="text-sm text-muted-foreground">{assignment.subjects.name}</p>
                          </div>
                          <Badge 
                            variant={
                              assignment.status === 'graded' ? 'default' : 
                              assignment.status === 'returned' ? 'secondary' : 'outline'
                            }
                          >
                            {assignment.status}
                          </Badge>
                        </div>
                        {assignment.description && (
                          <p className="text-sm mb-2">{assignment.description}</p>
                        )}
                        {assignment.grade && (
                          <div className="text-sm font-medium mb-2">
                            Grade: {assignment.grade}/100
                          </div>
                        )}
                        {assignment.teacher_comments && (
                          <div className="text-sm text-muted-foreground mb-2">
                            Teacher Comments: {assignment.teacher_comments}
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
        </Tabs>
      </main>
    </div>
  );
};

export default StudentDashboard;