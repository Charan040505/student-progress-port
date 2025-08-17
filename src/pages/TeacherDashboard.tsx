import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { LogOut, Users, BookOpen, Calendar, MessageSquare, FileText, GraduationCap, ClipboardList } from 'lucide-react';
import TeacherAttendance from '@/components/TeacherAttendance';
import TeacherAssignments from '@/components/TeacherAssignments';

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

const TeacherDashboard = () => {
  const { profile, signOut } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

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

      if (studentsError || marksError || attendanceError || assignmentsError) {
        throw new Error('Failed to fetch data');
      }

      setStudents(studentsData || []);
      setMarks(marksData || []);
      setAttendance(attendanceData || []);
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
            <TabsTrigger value="attendance" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Post Attendance
            </TabsTrigger>
            <TabsTrigger value="assignments" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Create Assignments
            </TabsTrigger>
            <TabsTrigger value="marks" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Marks
            </TabsTrigger>
            <TabsTrigger value="submissions" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              View Submissions
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

          <TabsContent value="attendance">
            <TeacherAttendance />
          </TabsContent>

          <TabsContent value="assignments">
            <TeacherAssignments />
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

          <TabsContent value="submissions">
            <Card>
              <CardHeader>
                <CardTitle>Student Submissions</CardTitle>
                <CardDescription>Review and grade student assignment submissions</CardDescription>
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
        </Tabs>
      </main>
    </div>
  );
};

export default TeacherDashboard;