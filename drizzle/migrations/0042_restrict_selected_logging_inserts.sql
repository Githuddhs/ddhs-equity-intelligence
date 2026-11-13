DROP POLICY "Anyone can log AI usage" ON public.ai_usage;
REVOKE INSERT ON public.ai_usage FROM anon, authenticated;
GRANT INSERT ON public.ai_usage TO service_role;

DROP POLICY "Anyone can record events" ON public.site_events;
REVOKE INSERT ON public.site_events FROM anon, authenticated;
GRANT INSERT (event, path, detail) ON public.site_events TO anon, authenticated;
CREATE POLICY "Anyone can record validated events" ON public.site_events
FOR INSERT TO anon, authenticated
WITH CHECK (
  event = ANY (ARRAY['visit', 'tour_complete', 'assessment_download', 'demo_request', 'app_install', 'readiness_check'])
  AND char_length(path) BETWEEN 1 AND 200
  AND left(path, 1) = '/'
  AND path !~ '[[:cntrl:]]'
  AND char_length(detail) <= 200
  AND detail !~ '[[:cntrl:]]'
  AND created_at = now()
);
