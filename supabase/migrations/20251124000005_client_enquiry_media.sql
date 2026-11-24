-- Allow portal clients to register private enquiry uploads in media_assets

CREATE POLICY "Clients insert enquiry media records"
  ON media_assets FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND is_public = false
    AND bucket = 'client-documents'
  );