-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE boq_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE boq_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE boq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE boq_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE boq_download_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS app_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT get_my_role() IN ('super_admin', 'admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_staff_or_above()
RETURNS boolean AS $$
  SELECT get_my_role() IN ('super_admin', 'admin', 'staff');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (id = auth.uid() OR is_admin());
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Admins can manage all profiles" ON profiles FOR ALL USING (is_admin());

-- Site content (public read for published)
CREATE POLICY "Public can view published content" ON site_content FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage content" ON site_content FOR ALL USING (is_admin());

-- Social links
CREATE POLICY "Public can view active social links" ON social_links FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage social links" ON social_links FOR ALL USING (is_admin());

-- Media assets
CREATE POLICY "Public can view public media" ON media_assets FOR SELECT USING (is_public = true);
CREATE POLICY "Authenticated can view own uploads" ON media_assets FOR SELECT USING (uploaded_by = auth.uid() OR is_staff_or_above());
CREATE POLICY "Staff can manage media" ON media_assets FOR ALL USING (is_staff_or_above());

-- Projects
CREATE POLICY "Clients see own projects" ON projects FOR SELECT USING (client_id = auth.uid() OR is_staff_or_above() OR is_public = true);
CREATE POLICY "Staff manage projects" ON projects FOR ALL USING (is_staff_or_above());

-- BOQ documents (clients only see non-draft + client-visible)
CREATE POLICY "Clients see approved visible BOQs" ON boq_documents FOR SELECT 
  USING (
    (status != 'draft' AND is_client_visible = true AND project_id IN (SELECT id FROM projects WHERE client_id = auth.uid()))
    OR is_staff_or_above()
  );
CREATE POLICY "Staff manage BOQs" ON boq_documents FOR ALL USING (is_staff_or_above());

-- BOQ sections & items (follow parent document visibility)
CREATE POLICY "View BOQ sections" ON boq_sections FOR SELECT 
  USING (boq_document_id IN (SELECT id FROM boq_documents));
CREATE POLICY "Staff manage sections" ON boq_sections FOR ALL USING (is_staff_or_above());

CREATE POLICY "View BOQ items" ON boq_items FOR SELECT 
  USING (section_id IN (SELECT id FROM boq_sections));
CREATE POLICY "Staff manage items" ON boq_items FOR ALL USING (is_staff_or_above());

-- Progress (clients only see client-visible)
CREATE POLICY "Clients see visible progress" ON progress_reports FOR SELECT 
  USING (is_client_visible = true AND project_id IN (SELECT id FROM projects WHERE client_id = auth.uid()) OR is_staff_or_above());
CREATE POLICY "Staff manage progress" ON progress_reports FOR ALL USING (is_staff_or_above());

-- Download requests
CREATE POLICY "Clients manage own requests" ON boq_download_requests FOR ALL 
  USING (requested_by = auth.uid() OR is_staff_or_above());

-- Notifications
CREATE POLICY "Users see own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- Messages & conversations (participants)
CREATE POLICY "Project participants see conversations" ON conversations FOR SELECT 
  USING (project_id IN (SELECT id FROM projects WHERE client_id = auth.uid()) OR is_staff_or_above());
CREATE POLICY "Staff manage conversations" ON conversations FOR ALL USING (is_staff_or_above());

CREATE POLICY "See messages in accessible conversations" ON messages FOR SELECT 
  USING (conversation_id IN (SELECT id FROM conversations));
CREATE POLICY "Send messages" ON messages FOR INSERT WITH CHECK (sender_id = auth.uid());
