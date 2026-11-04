CREATE FUNCTION public.can_administer_client_team(p_client uuid,p_revoke boolean DEFAULT false) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT auth.uid() IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.staff_demo_companies WHERE id=p_client) AND (
 (auth.uid()=p_client AND (p_revoke OR EXISTS(SELECT 1 FROM public.subscriptions WHERE user_id=p_client AND status='active' AND plan<>'dg_review')))
 OR (public.has_role(auth.uid(),'admin') AND public.can_manage_client(p_client,false))
 );
$$;
CREATE FUNCTION public.change_client_team_access(p_id uuid,p_active boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE target uuid;
BEGIN
 SELECT client_id INTO target FROM public.client_team_members WHERE id=p_id FOR UPDATE;
 IF target IS NULL OR NOT public.can_administer_client_team(target,NOT p_active) THEN RAISE EXCEPTION 'Client team administration denied'; END IF;
 UPDATE public.client_team_members SET active=p_active WHERE id=p_id;
 INSERT INTO public.client_staff_audit(staff_id,client_id,action) VALUES(auth.uid(),target,CASE WHEN p_active THEN 'RESTORE_TEAM_USER' ELSE 'REVOKE_TEAM_USER' END);
END $$;
REVOKE ALL ON FUNCTION public.can_administer_client_team(uuid,boolean),public.change_client_team_access(uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.can_administer_client_team(uuid,boolean),public.change_client_team_access(uuid,boolean) TO authenticated;
CREATE OR REPLACE FUNCTION public.can_manage_client(p_client uuid,p_sensitive boolean DEFAULT false) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT auth.uid() IS NOT NULL AND (
 (public.has_role(auth.uid(),'admin') AND EXISTS(SELECT 1 FROM public.staff_demo_companies d WHERE d.id=p_client)) OR
 (((public.has_role(auth.uid(),'admin') AND NOT EXISTS(SELECT 1 FROM public.client_handovers h WHERE h.client_id=p_client AND h.accepted_at IS NOT NULL AND NOT h.staff_support_enabled)) OR (NOT public.has_role(auth.uid(),'admin') AND EXISTS(SELECT 1 FROM public.client_team_members m WHERE m.client_id=p_client AND m.user_id=auth.uid() AND m.active)))
 AND EXISTS(SELECT 1 FROM public.subscriptions s WHERE s.user_id=p_client AND s.status='active' AND s.plan<>'dg_review')
 AND (NOT p_sensitive OR (public.has_role(auth.uid(),'admin') AND EXISTS(SELECT 1 FROM public.client_staff_permissions p WHERE p.user_id=p_client AND p.sensitive_access)))))
$$;
COMMENT ON FUNCTION public.change_client_team_access(uuid,boolean) IS 'Atomic team access and audit; owner may revoke without subscription, staff must retain owner-authorised support.';