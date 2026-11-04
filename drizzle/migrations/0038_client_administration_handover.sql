CREATE TABLE public.client_handovers (
 client_id uuid PRIMARY KEY,
 requested_by uuid NOT NULL,
 requested_at timestamptz NOT NULL DEFAULT now(),
 notes text NOT NULL DEFAULT '',
 accepted_at timestamptz,
 staff_support_enabled boolean NOT NULL DEFAULT false
);
GRANT SELECT ON public.client_handovers TO authenticated;
GRANT ALL ON public.client_handovers TO service_role;
ALTER TABLE public.client_handovers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner and staff read handover" ON public.client_handovers FOR SELECT TO authenticated USING (client_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE FUNCTION public.request_client_handover(p_client uuid,p_notes text DEFAULT '') RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NOT public.has_role(auth.uid(),'admin') OR NOT public.can_manage_client(p_client,false) OR EXISTS(SELECT 1 FROM public.staff_demo_companies WHERE id=p_client) THEN RAISE EXCEPTION 'Active client subscription and staff access required'; END IF;
 INSERT INTO public.client_handovers(client_id,requested_by,notes) VALUES(p_client,auth.uid(),left(p_notes,2000)) ON CONFLICT(client_id) DO UPDATE SET requested_by=excluded.requested_by,requested_at=now(),notes=excluded.notes WHERE client_handovers.accepted_at IS NULL;
 INSERT INTO public.client_staff_audit(staff_id,client_id,action) VALUES(auth.uid(),p_client,'REQUEST_HANDOVER');
END $$;
CREATE FUNCTION public.accept_client_handover() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 UPDATE public.client_handovers SET accepted_at=now(),staff_support_enabled=false WHERE client_id=auth.uid() AND accepted_at IS NULL;
 IF NOT FOUND THEN RAISE EXCEPTION 'No pending handover for your account'; END IF;
 UPDATE public.client_staff_permissions SET sensitive_access=false,updated_at=now() WHERE user_id=auth.uid();
 INSERT INTO public.client_staff_audit(staff_id,client_id,action) VALUES(auth.uid(),auth.uid(),'ACCEPT_HANDOVER');
END $$;
CREATE FUNCTION public.set_client_support(p_allow boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 UPDATE public.client_handovers SET staff_support_enabled=p_allow WHERE client_id=auth.uid() AND accepted_at IS NOT NULL;
 IF NOT FOUND THEN RAISE EXCEPTION 'Accepted handover required'; END IF;
 IF NOT p_allow THEN UPDATE public.client_staff_permissions SET sensitive_access=false,updated_at=now() WHERE user_id=auth.uid(); END IF;
 INSERT INTO public.client_staff_audit(staff_id,client_id,action) VALUES(auth.uid(),auth.uid(),CASE WHEN p_allow THEN 'ALLOW_STAFF_SUPPORT' ELSE 'REVOKE_STAFF_SUPPORT' END);
END $$;
REVOKE ALL ON FUNCTION public.request_client_handover(uuid,text),public.accept_client_handover(),public.set_client_support(boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.request_client_handover(uuid,text),public.accept_client_handover(),public.set_client_support(boolean) TO authenticated;
CREATE OR REPLACE FUNCTION public.can_manage_client(p_client uuid,p_sensitive boolean DEFAULT false) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT auth.uid() IS NOT NULL AND (
 (public.has_role(auth.uid(),'admin') AND EXISTS(SELECT 1 FROM public.staff_demo_companies d WHERE d.id=p_client)) OR
 (( (public.has_role(auth.uid(),'admin') AND NOT EXISTS(SELECT 1 FROM public.client_handovers h WHERE h.client_id=p_client AND h.accepted_at IS NOT NULL AND NOT h.staff_support_enabled)) OR EXISTS(SELECT 1 FROM public.client_team_members m WHERE m.client_id=p_client AND m.user_id=auth.uid() AND m.active))
 AND EXISTS(SELECT 1 FROM public.subscriptions s WHERE s.user_id=p_client AND s.status='active' AND s.plan<>'dg_review')
 AND (NOT p_sensitive OR (public.has_role(auth.uid(),'admin') AND EXISTS(SELECT 1 FROM public.client_staff_permissions p WHERE p.user_id=p_client AND p.sensitive_access)))))
$$;
COMMENT ON TABLE public.client_handovers IS 'Staff setup handover accepted only by the client owner; saved records and ownership do not move. Client controls further delegated staff support.';