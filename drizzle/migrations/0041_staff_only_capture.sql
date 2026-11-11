CREATE OR REPLACE FUNCTION public.staff_only_capture()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Records are captured by DDHS staff for audit purposes. Please upload your workforce files for DDHS to capture.';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['workforce_snapshots','workforce_foundation_periods','eea12_analyses','ee_plans','dg_reviews','doel_submissions','plan_gap_analyses','evidence_extractions','dg_outcome_analyses'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS staff_only_capture ON public.%I', t);
    EXECUTE format('CREATE TRIGGER staff_only_capture BEFORE INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.staff_only_capture()', t);
  END LOOP;
END $$;