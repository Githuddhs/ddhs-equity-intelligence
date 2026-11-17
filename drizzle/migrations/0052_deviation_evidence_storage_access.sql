CREATE POLICY "Deviation evidence owners upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'deviation-evidence'
    AND EXISTS (SELECT 1 FROM public.ee_deviations d WHERE d.id::text = (storage.foldername(name))[1]
      AND (d.user_id = auth.uid() OR public.can_manage_client(d.user_id, false))));
CREATE POLICY "Deviation evidence owners read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'deviation-evidence'
    AND EXISTS (SELECT 1 FROM public.ee_deviations d WHERE d.id::text = (storage.foldername(name))[1]
      AND (d.user_id = auth.uid() OR public.can_manage_client(d.user_id, false))));
CREATE POLICY "Deviation evidence owners delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'deviation-evidence'
    AND EXISTS (SELECT 1 FROM public.ee_deviations d WHERE d.id::text = (storage.foldername(name))[1]
      AND (d.user_id = auth.uid() OR public.can_manage_client(d.user_id, false))));