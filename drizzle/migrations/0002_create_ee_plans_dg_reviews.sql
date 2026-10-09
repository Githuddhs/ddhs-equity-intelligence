CREATE TABLE public.ee_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL DEFAULT 'Employment Equity Plan',
  company text NOT NULL DEFAULT '',
  sector text NOT NULL DEFAULT '',
  start_date date,
  end_date date,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ee_plans TO authenticated;
GRANT ALL ON public.ee_plans TO service_role;
ALTER TABLE public.ee_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own plans select" ON public.ee_plans FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own plans insert" ON public.ee_plans FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own plans update" ON public.ee_plans FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own plans delete" ON public.ee_plans FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.dg_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  plan_id uuid REFERENCES public.ee_plans(id) ON DELETE SET NULL,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  score integer NOT NULL DEFAULT 0,
  ai_assessment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dg_reviews TO authenticated;
GRANT ALL ON public.dg_reviews TO service_role;
ALTER TABLE public.dg_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own reviews select" ON public.dg_reviews FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own reviews insert" ON public.dg_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own reviews update" ON public.dg_reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own reviews delete" ON public.dg_reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER ee_plans_touch BEFORE UPDATE ON public.ee_plans FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER dg_reviews_touch BEFORE UPDATE ON public.dg_reviews FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();