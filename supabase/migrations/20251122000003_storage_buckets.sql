-- Create buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('public-media', 'public-media', true),
  ('client-documents', 'client-documents', false),
  ('project-media', 'project-media', false),
  ('boq-documents', 'boq-documents', false);

-- Storage policies
CREATE POLICY "Public read public-media" ON storage.objects FOR SELECT 
  USING (bucket_id = 'public-media');

CREATE POLICY "Staff manage public-media" ON storage.objects FOR ALL 
  USING (bucket_id = 'public-media' AND (SELECT is_staff_or_above()));

CREATE POLICY "Staff manage client-documents" ON storage.objects FOR ALL 
  USING (bucket_id = 'client-documents' AND (SELECT is_staff_or_above()));

CREATE POLICY "Staff manage project-media" ON storage.objects FOR ALL 
  USING (bucket_id = 'project-media' AND (SELECT is_staff_or_above()));

CREATE POLICY "Staff manage boq-documents" ON storage.objects FOR ALL 
  USING (bucket_id = 'boq-documents' AND (SELECT is_staff_or_above()));
  