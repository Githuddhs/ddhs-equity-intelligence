CREATE TABLE public.stay_interview_links (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(), token text NOT NULL UNIQUE,
 employee_label text NOT NULL DEFAULT '', org_name text NOT NULL DEFAULT '', expires_at timestamptz NOT NULL,
 revoked boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), submitted_at timestamptz,
 created_by uuid NOT NULL DEFAULT auth.uid()
);
GRANT SELECT ON public.stay_interview_links TO authenticated;
GRANT INSERT(user_id,token,employee_label,org_name,expires_at), UPDATE(employee_label,org_name,expires_at,revoked) ON public.stay_interview_links TO authenticated;
GRANT ALL ON public.stay_interview_links TO service_role;
ALTER TABLE public.stay_interview_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Stay links workspace reads" ON public.stay_interview_links FOR SELECT TO authenticated USING ((public.requested_client() IS NULL AND user_id=auth.uid()) OR (user_id=public.requested_client() AND (user_id=auth.uid() OR public.can_manage_client(user_id,true))));
CREATE POLICY "Staff create scoped stay links" ON public.stay_interview_links FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin') AND user_id=public.platform_owner(true));
CREATE POLICY "Staff update scoped stay links" ON public.stay_interview_links FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin') AND user_id=public.platform_owner(true)) WITH CHECK (public.has_role(auth.uid(),'admin') AND user_id=public.platform_owner(true));
CREATE TABLE public.stay_interview_responses (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL,
 link_id uuid REFERENCES public.stay_interview_links(id) ON DELETE SET NULL, employee_label text NOT NULL DEFAULT '',
 answers jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT,DELETE ON public.stay_interview_responses TO authenticated;
GRANT ALL ON public.stay_interview_responses TO service_role;
ALTER TABLE public.stay_interview_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Stay responses workspace reads" ON public.stay_interview_responses FOR SELECT TO authenticated USING ((public.requested_client() IS NULL AND user_id=auth.uid()) OR (user_id=public.requested_client() AND (user_id=auth.uid() OR public.can_manage_client(user_id,true))));
CREATE POLICY "Staff delete scoped stay responses" ON public.stay_interview_responses FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin') AND user_id=public.platform_owner(true));
CREATE TRIGGER staff_workspace_write BEFORE INSERT OR UPDATE ON public.stay_interview_links FOR EACH ROW EXECUTE FUNCTION public.workspace_write();
CREATE TRIGGER staff_workspace_write BEFORE DELETE ON public.stay_interview_responses FOR EACH ROW EXECUTE FUNCTION public.workspace_write();
CREATE OR REPLACE FUNCTION public.stay_interview_link_info(_token text) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT jsonb_build_object('org_name',org_name,'employee_label',employee_label,'expires_at',expires_at) FROM public.stay_interview_links WHERE token=_token AND length(_token)>=32 AND NOT revoked AND submitted_at IS NULL AND expires_at>now()
$$;
CREATE OR REPLACE FUNCTION public.submit_stay_interview(_token text,_answers jsonb) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE lnk record;
BEGIN
 IF _token IS NULL OR length(_token)<32 THEN RETURN false; END IF;
 SELECT * INTO lnk FROM public.stay_interview_links WHERE token=_token FOR UPDATE;
 IF NOT FOUND THEN RETURN false; END IF;
 IF lnk.revoked OR lnk.submitted_at IS NOT NULL OR lnk.expires_at<=clock_timestamp() THEN RETURN false; END IF;
 IF _answers IS NULL OR jsonb_typeof(_answers)<>'object' THEN RAISE EXCEPTION 'Invalid response'; END IF;
 IF pg_column_size(_answers)>100000 THEN RAISE EXCEPTION 'Response too large'; END IF;
 INSERT INTO public.stay_interview_responses(user_id,link_id,employee_label,answers) VALUES(lnk.user_id,lnk.id,lnk.employee_label,_answers);
 UPDATE public.stay_interview_links SET revoked=true,submitted_at=clock_timestamp() WHERE id=lnk.id;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.stay_interview_link_info(text),public.submit_stay_interview(text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.stay_interview_link_info(text),public.submit_stay_interview(text,jsonb) TO anon,authenticated;
COMMENT ON COLUMN public.stay_interview_links.submitted_at IS 'Permanent one-time consumption marker; deleting feedback never reactivates its link.';