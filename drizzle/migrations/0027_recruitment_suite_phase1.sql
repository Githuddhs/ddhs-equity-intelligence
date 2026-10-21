CREATE TABLE public.recruitment_vacancies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL,
  occupational_level text NOT NULL,
  organisation text NOT NULL DEFAULT '',
  division text NOT NULL DEFAULT '',
  department text NOT NULL DEFAULT '',
  section text NOT NULL DEFAULT '',
  sector text NOT NULL DEFAULT '',
  province text NOT NULL DEFAULT '',
  reason text NOT NULL DEFAULT '',
  scarce_skill boolean NOT NULL DEFAULT false,
  in_workforce_plan boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'draft',
  priority jsonb NOT NULL DEFAULT '{}'::jsonb,
  job_profile text NOT NULL DEFAULT '',
  criteria jsonb NOT NULL DEFAULT '[]'::jsonb,
  sourcing jsonb NOT NULL DEFAULT '{}'::jsonb,
  checks jsonb NOT NULL DEFAULT '{}'::jsonb,
  approver_name text NOT NULL DEFAULT '',
  approval_note text NOT NULL DEFAULT '',
  approved_at timestamptz,
  closing_date date,
  public_token text NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', ''),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT vacancy_status_ck CHECK (status IN ('draft','pending_approval','approved','advertised','closed')),
  CONSTRAINT vacancy_title_len CHECK (char_length(title) BETWEEN 1 AND 200)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recruitment_vacancies TO authenticated;
GRANT ALL ON public.recruitment_vacancies TO service_role;
ALTER TABLE public.recruitment_vacancies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage vacancies" ON public.recruitment_vacancies FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER recruitment_vacancies_touch BEFORE UPDATE ON public.recruitment_vacancies
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.recruitment_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vacancy_id uuid NOT NULL REFERENCES public.recruitment_vacancies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  race text NOT NULL DEFAULT '',
  gender text NOT NULL DEFAULT '',
  disability boolean NOT NULL DEFAULT false,
  foreign_national boolean NOT NULL DEFAULT false,
  source text NOT NULL DEFAULT 'staff',
  cv_path text,
  meets_minimum boolean,
  stage text NOT NULL DEFAULT 'applied',
  interview_at timestamptz,
  assessment_score numeric,
  notes text NOT NULL DEFAULT '',
  history jsonb NOT NULL DEFAULT '[]'::jsonb,
  consent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT candidate_stage_ck CHECK (stage IN ('applied','longlisted','shortlisted','interview','assessed','recommended','offered','appointed','rejected','withdrawn')),
  CONSTRAINT candidate_name_len CHECK (char_length(full_name) BETWEEN 1 AND 150)
);
CREATE INDEX recruitment_candidates_vacancy_idx ON public.recruitment_candidates(vacancy_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recruitment_candidates TO authenticated;
GRANT ALL ON public.recruitment_candidates TO service_role;
ALTER TABLE public.recruitment_candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage candidates" ON public.recruitment_candidates FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.recruitment_vacancies v WHERE v.id = vacancy_id AND v.user_id = auth.uid()));
CREATE TRIGGER recruitment_candidates_touch BEFORE UPDATE ON public.recruitment_candidates
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.vacancy_public(_token text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object('id', v.id, 'title', v.title, 'occupational_level', v.occupational_level,
    'organisation', v.organisation, 'department', v.department, 'province', v.province,
    'job_profile', v.job_profile, 'criteria', v.criteria, 'closing_date', v.closing_date)
  FROM public.recruitment_vacancies v
  WHERE v.public_token = _token AND v.status = 'advertised'
    AND (v.closing_date IS NULL OR v.closing_date >= current_date)
    AND coalesce((v.sourcing->>'external')::boolean, true)
$$;
GRANT EXECUTE ON FUNCTION public.vacancy_public(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.vacancy_open(_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.recruitment_vacancies v WHERE v.id = _id AND v.status = 'advertised'
    AND (v.closing_date IS NULL OR v.closing_date >= current_date))
$$;
GRANT EXECUTE ON FUNCTION public.vacancy_open(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.apply_to_vacancy(_token text, _application jsonb)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v public.recruitment_vacancies; n text; e text; cv text;
BEGIN
  SELECT * INTO v FROM public.recruitment_vacancies WHERE public_token = _token AND status = 'advertised'
    AND (closing_date IS NULL OR closing_date >= current_date);
  IF NOT FOUND THEN RETURN false; END IF;
  n := btrim(coalesce(_application->>'full_name', ''));
  e := btrim(coalesce(_application->>'email', ''));
  cv := nullif(_application->>'cv_path', '');
  IF char_length(n) < 2 OR char_length(n) > 150 OR e !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' OR char_length(e) > 255 THEN
    RAISE EXCEPTION 'Invalid application';
  END IF;
  IF coalesce((_application->>'consent')::boolean, false) IS NOT TRUE THEN RAISE EXCEPTION 'Consent required'; END IF;
  IF cv IS NOT NULL AND split_part(cv, '/', 1) <> v.id::text THEN RAISE EXCEPTION 'Invalid CV'; END IF;
  IF (SELECT count(*) FROM public.recruitment_candidates WHERE vacancy_id = v.id AND lower(email) = lower(e)) > 0 THEN
    RAISE EXCEPTION 'You have already applied for this vacancy';
  END IF;
  INSERT INTO public.recruitment_candidates (vacancy_id, user_id, full_name, email, phone, race, gender, disability, foreign_national, source, cv_path, consent, history)
  VALUES (v.id, v.user_id, n, e, left(coalesce(_application->>'phone', ''), 40), left(coalesce(_application->>'race', ''), 40),
    left(coalesce(_application->>'gender', ''), 40), coalesce((_application->>'disability')::boolean, false),
    coalesce((_application->>'foreign_national')::boolean, false), 'online', cv, true,
    jsonb_build_array(jsonb_build_object('stage', 'applied', 'at', now(), 'note', 'Online application')));
  RETURN true;
END $$;
GRANT EXECUTE ON FUNCTION public.apply_to_vacancy(text, jsonb) TO anon, authenticated;

CREATE POLICY "Applicants upload CVs to open vacancies" ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'recruitment-cvs' AND public.vacancy_open(((storage.foldername(name))[1])::uuid));
CREATE POLICY "Vacancy owners read CVs" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'recruitment-cvs' AND EXISTS (SELECT 1 FROM public.recruitment_vacancies v WHERE v.id::text = (storage.foldername(name))[1] AND v.user_id = auth.uid()));
CREATE POLICY "Vacancy owners upload CVs" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'recruitment-cvs' AND EXISTS (SELECT 1 FROM public.recruitment_vacancies v WHERE v.id::text = (storage.foldername(name))[1] AND v.user_id = auth.uid()));
CREATE POLICY "Vacancy owners delete CVs" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'recruitment-cvs' AND EXISTS (SELECT 1 FROM public.recruitment_vacancies v WHERE v.id::text = (storage.foldername(name))[1] AND v.user_id = auth.uid()));