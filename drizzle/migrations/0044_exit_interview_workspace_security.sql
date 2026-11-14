ALTER TABLE public.exit_interview_links ADD COLUMN submitted_at timestamptz;
UPDATE public.exit_interview_links l SET submitted_at = (SELECT min(r.created_at) FROM public.exit_interview_responses r WHERE r.link_id=l.id) WHERE EXISTS(SELECT 1 FROM public.exit_interview_responses r WHERE r.link_id=l.id);
DROP POLICY "own exit interview links" ON public.exit_interview_links;
DROP POLICY "own exit interview responses" ON public.exit_interview_responses;
DROP POLICY "delete own exit interview responses" ON public.exit_interview_responses;
CREATE POLICY "Exit links workspace reads" ON public.exit_interview_links FOR SELECT TO authenticated USING ((public.requested_client() IS NULL AND user_id=auth.uid()) OR (user_id=public.requested_client() AND (user_id=auth.uid() OR public.can_manage_client(user_id,true))));
CREATE POLICY "Staff create scoped exit links" ON public.exit_interview_links FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin') AND user_id=public.platform_owner(true));
CREATE POLICY "Staff update scoped exit links" ON public.exit_interview_links FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin') AND user_id=public.platform_owner(true)) WITH CHECK (public.has_role(auth.uid(),'admin') AND user_id=public.platform_owner(true));
CREATE POLICY "Exit responses workspace reads" ON public.exit_interview_responses FOR SELECT TO authenticated USING ((public.requested_client() IS NULL AND user_id=auth.uid()) OR (user_id=public.requested_client() AND (user_id=auth.uid() OR public.can_manage_client(user_id,true))));
CREATE POLICY "Staff delete scoped exit responses" ON public.exit_interview_responses FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin') AND user_id=public.platform_owner(true));
REVOKE INSERT,UPDATE,DELETE ON public.exit_interview_links FROM authenticated;
GRANT INSERT(user_id,token,employee_label,org_name,expires_at), UPDATE(employee_label,org_name,expires_at,revoked) ON public.exit_interview_links TO authenticated;
CREATE TRIGGER staff_workspace_write BEFORE INSERT OR UPDATE ON public.exit_interview_links FOR EACH ROW EXECUTE FUNCTION public.workspace_write();
CREATE TRIGGER staff_workspace_write BEFORE DELETE ON public.exit_interview_responses FOR EACH ROW EXECUTE FUNCTION public.workspace_write();
CREATE OR REPLACE FUNCTION public.exit_interview_link_info(_token text) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT jsonb_build_object('org_name',org_name,'employee_label',employee_label,'expires_at',expires_at) FROM public.exit_interview_links WHERE token=_token AND length(_token)>=32 AND NOT revoked AND submitted_at IS NULL AND expires_at>now()
$$;
CREATE OR REPLACE FUNCTION public.submit_exit_interview(_token text,_answers jsonb) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE lnk record;
BEGIN
 IF _token IS NULL OR length(_token)<32 THEN RETURN false; END IF;
 SELECT * INTO lnk FROM public.exit_interview_links WHERE token=_token FOR UPDATE;
 IF NOT FOUND THEN RETURN false; END IF;
 IF lnk.revoked OR lnk.submitted_at IS NOT NULL OR lnk.expires_at<=clock_timestamp() THEN RETURN false; END IF;
 IF pg_column_size(_answers)>100000 THEN RAISE EXCEPTION 'Response too large'; END IF;
 INSERT INTO public.exit_interview_responses(user_id,link_id,employee_label,answers) VALUES(lnk.user_id,lnk.id,lnk.employee_label,coalesce(_answers,'{}'));
 UPDATE public.exit_interview_links SET revoked=true,submitted_at=clock_timestamp() WHERE id=lnk.id;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.exit_interview_link_info(text),public.submit_exit_interview(text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.exit_interview_link_info(text),public.submit_exit_interview(text,jsonb) TO anon,authenticated;
COMMENT ON COLUMN public.exit_interview_links.submitted_at IS 'Permanent one-time consumption marker; deleting feedback never reactivates its link.';