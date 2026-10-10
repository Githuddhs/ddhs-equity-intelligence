CREATE TABLE public.evidence_extractions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  file_names text[] NOT NULL DEFAULT '{}',
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  summary text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.evidence_extractions TO authenticated;
GRANT ALL ON public.evidence_extractions TO service_role;
ALTER TABLE public.evidence_extractions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own evidence select" ON public.evidence_extractions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own evidence insert" ON public.evidence_extractions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own evidence delete" ON public.evidence_extractions FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins read evidence" ON public.evidence_extractions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX evidence_extractions_user_idx ON public.evidence_extractions (user_id, created_at DESC);