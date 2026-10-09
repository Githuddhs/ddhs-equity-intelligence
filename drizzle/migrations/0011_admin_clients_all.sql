CREATE OR REPLACE FUNCTION public.admin_clients_all()
RETURNS TABLE (id uuid, email text, full_name text, company text, created_at timestamptz, confirmed boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  RETURN QUERY SELECT u.id, u.email::text, (u.raw_user_meta_data->>'full_name')::text, (u.raw_user_meta_data->>'company')::text, u.created_at, (u.email_confirmed_at IS NOT NULL)
    FROM auth.users u
    WHERE NOT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id AND r.role = 'admin')
    ORDER BY u.created_at DESC;
END $$;
REVOKE ALL ON FUNCTION public.admin_clients_all() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_clients_all() TO authenticated;
COMMENT ON FUNCTION public.admin_clients() IS 'DEPRECATED: replaced by admin_clients_all';