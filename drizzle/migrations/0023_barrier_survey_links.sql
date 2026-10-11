CREATE TABLE public.barrier_survey_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  token text NOT NULL UNIQUE,
  label text NOT NULL DEFAULT '',
  org_name text NOT NULL DEFAULT '',
  expires_at timestamptz NOT NULL,
  revoked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.barrier_survey_links TO authenticated;
GRANT ALL ON public.barrier_survey_links TO service_role;
ALTER TABLE public.barrier_survey_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own survey links" ON public.barrier_survey_links FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.survey_link_info(_token text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object('org_name', org_name, 'label', label, 'expires_at', expires_at)
  FROM public.barrier_survey_links
  WHERE token = _token AND length(_token) >= 32 AND NOT revoked AND expires_at > now()
$$;

CREATE OR REPLACE FUNCTION public.submit_barrier_survey(_token text, _answers jsonb, _comments jsonb, _priorities jsonb, _open_feedback jsonb, _profile jsonb)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE lnk record;
BEGIN
  IF _token IS NULL OR length(_token) < 32 THEN RETURN false; END IF;
  SELECT * INTO lnk FROM public.barrier_survey_links WHERE token = _token AND NOT revoked AND expires_at > now();
  IF NOT FOUND THEN RETURN false; END IF;
  IF pg_column_size(_answers) + pg_column_size(_open_feedback) + pg_column_size(_comments) > 200000 THEN RAISE EXCEPTION 'Response too large'; END IF;
  INSERT INTO public.barrier_responses (user_id, org_name, answers, comments, priorities, open_feedback, profile)
  VALUES (lnk.user_id, nullif(lnk.org_name, ''), coalesce(_answers,'{}'), coalesce(_comments,'{}'), coalesce(_priorities,'[]'), coalesce(_open_feedback,'{}'),
    coalesce(_profile,'{}') || jsonb_build_object('source','survey_link','link_id',lnk.id));
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.survey_link_info(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_barrier_survey(text, jsonb, jsonb, jsonb, jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.survey_link_info(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_barrier_survey(text, jsonb, jsonb, jsonb, jsonb, jsonb) TO anon, authenticated;