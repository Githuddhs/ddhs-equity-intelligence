DROP POLICY "Anyone can submit a valid enquiry" ON public.contact_enquiries;

CREATE POLICY "Anyone can submit a valid enquiry" ON public.contact_enquiries FOR INSERT TO anon, authenticated WITH CHECK (
  char_length(full_name) BETWEEN 2 AND 120
  AND char_length(email) BETWEEN 3 AND 255 AND email LIKE '%_@_%'
  AND char_length(company) BETWEEN 2 AND 160
  AND (job_title IS NULL OR char_length(job_title) <= 120)
  AND (phone IS NULL OR char_length(phone) <= 40)
  AND (workforce_size IS NULL OR char_length(workforce_size) <= 60)
  AND char_length(message) <= 2000
  AND source = 'website'
);