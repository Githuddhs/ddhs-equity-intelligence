ALTER TABLE public.site_events DROP CONSTRAINT site_events_event_check;
ALTER TABLE public.site_events ADD CONSTRAINT site_events_event_check CHECK (event = ANY (ARRAY['visit','tour_complete','assessment_download','demo_request','app_install','readiness_check','tour_action']));
DROP POLICY "Anyone can record validated events" ON public.site_events;
CREATE POLICY "Anyone can record validated events" ON public.site_events
FOR INSERT TO anon, authenticated
WITH CHECK (
  event = ANY (ARRAY['visit','tour_complete','assessment_download','demo_request','app_install','readiness_check','tour_action'])
  AND char_length(path) BETWEEN 1 AND 200
  AND left(path, 1) = '/'
  AND path !~ '[[:cntrl:]]'
  AND char_length(detail) <= 200
  AND detail !~ '[[:cntrl:]]'
  AND created_at = now()
);