CREATE TABLE public.inclusion_pulse_links (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(), token text NOT NULL UNIQUE,
 survey_title text NOT NULL DEFAULT 'Inclusion & belonging pulse', participant_label text NOT NULL DEFAULT '', org_name text NOT NULL DEFAULT '',
 expires_at timestamptz NOT NULL, revoked boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(),
 submitted_at timestamptz, created_by uuid NOT NULL DEFAULT auth.uid()
);
GRANT SELECT ON public.inclusion_pulse_links TO authenticated;
GRANT INSERT(user_id,token,survey_title,participant_label,org_name,expires_at), UPDATE(survey_title,participant_label,org_name,expires_at,revoked) ON public.inclusion_pulse_links TO authenticated;
GRANT ALL ON public.inclusion_pulse_links TO service_role;
ALTER TABLE public.inclusion_pulse_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pulse links workspace reads" ON public.inclusion_pulse_links FOR SELECT TO authenticated USING ((public.requested_client() IS NULL AND user_id=auth.uid()) OR (user_id=public.requested_client() AND (user_id=auth.uid() OR public.can_manage_client(user_id,false))));
CREATE POLICY "Staff create scoped pulse links" ON public.inclusion_pulse_links FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin') AND user_id=public.platform_owner(true));
CREATE POLICY "Staff update scoped pulse links" ON public.inclusion_pulse_links FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin') AND user_id=public.platform_owner(true)) WITH CHECK (public.has_role(auth.uid(),'admin') AND user_id=public.platform_owner(true));

