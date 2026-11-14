CREATE TABLE public.exit_interview_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  token text NOT NULL UNIQUE,
  employee_label text NOT NULL DEFAULT '',
  org_name text NOT NULL DEFAULT '',
  expires_at timestamptz NOT NULL,
  revoked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exit_interview_links TO authenticated;
GRANT ALL ON public.exit_interview_links TO service_role;
ALTER TABLE public.exit_interview_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own exit interview links" ON public.exit_interview_links FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.exit_interview_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  link_id uuid REFERENCES public.exit_interview_links(id) ON DELETE SET NULL,
  employee_label text NOT NULL DEFAULT '',
  answers jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, DELETE ON public.exit_interview_responses TO authenticated;
GRANT ALL ON public.exit_interview_responses TO service_role;
ALTER TABLE public.exit_interview_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own exit interview responses" ON public.exit_interview_responses FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "delete own exit interview responses" ON public.exit_interview_responses FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.exit_interview_link_info(_token text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object('org_name', org_name, 'employee_label', employee_label, 'expires_at', expires_at)
  FROM public.exit_interview_links
  WHERE token = _token AND length(_token) >= 32 AND NOT revoked AND expires_at > now()
$$;

CREATE OR REPLACE FUNCTION public.submit_exit_interview(_token text, _answers jsonb)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE lnk record;
BEGIN
  IF _token IS NULL OR length(_token) < 32 THEN RETURN false; END IF;
  SELECT * INTO lnk FROM public.exit_interview_links WHERE token = _token AND NOT revoked AND expires_at > now();
  IF NOT FOUND THEN RETURN false; END IF;
  IF pg_column_size(_answers) > 100000 THEN RAISE EXCEPTION 'Response too large'; END IF;
  INSERT INTO public.exit_interview_responses (user_id, link_id, employee_label, answers)
  VALUES (lnk.user_id, lnk.id, lnk.employee_label, coalesce(_answers, '{}'));
  UPDATE public.exit_interview_links SET revoked = true WHERE id = lnk.id;
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.exit_interview_link_info(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_exit_interview(text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.exit_interview_link_info(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_exit_interview(text, jsonb) TO anon, authenticated;