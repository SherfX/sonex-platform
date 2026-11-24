-- Enquiry workflow: client portal submissions, attachments, project linkage

ALTER TABLE project_submissions
  ADD COLUMN IF NOT EXISTS submitted_by uuid REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS project_title text,
  ADD COLUMN IF NOT EXISTS location text;

CREATE TABLE IF NOT EXISTS submission_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES project_submissions(id) ON DELETE CASCADE,
  media_asset_id uuid NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE submission_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage submission files"
  ON submission_files FOR ALL
  USING (is_staff_or_above());

CREATE POLICY "Clients view own submission files"
  ON submission_files FOR SELECT
  USING (
    submission_id IN (
      SELECT id FROM project_submissions
      WHERE submitted_by = auth.uid()
    )
  );

CREATE POLICY "Clients insert submission files for own submission"
  ON submission_files FOR INSERT
  WITH CHECK (
    submission_id IN (
      SELECT id FROM project_submissions
      WHERE submitted_by = auth.uid()
    )
  );

CREATE POLICY "Clients submit authenticated enquiries"
  ON project_submissions FOR INSERT
  WITH CHECK (submitted_by IS NULL OR submitted_by = auth.uid());

CREATE POLICY "Clients view own portal enquiries"
  ON project_submissions FOR SELECT
  USING (submitted_by = auth.uid() OR is_staff_or_above());

CREATE POLICY "Clients upload enquiry documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'client-documents'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = 'enquiries'
  );

CREATE POLICY "Clients and staff read enquiry documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'client-documents'
    AND (
      is_staff_or_above()
      OR (
        (storage.foldername(name))[1] = 'enquiries'
        AND (storage.foldername(name))[2] IN (
          SELECT id::text FROM project_submissions WHERE submitted_by = auth.uid()
        )
      )
    )
  );