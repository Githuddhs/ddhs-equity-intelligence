CREATE POLICY "Admins insert plans" ON public.ee_plans FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update plans" ON public.ee_plans FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert reviews" ON public.dg_reviews FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update reviews" ON public.dg_reviews FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
ALTER TABLE public.dg_reviews ADD CONSTRAINT dg_reviews_score_range CHECK (score BETWEEN 0 AND 100) NOT VALID;