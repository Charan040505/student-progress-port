-- Add foreign key relationship between assignment_posts and subjects
ALTER TABLE public.assignment_posts 
ADD CONSTRAINT assignment_posts_subject_id_fkey 
FOREIGN KEY (subject_id) REFERENCES public.subjects(id);

-- Update assignments table to better handle the relationship with assignment posts
ALTER TABLE public.assignments 
ADD COLUMN assignment_post_id UUID REFERENCES public.assignment_posts(id);

-- Update existing assignments table structure if needed
ALTER TABLE public.assignments 
ALTER COLUMN title DROP NOT NULL;

-- Add proper indices for better query performance
CREATE INDEX idx_assignment_posts_subject_id ON public.assignment_posts(subject_id);
CREATE INDEX idx_assignments_assignment_post_id ON public.assignments(assignment_post_id);
CREATE INDEX idx_assignments_student_id ON public.assignments(student_id);