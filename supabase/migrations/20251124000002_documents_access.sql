-- Documents & client uploads

CREATE POLICY "Clients view project documents"
  ON documents FOR SELECT
  USING (
    is_staff_or_above()
    OR (
      project_id IN (SELECT id FROM projects WHERE client_id = auth.uid())
      AND (is_client_visible = true OR uploaded_by = auth.uid())
    )
  );

CREATE POLICY "Clients upload project documents"
  ON documents FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid()
    AND project_id IN (SELECT id FROM projects WHERE client_id = auth.uid())
  );

CREATE POLICY "Staff manage documents"
  ON documents FOR ALL
  USING (is_staff_or_above());

CREATE POLICY "Users insert own media"
  ON media_assets FOR INSERT
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Clients upload to client-documents bucket"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'client-documents'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM projects WHERE client_id = auth.uid()
    )
  );

CREATE POLICY "Clients read client-documents for their projects"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'client-documents'
    AND (
      is_staff_or_above()
      OR (storage.foldername(name))[1] IN (
        SELECT id::text FROM projects WHERE client_id = auth.uid()
      )
    )
  );