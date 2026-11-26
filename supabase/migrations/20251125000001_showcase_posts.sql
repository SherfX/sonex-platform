-- Independent showcase gallery posts (not tied to delivery projects)

CREATE TABLE showcase_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  media_asset_id uuid REFERENCES media_assets(id) ON DELETE SET NULL,
  sort_order integer DEFAULT 0,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE showcase_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read published showcase"
  ON showcase_posts FOR SELECT
  USING (is_published = true);

CREATE POLICY "Staff manage showcase posts"
  ON showcase_posts FOR ALL
  USING (is_staff_or_above());

CREATE TRIGGER showcase_posts_updated_at
  BEFORE UPDATE ON showcase_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();