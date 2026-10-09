CREATE TABLE public.eea12_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  sector text NOT NULL DEFAULT '',
  level text NOT NULL,
  total_headcount integer NOT NULL DEFAULT 0,
  counts jsonb NOT NULL,
  eap jsonb NOT NULL,
  targets jsonb NOT NULL,
  results jsonb NOT NULL,
  ai_summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.eea12_analyses TO authenticated;
GRANT ALL ON public.eea12_analyses TO service_role;
ALTER TABLE public.eea12_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own analyses" ON public.eea12_analyses FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own analyses" ON public.eea12_analyses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own analyses" ON public.eea12_analyses FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own analyses" ON public.eea12_analyses FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX eea12_analyses_user_created_idx ON public.eea12_analyses (user_id, created_at DESC);