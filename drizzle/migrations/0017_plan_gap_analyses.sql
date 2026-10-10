CREATE TABLE public.plan_gap_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  file_name text NOT NULL,
  plan_text text NOT NULL DEFAULT '',
  workforce jsonb NOT NULL DEFAULT '{}'::jsonb,
  result text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.plan_gap_analyses TO authenticated;
GRANT ALL ON public.plan_gap_analyses TO service_role;
ALTER TABLE public.plan_gap_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own gap analyses select" ON public.plan_gap_analyses FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own gap analyses insert" ON public.plan_gap_analyses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own gap analyses delete" ON public.plan_gap_analyses FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins read gap analyses" ON public.plan_gap_analyses FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX plan_gap_analyses_user_idx ON public.plan_gap_analyses (user_id, created_at DESC);