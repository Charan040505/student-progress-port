-- Create storage bucket for assignment files
INSERT INTO storage.buckets (id, name, public) VALUES ('assignments', 'assignments', false);

-- Create policies for assignment file uploads
CREATE POLICY "Students can upload assignment files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'assignments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Students can view their own assignment files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'assignments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Teachers can view all assignment files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'assignments' AND has_role(auth.uid(), 'teacher'::user_role));

-- Add assignment posting table for teacher-created assignments
CREATE TABLE public.assignment_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  subject_id UUID NOT NULL,
  teacher_id UUID NOT NULL,
  due_date DATE,
  max_points NUMERIC DEFAULT 100,
  instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on assignment_posts
ALTER TABLE public.assignment_posts ENABLE ROW LEVEL SECURITY;

-- Create policies for assignment_posts
CREATE POLICY "Teachers can manage assignment posts" 
ON public.assignment_posts 
FOR ALL 
USING (has_role(auth.uid(), 'teacher'::user_role));

CREATE POLICY "Students can view assignment posts" 
ON public.assignment_posts 
FOR SELECT 
USING (true);

-- Add trigger for timestamps
CREATE TRIGGER update_assignment_posts_updated_at
BEFORE UPDATE ON public.assignment_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();