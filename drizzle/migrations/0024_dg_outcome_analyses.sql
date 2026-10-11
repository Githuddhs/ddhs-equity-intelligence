CREATE TABLE public.dg_outcome_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  file_names text[] NOT NULL DEFAULT '{}',
  result text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.dg_outcome_analyses TO authenticated;
GRANT ALL ON public.dg_outcome_analyses TO service_role;
ALTER TABLE public.dg_outcome_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own or staff" ON public.dg_outcome_analyses FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "insert own" ON public.dg_outcome_analyses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete own or staff" ON public.dg_outcome_analyses FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
ALTER TABLE public.portal_documents DROP CONSTRAINT portal_documents_area_check;
ALTER TABLE public.portal_documents ADD CONSTRAINT portal_documents_area_check CHECK (area = ANY (ARRAY['eea12','plan','dg','doel','dg_outcome']));