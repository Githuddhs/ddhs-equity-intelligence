CREATE OR REPLACE FUNCTION public.guard_deviation_delete() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.created_at > now() - interval '5 years' THEN
    RAISE EXCEPTION 'Deviation requests are retained for 5 years and cannot be deleted before %', (OLD.created_at + interval '5 years')::date;
  END IF;
  INSERT INTO ee_deviation_audit(deviation_id,user_id,actor_id,actor_email,action,detail)
  VALUES (OLD.id,OLD.user_id,auth.uid(),coalesce(auth.jwt() ->> 'email',''),'deleted','Deleted after the 5-year retention period');
  RETURN OLD;
END $$;
REVOKE EXECUTE ON FUNCTION public.guard_deviation_delete() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER deviation_retention_guard BEFORE DELETE ON public.ee_deviations
  FOR EACH ROW EXECUTE FUNCTION public.guard_deviation_delete();