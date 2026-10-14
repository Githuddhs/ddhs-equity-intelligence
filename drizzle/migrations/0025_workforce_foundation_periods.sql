CREATE TABLE public.workforce_foundation_periods (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL DEFAULT auth.uid(),
 period_start date NOT NULL,
 period_end date NOT NULL,
 snapshot_date date NOT NULL,
 organisation jsonb NOT NULL DEFAULT '{}'::jsonb,
 employees jsonb NOT NULL DEFAULT '[]'::jsonb,
 remuneration jsonb NOT NULL DEFAULT '[]'::jsonb,
 movements jsonb NOT NULL DEFAULT '[]'::jsonb,
 warnings jsonb NOT NULL DEFAULT '[]'::jsonb,
 snapshot_id uuid REFERENCES public.workforce_snapshots(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(user_id, period_start, period_end),
 CHECK(period_start <= period_end),
 CHECK(snapshot_date BETWEEN period_start AND period_end),
 CHECK(jsonb_typeof(employees) = 'array'),
 CHECK(jsonb_typeof(remuneration) = 'array'),
 CHECK(jsonb_typeof(movements) = 'array')
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workforce_foundation_periods TO authenticated;
GRANT ALL ON public.workforce_foundation_periods TO service_role;
ALTER TABLE public.workforce_foundation_periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Account owner only workforce records" ON public.workforce_foundation_periods FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
COMMENT ON TABLE public.workforce_foundation_periods IS 'Individual employee, salary and disability records are owner-only. Staff and managers receive no blanket access. Only non-identifying aggregates enter shared workforce snapshots.';
CREATE OR REPLACE FUNCTION public.save_workforce_foundation(p_record jsonb, p_snapshot jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE v_id uuid; v_snapshot uuid; v_old_snapshot uuid;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 SELECT id, snapshot_id INTO v_id, v_old_snapshot FROM public.workforce_foundation_periods WHERE user_id=auth.uid() AND period_start=(p_record->>'period_start')::date AND period_end=(p_record->>'period_end')::date FOR UPDATE;
 IF v_old_snapshot IS NOT NULL THEN
  UPDATE public.workforce_snapshots SET snapshot_date=(p_record->>'snapshot_date')::date, counts=p_snapshot->'counts', disability=p_snapshot->'disability', units=p_snapshot->'units', total_headcount=(p_snapshot->>'total_headcount')::integer, updated_at=now() WHERE id=v_old_snapshot AND user_id=auth.uid();
  v_snapshot := v_old_snapshot;
 ELSE
  INSERT INTO public.workforce_snapshots(user_id,snapshot_date,source,total_headcount,counts,disability,units,notes) VALUES(auth.uid(),(p_record->>'snapshot_date')::date,'manual',(p_snapshot->>'total_headcount')::integer,p_snapshot->'counts',p_snapshot->'disability',p_snapshot->'units','Workforce Foundation reporting-period records; individual details restricted to account owner') RETURNING id INTO v_snapshot;
 END IF;
 INSERT INTO public.workforce_foundation_periods(user_id,period_start,period_end,snapshot_date,organisation,employees,remuneration,movements,warnings,snapshot_id) VALUES(auth.uid(),(p_record->>'period_start')::date,(p_record->>'period_end')::date,(p_record->>'snapshot_date')::date,p_record->'organisation',p_record->'employees',p_record->'remuneration',p_record->'movements',p_record->'warnings',v_snapshot)
 ON CONFLICT(user_id,period_start,period_end) DO UPDATE SET snapshot_date=EXCLUDED.snapshot_date,organisation=EXCLUDED.organisation,employees=EXCLUDED.employees,remuneration=EXCLUDED.remuneration,movements=EXCLUDED.movements,warnings=EXCLUDED.warnings,snapshot_id=EXCLUDED.snapshot_id,updated_at=now() RETURNING id INTO v_id;
 RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION public.save_workforce_foundation(jsonb,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_workforce_foundation(jsonb,jsonb) TO authenticated;
CREATE OR REPLACE FUNCTION public.delete_workforce_foundation(p_id uuid) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE v_snapshot uuid;
BEGIN
 SELECT snapshot_id INTO v_snapshot FROM public.workforce_foundation_periods WHERE id=p_id AND user_id=auth.uid();
 DELETE FROM public.workforce_foundation_periods WHERE id=p_id AND user_id=auth.uid();
 DELETE FROM public.workforce_snapshots WHERE id=v_snapshot AND user_id=auth.uid();
END $$;
REVOKE ALL ON FUNCTION public.delete_workforce_foundation(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.delete_workforce_foundation(uuid) TO authenticated;