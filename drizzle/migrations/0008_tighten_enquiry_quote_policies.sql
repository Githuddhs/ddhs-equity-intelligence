DROP POLICY IF EXISTS "Signed in staff can read enquiries" ON public.contact_enquiries;
CREATE POLICY "Staff can read enquiries" ON public.contact_enquiries FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Anyone can submit an enquiry" ON public.contact_enquiries;
CREATE POLICY "Anyone can submit a valid enquiry" ON public.contact_enquiries FOR INSERT TO anon, authenticated WITH CHECK (
  char_length(full_name) BETWEEN 2 AND 120
  AND char_length(email) BETWEEN 3 AND 255 AND email LIKE '%_@_%'
  AND char_length(company) BETWEEN 2 AND 160
  AND (job_title IS NULL OR char_length(job_title) <= 120)
  AND (phone IS NULL OR char_length(phone) <= 40)
  AND (workforce_size IS NULL OR char_length(workforce_size) <= 60)
  AND char_length(message) BETWEEN 20 AND 2000
  AND source = 'website'
);

DROP POLICY IF EXISTS "Anyone can submit a quote request" ON public.quote_requests;
CREATE POLICY "Anyone can submit a valid quote request" ON public.quote_requests FOR INSERT TO anon, authenticated WITH CHECK (
  char_length(full_name) BETWEEN 2 AND 120
  AND char_length(email) BETWEEN 3 AND 255 AND email LIKE '%_@_%'
  AND char_length(company) BETWEEN 2 AND 160
  AND (phone IS NULL OR char_length(phone) <= 40)
  AND char_length(service) BETWEEN 1 AND 120
  AND char_length(details) BETWEEN 20 AND 2000
);