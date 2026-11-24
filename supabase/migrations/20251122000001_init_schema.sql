-- Sonex Platform: Core schema
-- Tables: profiles, site_content, media_assets, social_links, projects, 
-- project_submissions, project_assignments, project_milestones, progress_reports, 
-- progress_media, documents, boq_documents, boq_sections, boq_items, boq_exports, 
-- boq_download_requests, conversations, messages, notifications, audit_logs

-- Enums
CREATE TYPE app_role AS ENUM ('super_admin', 'admin', 'staff', 'client');
CREATE TYPE project_status AS ENUM ('draft', 'active', 'completed', 'archived');
CREATE TYPE boq_status AS ENUM ('draft', 'under_review', 'approved', 'archived');
CREATE TYPE download_request_status AS ENUM ('pending', 'approved', 'rejected', 'expired');

-- Profiles (linked to auth.users)
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  phone text,
  role app_role NOT NULL DEFAULT 'client',
  avatar_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Site content (CMS)
CREATE TABLE site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_key text UNIQUE NOT NULL,
  title text,
  body jsonb,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Media assets
CREATE TABLE media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket text NOT NULL,
  path text NOT NULL,
  filename text NOT NULL,
  mime_type text,
  size_bytes bigint,
  alt_text text,
  uploaded_by uuid REFERENCES profiles(id),
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Social links
CREATE TABLE social_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  url text NOT NULL,
  label text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Projects
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE,
  description text,
  status project_status DEFAULT 'draft',
  client_id uuid REFERENCES profiles(id),
  location text,
  start_date date,
  end_date date,
  completion_percentage integer DEFAULT 0 CHECK (completion_percentage BETWEEN 0 AND 100),
  cover_media_id uuid REFERENCES media_assets(id),
  is_public boolean DEFAULT false,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Project submissions (enquiries)
CREATE TABLE project_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text,
  email text,
  phone text,
  company text,
  message text,
  status text DEFAULT 'new',
  assigned_to uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Project assignments
CREATE TABLE project_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role_on_project text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Milestones
CREATE TABLE project_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  target_date date,
  completed_at timestamptz,
  sort_order integer DEFAULT 0,
  is_client_visible boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Progress reports
CREATE TABLE progress_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  author_id uuid REFERENCES profiles(id),
  title text,
  body text,
  completion_percentage_at_time integer,
  is_client_visible boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Progress media
CREATE TABLE progress_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  progress_report_id uuid REFERENCES progress_reports(id) ON DELETE CASCADE,
  media_asset_id uuid REFERENCES media_assets(id),
  caption text,
  created_at timestamptz DEFAULT now()
);

-- Documents
CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  title text,
  media_asset_id uuid REFERENCES media_assets(id),
  uploaded_by uuid REFERENCES profiles(id),
  is_client_visible boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- BOQ documents
CREATE TABLE boq_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  version integer DEFAULT 1,
  status boq_status DEFAULT 'draft',
  currency text DEFAULT 'USD',
  total_amount numeric(14,2) DEFAULT 0,
  created_by uuid REFERENCES profiles(id),
  approved_by uuid REFERENCES profiles(id),
  approved_at timestamptz,
  is_client_visible boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- BOQ sections
CREATE TABLE boq_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  boq_document_id uuid REFERENCES boq_documents(id) ON DELETE CASCADE,
  title text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- BOQ items
CREATE TABLE boq_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid REFERENCES boq_sections(id) ON DELETE CASCADE,
  description text NOT NULL,
  unit text,
  quantity numeric(12,3) DEFAULT 0,
  rate numeric(12,2) DEFAULT 0,
  amount numeric(14,2) GENERATED ALWAYS AS (quantity * rate) STORED,
  sort_order integer DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- BOQ exports
CREATE TABLE boq_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  boq_document_id uuid REFERENCES boq_documents(id) ON DELETE CASCADE,
  media_asset_id uuid REFERENCES media_assets(id),
  export_type text, -- 'excel' or 'pdf'
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- BOQ download requests
CREATE TABLE boq_download_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  boq_document_id uuid REFERENCES boq_documents(id) ON DELETE CASCADE,
  requested_by uuid REFERENCES profiles(id),
  status download_request_status DEFAULT 'pending',
  requested_at timestamptz DEFAULT now(),
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  expires_at timestamptz,
  notes text
);

-- Conversations
CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  title text,
  created_at timestamptz DEFAULT now()
);

-- Messages
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES profiles(id),
  body text,
  created_at timestamptz DEFAULT now()
);

-- Notifications
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type text,
  title text,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Audit logs
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES profiles(id),
  action text,
  resource_type text,
  resource_id uuid,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_projects_client ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_boq_documents_project ON boq_documents(project_id);
CREATE INDEX idx_boq_items_section ON boq_items(section_id);
CREATE INDEX idx_progress_reports_project ON progress_reports(project_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER boq_documents_updated_at BEFORE UPDATE ON boq_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER site_content_updated_at BEFORE UPDATE ON site_content FOR EACH ROW EXECUTE FUNCTION update_updated_at();