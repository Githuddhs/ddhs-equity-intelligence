CREATE TABLE public.portal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  area text NOT NULL CHECK (area IN ('eea12','plan','dg')),
  category text NOT NULL,
  file_name text NOT NULL,
  storage_path text NOT NULL,
  size_bytes bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.portal_documents TO authenticated;
GRANT ALL ON public.portal_documents TO service_role;
ALTER TABLE public.portal_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own docs select" ON public.portal_documents FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own docs insert" ON public.portal_documents FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own docs delete" ON public.portal_documents FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX portal_documents_user_area ON public.portal_documents (user_id, area);

CREATE POLICY "Own client files read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'client-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Own client files upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'client-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Own client files delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'client-documents' AND (storage.foldername(name))[1] = auth.uid()::text);