CREATE TABLE public.contact_enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT NOT NULL,
  job_title TEXT,
  phone TEXT,
  workforce_size TEXT,
  message TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'website',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.contact_enquiries TO anon;
GRANT SELECT ON public.contact_enquiries TO authenticated;
GRANT ALL ON public.contact_enquiries TO service_role;

ALTER TABLE public.contact_enquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit an enquiry"
ON public.contact_enquiries FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Signed in staff can read enquiries"
ON public.contact_enquiries FOR SELECT TO authenticated
USING (true);

CREATE OR REPLACE FUNCTION public.enquiry_throttled(p_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.contact_enquiries
    WHERE lower(email) = lower(p_email)
      AND created_at > now() - interval '2 minutes'
  )
$$;

GRANT EXECUTE ON FUNCTION public.enquiry_throttled(text) TO anon, authenticated, service_role;
