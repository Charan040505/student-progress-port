CREATE TABLE public.assignment_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.assignment_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view assignment posts"
ON public.assignment_posts
FOR SELECT
USING (TRUE);

CREATE POLICY "Teachers can insert assignment posts"
ON public.assignment_posts
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'teacher') AND auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their assignment posts"
ON public.assignment_posts
FOR UPDATE
USING (public.has_role(auth.uid(), 'teacher') AND auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their assignment posts"
ON public.assignment_posts
FOR DELETE
USING (public.has_role(auth.uid(), 'teacher') AND auth.uid() = teacher_id);

CREATE TRIGGER update_assignment_posts_updated_at
  BEFORE UPDATE ON public.assignment_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();