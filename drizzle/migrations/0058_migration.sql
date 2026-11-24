CREATE TABLE public.ee_workflow_config (
  id text PRIMARY KEY DEFAULT 'default' CHECK (id = 'default'),
  flow jsonb NOT NULL DEFAULT '[]'::jsonb,
  duties jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ee_workflow_config TO anon;
GRANT SELECT, INSERT, UPDATE ON public.ee_workflow_config TO authenticated;
GRANT ALL ON public.ee_workflow_config TO service_role;
ALTER TABLE public.ee_workflow_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read the public workflow" ON public.ee_workflow_config FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Staff insert workflow" ON public.ee_workflow_config FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Staff update workflow" ON public.ee_workflow_config FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));