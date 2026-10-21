ALTER TABLE public.recruitment_vacancies
  ADD COLUMN governance jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN appointment_review jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION public.guard_candidate_appointment()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE r jsonb;
BEGIN
  IF NEW.stage = 'appointed' AND (TG_OP = 'INSERT' OR OLD.stage IS DISTINCT FROM 'appointed') THEN
    SELECT appointment_review INTO r FROM public.recruitment_vacancies WHERE id = NEW.vacancy_id;
    IF r IS NULL OR r->>'candidate_id' IS DISTINCT FROM NEW.id::text OR r->>'decision' IS DISTINCT FROM 'approved'
       OR coalesce(btrim(r->>'reviewer'), '') = '' THEN
      RAISE EXCEPTION 'Appointment requires a recorded human review approving this candidate';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER recruitment_candidates_appointment_guard BEFORE INSERT OR UPDATE ON public.recruitment_candidates
  FOR EACH ROW EXECUTE FUNCTION public.guard_candidate_appointment();