-- Public site access: enquiries, web chat, profile bootstrap

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'client'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enquiries
CREATE POLICY "Public can submit enquiries"
  ON project_submissions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Staff can view enquiries"
  ON project_submissions FOR SELECT
  USING (is_staff_or_above());

CREATE POLICY "Staff can update enquiries"
  ON project_submissions FOR UPDATE
  USING (is_staff_or_above());

-- Public web chat (project_id IS NULL)
CREATE POLICY "Anyone can start public conversation"
  ON conversations FOR INSERT
  WITH CHECK (project_id IS NULL);

CREATE POLICY "Anyone can view public conversations"
  ON conversations FOR SELECT
  USING (project_id IS NULL OR project_id IN (SELECT id FROM projects WHERE client_id = auth.uid()) OR is_staff_or_above());

CREATE POLICY "Clients can create project conversations"
  ON conversations FOR INSERT
  WITH CHECK (
    project_id IS NOT NULL
    AND (
      project_id IN (SELECT id FROM projects WHERE client_id = auth.uid())
      OR is_staff_or_above()
    )
  );

CREATE POLICY "Public visitor messages"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id IS NULL
    AND conversation_id IN (SELECT id FROM conversations WHERE project_id IS NULL)
  );

CREATE POLICY "Anyone can read public chat messages"
  ON messages FOR SELECT
  USING (conversation_id IN (SELECT id FROM conversations WHERE project_id IS NULL));

CREATE POLICY "Staff can send any message"
  ON messages FOR INSERT
  WITH CHECK (is_staff_or_above());