CREATE TABLE public.ee_deviations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  vacancy_id uuid NOT NULL REFERENCES public.recruitment_vacancies(id) ON DELETE CASCADE,
  candidate_id uuid,
  status text NOT NULL DEFAULT 'draft',
  rating text NOT NULL DEFAULT 'not_available',
  objective jsonb NOT NULL DEFAULT '{}'::jsonb,
  trajectory jsonb NOT NULL DEFAULT '{}'::jsonb,
  funnel jsonb NOT NULL DEFAULT '[]'::jsonb,
  reason_code text NOT NULL DEFAULT '',
  reason_detail text NOT NULL DEFAULT '',
  evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  review jsonb NOT NULL DEFAULT '{}'::jsonb,
  approvals jsonb NOT NULL DEFAULT '[]'::jsonb,
  corrective jsonb NOT NULL DEFAULT '{}'::jsonb,
  thresholds jsonb NOT NULL DEFAULT '{"amberTolerancePp":2,"repeatCount":2}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT deviation_status_ck CHECK (status IN ('draft','submitted','in_review','approved','declined')),
  CONSTRAINT deviation_rating_ck CHECK (rating IN ('green','amber','red','not_available')),
  CONSTRAINT deviation_reason_detail_len CHECK (char_length(reason_detail) <= 4000)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ee_deviations TO authenticated;
GRANT ALL ON public.ee_deviations TO service_role;
ALTER TABLE public.ee_deviations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage deviation requests" ON public.ee_deviations FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Subscribed staff workspace" ON public.ee_deviations FOR ALL TO authenticated
  USING (user_id = public.requested_client() AND public.can_manage_client(user_id, false))
  WITH CHECK (user_id = public.requested_client() AND public.can_manage_client(user_id, false));
CREATE POLICY "Workspace isolation" ON public.ee_deviations AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.requested_client() IS NULL OR (user_id = public.requested_client() AND public.can_manage_client(user_id, false)))
  WITH CHECK (public.requested_client() IS NULL OR (user_id = public.requested_client() AND public.can_manage_client(user_id, false)));
CREATE POLICY "Delegated entitlement boundary" ON public.ee_deviations AS RESTRICTIVE FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.can_manage_client(user_id, false))
  WITH CHECK (user_id = auth.uid() OR public.can_manage_client(user_id, false));
CREATE TRIGGER staff_workspace_write BEFORE INSERT OR UPDATE OR DELETE ON public.ee_deviations
  FOR EACH ROW EXECUTE FUNCTION public.workspace_write();
CREATE TRIGGER ee_deviations_touch BEFORE UPDATE ON public.ee_deviations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX ee_deviations_vacancy_idx ON public.ee_deviations(vacancy_id);
COMMENT ON COLUMN public.ee_deviations.rating IS 'DDHS workflow status derived from the appointment impact, the level annual milestone and the employer tolerance; not a statutory test.';
COMMENT ON COLUMN public.ee_deviations.thresholds IS 'Employer workflow settings applied when this record was assessed, kept for the audit trail.';
COMMENT ON COLUMN public.ee_deviations.approvals IS 'Sequential approval trail: step, person, decision, comments and date for each named reviewer.';
COMMENT ON COLUMN public.ee_deviations.corrective IS 'Corrective intervention required after the deviation: measure, owner, due date, indicator, status and evidence.';

CREATE TABLE public.deviation_settings (
  user_id uuid PRIMARY KEY,
  thresholds jsonb NOT NULL DEFAULT '{"amberTolerancePp":2,"repeatCount":2}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deviation_settings TO authenticated;
GRANT ALL ON public.deviation_settings TO service_role;
ALTER TABLE public.deviation_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage deviation settings" ON public.deviation_settings FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Subscribed staff workspace settings" ON public.deviation_settings FOR ALL TO authenticated
  USING (user_id = public.requested_client() AND public.can_manage_client(user_id, false))
  WITH CHECK (user_id = public.requested_client() AND public.can_manage_client(user_id, false));
CREATE POLICY "Workspace isolation settings" ON public.deviation_settings AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.requested_client() IS NULL OR (user_id = public.requested_client() AND public.can_manage_client(user_id, false)))
  WITH CHECK (public.requested_client() IS NULL OR (user_id = public.requested_client() AND public.can_manage_client(user_id, false)));
CREATE POLICY "Delegated entitlement boundary settings" ON public.deviation_settings AS RESTRICTIVE FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.can_manage_client(user_id, false))
  WITH CHECK (user_id = auth.uid() OR public.can_manage_client(user_id, false));
CREATE TRIGGER staff_workspace_write BEFORE INSERT OR UPDATE OR DELETE ON public.deviation_settings
  FOR EACH ROW EXECUTE FUNCTION public.workspace_write();
CREATE TRIGGER deviation_settings_touch BEFORE UPDATE ON public.deviation_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
COMMENT ON COLUMN public.deviation_settings.thresholds IS 'Employer-configured amber tolerance and repeat-deviation trigger for the deviation workflow.';