import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Users, BookOpen, BarChart3, MessageSquare, Upload } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Student Performance Tracker</h1>
          </div>
          <Link to="/auth">
            <Button>Sign In</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Track Academic Progress with Ease</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            A comprehensive platform for students and teachers to manage grades, attendance, 
            assignments, and feedback in one place.
          </p>
          <Link to="/auth">
            <Button size="lg" className="text-lg px-8 py-3">
              Get Started
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12">Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-6 w-6 text-primary" />
                  <CardTitle>Role-based Access</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Separate dashboards for students and teachers with appropriate permissions and features.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-6 w-6 text-primary" />
                  <CardTitle>Grade Management</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Teachers can easily add, update, and delete student marks across all subjects.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-6 w-6 text-primary" />
                  <CardTitle>Attendance Tracking</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Comprehensive attendance management with real-time tracking and reporting.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Upload className="h-6 w-6 text-primary" />
                  <CardTitle>Assignment Submission</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Students can upload assignments and teachers can review and grade them efficiently.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-6 w-6 text-primary" />
                  <CardTitle>Teacher Feedback</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Direct communication channel for teachers to provide personalized feedback to students.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-6 w-6 text-primary" />
                  <CardTitle>Performance Analytics</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Visual insights into student performance with charts and progress tracking.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <h3 className="text-3xl font-bold mb-6">Ready to Get Started?</h3>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of students and teachers already using our platform.
          </p>
          <Link to="/auth">
            <Button size="lg" className="text-lg px-8 py-3">
              Sign Up Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4 bg-card">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>&copy; 2024 Student Performance Tracker. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
