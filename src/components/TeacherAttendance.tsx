import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/hooks/use-toast';
import { CalendarIcon, Users, Save } from 'lucide-react';
import { format } from 'date-fns';

interface Student {
  user_id: string;
  full_name: string;
  email: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface AttendanceRecord {
  student_id: string;
  status: 'present' | 'absent' | 'late';
}

const TeacherAttendance = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (students.length > 0) {
      initializeAttendance();
    }
  }, [students]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch students
      const { data: studentsData, error: studentsError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .eq('role', 'student')
        .order('full_name');

      // Fetch subjects
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select('id, name, code')
        .order('name');

      if (studentsError || subjectsError) {
        throw new Error('Failed to fetch data');
      }

      setStudents(studentsData || []);
      setSubjects(subjectsData || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const initializeAttendance = () => {
    const initialAttendance = students.map(student => ({
      student_id: student.user_id,
      status: 'present' as const,
    }));
    setAttendance(initialAttendance);
  };

  const updateAttendance = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setAttendance(prev => 
      prev.map(record => 
        record.student_id === studentId 
          ? { ...record, status }
          : record
      )
    );
  };

  const saveAttendance = async () => {
    if (!selectedSubject) {
      toast({
        title: 'Error',
        description: 'Please select a subject',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      // Get current user profile for teacher_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Prepare attendance records
      const attendanceRecords = attendance.map(record => ({
        student_id: record.student_id,
        subject_id: selectedSubject,
        teacher_id: user.id,
        date: format(selectedDate, 'yyyy-MM-dd'),
        status: record.status,
      }));

      // Delete existing attendance for this date and subject
      await supabase
        .from('attendance')
        .delete()
        .eq('subject_id', selectedSubject)
        .eq('date', format(selectedDate, 'yyyy-MM-dd'));

      // Insert new attendance records
      const { error } = await supabase
        .from('attendance')
        .insert(attendanceRecords);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Attendance saved successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save attendance',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Mark Attendance
        </CardTitle>
        <CardDescription>Record daily attendance for students</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Subject</label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
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

          <div className="space-y-2">
            <label className="text-sm font-medium">Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, 'PPP')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Student List */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Students ({students.length})</h3>
          {students.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No students found.</p>
          ) : (
            <div className="space-y-3">
              {students.map((student) => {
                const studentAttendance = attendance.find(a => a.student_id === student.user_id);
                return (
                  <div key={student.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{student.full_name}</h4>
                      <p className="text-sm text-muted-foreground">{student.email}</p>
                    </div>
                    <div className="flex gap-2">
                      {(['present', 'late', 'absent'] as const).map((status) => (
                        <Button
                          key={status}
                          variant={studentAttendance?.status === status ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateAttendance(student.user_id, status)}
                          className="min-w-20"
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Save Button */}
        {students.length > 0 && (
          <Button 
            onClick={saveAttendance} 
            disabled={saving || !selectedSubject}
            className="w-full"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Attendance
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default TeacherAttendance;