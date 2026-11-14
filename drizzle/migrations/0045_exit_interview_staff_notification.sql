ALTER TABLE public.exit_interview_links ADD COLUMN created_by uuid DEFAULT auth.uid();
ALTER TABLE public.exit_interview_links ADD COLUMN notified_at timestamptz;