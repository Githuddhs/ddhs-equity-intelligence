ALTER TABLE public.workforce_snapshots DROP CONSTRAINT IF EXISTS workforce_snapshots_source_check;
ALTER TABLE public.workforce_snapshots ADD CONSTRAINT workforce_snapshots_source_check CHECK (source = ANY (ARRAY['manual'::text, 'upload'::text, 'employee_profile'::text]));
CREATE OR REPLACE FUNCTION public.save_workforce_foundation(p_record jsonb, p_snapshot jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE v_id uuid; v_snapshot uuid; v_old_snapshot uuid;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 SELECT id, snapshot_id INTO v_id, v_old_snapshot FROM public.workforce_foundation_periods WHERE user_id=auth.uid() AND period_start=(p_record->>'period_start')::date AND period_end=(p_record->>'period_end')::date FOR UPDATE;
 IF v_old_snapshot IS NOT NULL THEN
  UPDATE public.workforce_snapshots SET snapshot_date=(p_record->>'snapshot_date')::date, source='employee_profile', counts=p_snapshot->'counts', disability=p_snapshot->'disability', units=p_snapshot->'units', total_headcount=(p_snapshot->>'total_headcount')::integer, updated_at=now() WHERE id=v_old_snapshot AND user_id=auth.uid();
  v_snapshot := v_old_snapshot;
 ELSE
  INSERT INTO public.workforce_snapshots(user_id,snapshot_date,source,total_headcount,counts,disability,units,notes) VALUES(auth.uid(),(p_record->>'snapshot_date')::date,'employee_profile',(p_snapshot->>'total_headcount')::integer,p_snapshot->'counts',p_snapshot->'disability',p_snapshot->'units','Derived from Employee Profiles; individual details restricted to account owner') RETURNING id INTO v_snapshot;
 END IF;
 INSERT INTO public.workforce_foundation_periods(user_id,period_start,period_end,snapshot_date,organisation,employees,remuneration,movements,warnings,snapshot_id) VALUES(auth.uid(),(p_record->>'period_start')::date,(p_record->>'period_end')::date,(p_record->>'snapshot_date')::date,p_record->'organisation',p_record->'employees',p_record->'remuneration',p_record->'movements',p_record->'warnings',v_snapshot)
 ON CONFLICT(user_id,period_start,period_end) DO UPDATE SET snapshot_date=EXCLUDED.snapshot_date,organisation=EXCLUDED.organisation,employees=EXCLUDED.employees,remuneration=EXCLUDED.remuneration,movements=EXCLUDED.movements,warnings=EXCLUDED.warnings,snapshot_id=EXCLUDED.snapshot_id,updated_at=now() RETURNING id INTO v_id;
 RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION public.save_workforce_foundation(jsonb,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_workforce_foundation(jsonb,jsonb) TO authenticated;
UPDATE public.workforce_snapshots s SET source='employee_profile' WHERE EXISTS (SELECT 1 FROM public.workforce_foundation_periods p WHERE p.snapshot_id=s.id);
COMMENT ON COLUMN public.workforce_snapshots.source IS 'employee_profile = derived from Employee Profiles (the only source reports use); manual/upload = legacy separately captured totals, not used in reports';