DROP POLICY IF EXISTS "Pulse links workspace reads" ON public.inclusion_pulse_links;

CREATE POLICY "Staff read scoped pulse links" ON public.inclusion_pulse_links FOR SELECT TO authenticated
USING (
 public.has_role(auth.uid(),'admin') AND (
  (public.requested_client() IS NULL AND user_id=auth.uid()) OR
  (user_id=public.requested_client() AND public.can_manage_client(user_id,false))
 )
);
