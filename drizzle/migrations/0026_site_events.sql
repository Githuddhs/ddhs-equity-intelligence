CREATE TABLE public.site_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event text NOT NULL CHECK (event IN ('visit','tour_complete','assessment_download','demo_request')),
  path text NOT NULL DEFAULT '' CHECK (char_length(path) <= 200),
  detail text NOT NULL DEFAULT '' CHECK (char_length(detail) <= 200),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.site_events TO anon, authenticated;
GRANT SELECT ON public.site_events TO authenticated;
GRANT ALL ON public.site_events TO service_role;
ALTER TABLE public.site_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can record events" ON public.site_events FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Staff read events" ON public.site_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX site_events_created_idx ON public.site_events (created_at DESC);