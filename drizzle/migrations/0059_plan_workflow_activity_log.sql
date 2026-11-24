CREATE TABLE public.ee_plan_workflow_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL,
  user_id uuid NOT NULL,
  actor_id uuid,
  actor_email text NOT NULL DEFAULT '',
  stage integer,
  action text NOT NULL,
  detail text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ee_plan_workflow_audit_plan_idx ON public.ee_plan_workflow_audit(plan_id, created_at);
GRANT SELECT ON public.ee_plan_workflow_audit TO authenticated;
GRANT ALL ON public.ee_plan_workflow_audit TO service_role;
ALTER TABLE public.ee_plan_workflow_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Readable with the plan" ON public.ee_plan_workflow_audit FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.ee_plans p WHERE p.id = plan_id));

CREATE OR REPLACE FUNCTION public.log_plan_workflow_audit() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _email text := coalesce(auth.jwt() ->> 'email', '');
  ow jsonb := CASE WHEN TG_OP = 'UPDATE' THEN OLD.content -> 'workflow' ELSE NULL END;
  nw jsonb := NEW.content -> 'workflow';
  od jsonb := CASE WHEN TG_OP = 'UPDATE' THEN coalesce(OLD.content -> 'delivery', '{}'::jsonb) ELSE '{}'::jsonb END;
  nd jsonb := coalesce(NEW.content -> 'delivery', '{}'::jsonb);
  os jsonb; ns jsonb; i int;
BEGIN
  IF nw IS NOT NULL AND jsonb_typeof(nw) = 'object' THEN
    IF ow IS NULL OR jsonb_typeof(ow) <> 'object' THEN
      INSERT INTO ee_plan_workflow_audit(plan_id,user_id,actor_id,actor_email,stage,action,detail)
      VALUES (NEW.id,NEW.user_id,_uid,_email,NULL,'started','Workflow started');
    END IF;
    FOR i IN 0 .. greatest(coalesce(jsonb_array_length(nw -> 'stages'),0) - 1, -1) LOOP
      ns := nw -> 'stages' -> i;
      os := CASE WHEN ow IS NULL OR jsonb_typeof(ow) <> 'object' THEN NULL ELSE ow -> 'stages' -> i END;
      IF (ns ->> 'status') IS DISTINCT FROM (os ->> 'status') AND (ns ->> 'status') <> 'not_started' THEN
        INSERT INTO ee_plan_workflow_audit(plan_id,user_id,actor_id,actor_email,stage,action,detail)
        VALUES (NEW.id,NEW.user_id,_uid,_email,i+1,
          CASE WHEN ns ->> 'status' = 'complete' THEN 'completed' ELSE 'opened' END,
          CASE WHEN ns ->> 'status' = 'complete' THEN 'Stage completed' ELSE 'Stage opened' END);
      END IF;
      IF os IS NOT NULL AND (ns ->> 'due') IS DISTINCT FROM (os ->> 'due') THEN
        INSERT INTO ee_plan_workflow_audit(plan_id,user_id,actor_id,actor_email,stage,action,detail)
        VALUES (NEW.id,NEW.user_id,_uid,_email,i+1,'changed','Due date: '||coalesce(os ->> 'due','none')||' to '||coalesce(ns ->> 'due','none'));
      END IF;
    END LOOP;
  END IF;
  FOR i IN 1 .. 14 LOOP
    IF (nd -> i::text) IS DISTINCT FROM (od -> i::text) THEN
      INSERT INTO ee_plan_workflow_audit(plan_id,user_id,actor_id,actor_email,stage,action,detail)
      VALUES (NEW.id,NEW.user_id,_uid,_email,i,'changed','Delivery: '||coalesce(nullif(nd -> i::text ->> 'mode',''),'not set')
        ||coalesce(' · venue '||nullif(nd -> i::text ->> 'venue',''),'')
        ||coalesce(' · date '||nullif(nd -> i::text ->> 'date',''),''));
    END IF;
  END LOOP;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.log_plan_workflow_audit() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER ee_plans_workflow_audit AFTER INSERT OR UPDATE OF content ON public.ee_plans
  FOR EACH ROW EXECUTE FUNCTION public.log_plan_workflow_audit();

ALTER TABLE public.ee_plans ADD COLUMN IF NOT EXISTS workflow_reminders jsonb NOT NULL DEFAULT '{"enabled": false, "daysBefore": 7, "emails": [], "sent": {}}'::jsonb;