CREATE TABLE public.inclusion_pulse_responses (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL,
 link_id uuid REFERENCES public.inclusion_pulse_links(id) ON DELETE SET NULL, participant_label text NOT NULL DEFAULT '',
 answers jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT,DELETE ON public.inclusion_pulse_responses TO authenticated;
GRANT ALL ON public.inclusion_pulse_responses TO service_role;
ALTER TABLE public.inclusion_pulse_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read scoped pulse responses" ON public.inclusion_pulse_responses FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin') AND ((public.requested_client() IS NULL AND user_id=auth.uid()) OR (user_id=public.requested_client() AND public.can_manage_client(user_id,true))));
CREATE POLICY "Staff delete scoped pulse responses" ON public.inclusion_pulse_responses FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin') AND user_id=public.platform_owner(true));
CREATE TRIGGER staff_workspace_write BEFORE INSERT OR UPDATE ON public.inclusion_pulse_links FOR EACH ROW EXECUTE FUNCTION public.workspace_write();
CREATE TRIGGER staff_workspace_write BEFORE DELETE ON public.inclusion_pulse_responses FOR EACH ROW EXECUTE FUNCTION public.workspace_write();

CREATE OR REPLACE FUNCTION public.inclusion_pulse_link_info(_token text) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT jsonb_build_object('survey_title',survey_title,'org_name',org_name,'participant_label',participant_label,'expires_at',expires_at)
 FROM public.inclusion_pulse_links WHERE token=_token AND length(_token)>=32 AND NOT revoked AND submitted_at IS NULL AND expires_at>now()
$$;

CREATE OR REPLACE FUNCTION public.submit_inclusion_pulse(_token text,_answers jsonb) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE lnk record; clean jsonb;
BEGIN
 IF _token IS NULL OR length(_token)<32 THEN RETURN false; END IF;
 IF _answers IS NULL OR jsonb_typeof(_answers)<>'object' OR pg_column_size(_answers)>50000 THEN RAISE EXCEPTION 'Invalid response'; END IF;
 IF jsonb_typeof(_answers->'ratings')<>'object' OR NOT EXISTS (
   SELECT 1 FROM jsonb_each_text(_answers->'ratings') e WHERE e.key IN (
    'belong_accepted','belong_authentic','belong_contribute','voice_safe','voice_heard','voice_concerns',
    'fair_treatment','fair_opportunity','fair_process','manager_respect','manager_inclusion','manager_action',
    'access_accommodation','access_tools'
   ) AND e.value IN ('1','2','3','4','5')
 ) THEN RAISE EXCEPTION 'At least one rating is required'; END IF;
 IF EXISTS (
   SELECT 1 FROM jsonb_each_text(_answers->'ratings') e WHERE e.key NOT IN (
    'belong_accepted','belong_authentic','belong_contribute','voice_safe','voice_heard','voice_concerns',
    'fair_treatment','fair_opportunity','fair_process','manager_respect','manager_inclusion','manager_action',
    'access_accommodation','access_tools'
   ) OR e.value NOT IN ('0','1','2','3','4','5')
 ) THEN RAISE EXCEPTION 'Invalid rating'; END IF;
 IF _answers ? 'barriers' AND (jsonb_typeof(_answers->'barriers')<>'array' OR EXISTS (
   SELECT 1 FROM jsonb_array_elements_text(_answers->'barriers') b WHERE b.value NOT IN (
    'Unfair discrimination','Harassment or bullying','Lack of reasonable accommodation','Exclusion from opportunities',
    'Exclusion from meetings or networks','Language or cultural exclusion','None of these','Prefer not to say'
   )
 )) THEN RAISE EXCEPTION 'Invalid barrier'; END IF;
 SELECT * INTO lnk FROM public.inclusion_pulse_links WHERE token=_token FOR UPDATE;
 IF NOT FOUND THEN RETURN false; END IF;
 IF lnk.revoked OR lnk.submitted_at IS NOT NULL OR lnk.expires_at<=clock_timestamp() THEN RETURN false; END IF;
 clean:=jsonb_build_object(
   'version','inclusion-pulse-v1',
   'unit',left(coalesce(_answers->>'unit',''),200),
   'occupational_level',left(coalesce(_answers->>'occupational_level',''),200),
   'ratings',_answers->'ratings',
   'barriers',coalesce(_answers->'barriers','[]'::jsonb)
 );
 INSERT INTO public.inclusion_pulse_responses(user_id,link_id,participant_label,answers) VALUES(lnk.user_id,lnk.id,lnk.participant_label,clean);
 UPDATE public.inclusion_pulse_links SET revoked=true,submitted_at=clock_timestamp() WHERE id=lnk.id;
 RETURN true;
END $$;

CREATE OR REPLACE FUNCTION public.inclusion_pulse_summary() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE v_client uuid; v_total integer; v_issued integer; v_completed integer; v_open integer;
BEGIN
 v_client:=public.requested_client();
 IF v_client IS NULL THEN v_client:=auth.uid(); END IF;
 IF v_client IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 IF v_client<>auth.uid() THEN
   IF public.has_role(auth.uid(),'admin') THEN
     IF NOT public.can_manage_client(v_client,true) THEN RAISE EXCEPTION 'Client permission required'; END IF;
   ELSIF NOT EXISTS (SELECT 1 FROM public.client_team_members m WHERE m.client_id=v_client AND m.user_id=auth.uid() AND m.active) THEN
     RAISE EXCEPTION 'Workspace access denied';
   END IF;
 END IF;
 SELECT count(*) INTO v_total FROM public.inclusion_pulse_responses WHERE user_id=v_client;
 SELECT count(*),count(*) FILTER (WHERE submitted_at IS NOT NULL),count(*) FILTER (WHERE submitted_at IS NULL AND NOT revoked AND expires_at>now())
 INTO v_issued,v_completed,v_open FROM public.inclusion_pulse_links WHERE user_id=v_client;
 IF v_total<3 THEN
   RETURN jsonb_build_object('total',v_total,'links',jsonb_build_object('issued',v_issued,'completed',v_completed,'open',v_open),
    'suppressed',true,'minimumResponses',3,'items','[]'::jsonb,'barriers','[]'::jsonb);
 END IF;
 RETURN jsonb_build_object(
   'total',v_total,'links',jsonb_build_object('issued',v_issued,'completed',v_completed,'open',v_open),
   'suppressed',false,'minimumResponses',3,
   'items',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',key,'answered',answered,'average',average,'agreeShare',agree_share) ORDER BY key),'[]'::jsonb) FROM (
     SELECT e.key,count(e.value) FILTER (WHERE e.value IN ('1','2','3','4','5')) AS answered,
       round(avg(e.value::numeric) FILTER (WHERE e.value IN ('1','2','3','4','5')),1) AS average,
       round((count(*) FILTER (WHERE e.value IN ('4','5')))::numeric/nullif(count(*) FILTER (WHERE e.value IN ('1','2','3','4','5')),0),4) AS agree_share
     FROM public.inclusion_pulse_responses r CROSS JOIN LATERAL jsonb_each_text(r.answers->'ratings') e
     WHERE r.user_id=v_client GROUP BY e.key
   ) stats WHERE answered>0),
   'barriers',(SELECT coalesce(jsonb_agg(jsonb_build_object('label',label,'count',count,'share',share) ORDER BY count DESC,label),'[]'::jsonb) FROM (
     SELECT b.value AS label,count(*) AS count,round(count(*)::numeric/v_total,4) AS share
     FROM public.inclusion_pulse_responses r CROSS JOIN LATERAL jsonb_array_elements_text(r.answers->'barriers') b
     WHERE r.user_id=v_client AND b.value IN (
      'Unfair discrimination','Harassment or bullying','Lack of reasonable accommodation','Exclusion from opportunities',
      'Exclusion from meetings or networks','Language or cultural exclusion','None of these','Prefer not to say'
     ) GROUP BY b.value
   ) barrier_stats)
 );
END $$;

REVOKE ALL ON FUNCTION public.inclusion_pulse_link_info(text),public.submit_inclusion_pulse(text,jsonb),public.inclusion_pulse_summary() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.inclusion_pulse_link_info(text),public.submit_inclusion_pulse(text,jsonb) TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.inclusion_pulse_summary() TO authenticated;
COMMENT ON COLUMN public.inclusion_pulse_links.submitted_at IS 'Permanent one-time consumption marker; deleting feedback never reactivates its link.';
COMMENT ON FUNCTION public.inclusion_pulse_summary() IS 'Aggregate-only client and staff results; scores and barriers are suppressed until three responses exist.';