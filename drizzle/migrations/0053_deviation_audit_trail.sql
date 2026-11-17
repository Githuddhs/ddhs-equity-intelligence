CREATE TABLE public.ee_deviation_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deviation_id uuid NOT NULL,
  user_id uuid NOT NULL,
  actor_id uuid,
  actor_email text NOT NULL DEFAULT '',
  action text NOT NULL,
  detail text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ee_deviation_audit_dev_idx ON public.ee_deviation_audit(deviation_id, created_at);
GRANT SELECT ON public.ee_deviation_audit TO authenticated;
GRANT ALL ON public.ee_deviation_audit TO service_role;
ALTER TABLE public.ee_deviation_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Readable with the deviation" ON public.ee_deviation_audit FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.ee_deviations d WHERE d.id = deviation_id));

CREATE OR REPLACE FUNCTION public.log_deviation_audit() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _email text := coalesce(auth.jwt() ->> 'email', '');
  e jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO ee_deviation_audit(deviation_id,user_id,actor_id,actor_email,action,detail)
    VALUES (NEW.id,NEW.user_id,_uid,_email,'created','Status: '||NEW.status);
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO ee_deviation_audit(deviation_id,user_id,actor_id,actor_email,action,detail)
    VALUES (NEW.id,NEW.user_id,_uid,_email,'status',OLD.status||' → '||NEW.status);
  END IF;
  FOR e IN SELECT x FROM jsonb_array_elements(CASE WHEN jsonb_typeof(NEW.approvals)='array' THEN NEW.approvals ELSE '[]' END) x
    WHERE NOT (CASE WHEN jsonb_typeof(OLD.approvals)='array' THEN OLD.approvals ELSE '[]' END) @> jsonb_build_array(x) LOOP
    INSERT INTO ee_deviation_audit(deviation_id,user_id,actor_id,actor_email,action,detail)
    VALUES (NEW.id,NEW.user_id,_uid,_email,'approval',
      concat_ws(' — ', coalesce(e->>'label',e->>'key'), nullif(e->>'decision',''), nullif(e->>'name','')));
  END LOOP;
  FOR e IN SELECT x FROM jsonb_array_elements(CASE WHEN jsonb_typeof(OLD.approvals)='array' THEN OLD.approvals ELSE '[]' END) x
    WHERE NOT (CASE WHEN jsonb_typeof(NEW.approvals)='array' THEN NEW.approvals ELSE '[]' END) @> jsonb_build_array(x)
      AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements(CASE WHEN jsonb_typeof(NEW.approvals)='array' THEN NEW.approvals ELSE '[]' END) y WHERE y->>'key' = x->>'key') LOOP
    INSERT INTO ee_deviation_audit(deviation_id,user_id,actor_id,actor_email,action,detail)
    VALUES (NEW.id,NEW.user_id,_uid,_email,'approval_removed',coalesce(e->>'label',e->>'key'));
  END LOOP;
  FOR e IN SELECT x FROM jsonb_array_elements(CASE WHEN jsonb_typeof(NEW.evidence)='array' THEN NEW.evidence ELSE '[]' END) x
    WHERE NOT EXISTS (SELECT 1 FROM jsonb_array_elements(CASE WHEN jsonb_typeof(OLD.evidence)='array' THEN OLD.evidence ELSE '[]' END) y WHERE y->>'path' = x->>'path') LOOP
    INSERT INTO ee_deviation_audit(deviation_id,user_id,actor_id,actor_email,action,detail)
    VALUES (NEW.id,NEW.user_id,_uid,_email,'document_added',coalesce(e->>'name',''));
  END LOOP;
  FOR e IN SELECT x FROM jsonb_array_elements(CASE WHEN jsonb_typeof(OLD.evidence)='array' THEN OLD.evidence ELSE '[]' END) x
    WHERE NOT EXISTS (SELECT 1 FROM jsonb_array_elements(CASE WHEN jsonb_typeof(NEW.evidence)='array' THEN NEW.evidence ELSE '[]' END) y WHERE y->>'path' = x->>'path') LOOP
    INSERT INTO ee_deviation_audit(deviation_id,user_id,actor_id,actor_email,action,detail)
    VALUES (NEW.id,NEW.user_id,_uid,_email,'document_removed',coalesce(e->>'name',''));
  END LOOP;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.log_deviation_audit() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER deviation_audit AFTER INSERT OR UPDATE ON public.ee_deviations
  FOR EACH ROW EXECUTE FUNCTION public.log_deviation_audit();