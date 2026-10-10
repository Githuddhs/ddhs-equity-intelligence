CREATE TABLE public.workforce_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'upload')),
  file_name text,
  total_headcount integer NOT NULL DEFAULT 0,
  counts jsonb NOT NULL DEFAULT '{}'::jsonb,
  disability jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workforce_snapshots TO authenticated;
GRANT ALL ON public.workforce_snapshots TO service_role;

ALTER TABLE public.workforce_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own snapshots select" ON public.workforce_snapshots FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own snapshots insert" ON public.workforce_snapshots FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own snapshots update" ON public.workforce_snapshots FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own snapshots delete" ON public.workforce_snapshots FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins read snapshots" ON public.workforce_snapshots FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update snapshots" ON public.workforce_snapshots FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER workforce_snapshots_touch BEFORE UPDATE ON public.workforce_snapshots FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();