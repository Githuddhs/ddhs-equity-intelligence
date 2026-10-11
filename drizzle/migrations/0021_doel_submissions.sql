CREATE TABLE public.doel_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  form_type TEXT NOT NULL CHECK (form_type IN ('EEA2', 'EEA4')),
  period_start DATE,
  period_end DATE,
  submission_date DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'submitted', 'acknowledged')),
  reference TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.doel_submissions TO authenticated;
GRANT ALL ON public.doel_submissions TO service_role;

ALTER TABLE public.doel_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage own DoEL submissions"
ON public.doel_submissions
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage all DoEL submissions"
ON public.doel_submissions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_doel_submissions_user ON public.doel_submissions (user_id, created_at DESC);