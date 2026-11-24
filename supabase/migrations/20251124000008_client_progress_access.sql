-- Clients can load progress photos and project-media for their projects

CREATE POLICY "Clients see progress media for visible reports"
  ON progress_media FOR SELECT
  USING (
    is_staff_or_above()
    OR progress_report_id IN (
      SELECT id FROM progress_reports
      WHERE is_client_visible = true
        AND project_id IN (SELECT id FROM projects WHERE client_id = auth.uid())
    )
  );

CREATE POLICY "Staff manage progress media"
  ON progress_media FOR ALL
  USING (is_staff_or_above());

CREATE POLICY "Clients read project media for own projects"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'project-media'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM projects WHERE client_id = auth.uid()
    )
  );