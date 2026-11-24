-- SAMPLE DATA – replace after funding
-- Based on N.Moyo Stand 1284 Mahatshula BOQ structure

-- Note: Profiles require real auth.users. Create users in Auth dashboard first, then update these.

-- Social links
INSERT INTO social_links (platform, url, label, sort_order) VALUES
  ('whatsapp', 'https://wa.me/263700000000', 'WhatsApp', 1),
  ('facebook', 'https://facebook.com/sonexcontractors', 'Facebook', 2),
  ('tiktok', 'https://tiktok.com/@sonexcontractors', 'TikTok', 3),
  ('x', 'https://x.com/sonexcontractors', 'X', 4),
  ('linkedin', 'https://linkedin.com/company/sonexcontractors', 'LinkedIn', 5);

-- Site content (simplified examples)
INSERT INTO site_content (content_key, title, body) VALUES
  ('hero', 'Crafting durable solutions for modern living', '{"subtitle": "With a strong foundation of expertise and innovation, we shape modern living."}'),
  ('stats', 'Stats', '{"projects": "40+", "services": "8", "directors": "5", "founded": "2025"}'),
  ('services', 'Our Services', '{"items": ["Residential Construction", "Commercial Construction", "Industrial Construction", "Infrastructure Development", "Renovation & Remodeling", "Design & Build", "Quantity Surveying", "Aluminium Glazing"]}');

-- Sample project (client_id to be linked later)
INSERT INTO projects (id, title, slug, description, status, location, completion_percentage, is_public) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Proposed New Residence & Cottage – Stand 1284 Mahatshula', 'stand-1284-mahatshula', '4-Bed Main Residence + 1-Bed Cottage & Garage', 'active', 'Mahatshula, Bulawayo', 15, false);

-- Sample BOQ document
INSERT INTO boq_documents (id, project_id, title, status, is_client_visible, total_amount) VALUES
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'BOQ — Superstructure to Completion (From Slab Level)', 'approved', true, 61453.97);

-- Sections (8 stages)
INSERT INTO boq_sections (id, boq_document_id, title, sort_order) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Stage 1: Superstructure Brickwork, Lintels & Ring Beam', 1),
  ('c2222222-2222-2222-2222-222222222222', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Stage 2: Roof Structure & Roof Coverings', 2),
  ('c3333333-3333-3333-3333-333333333333', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Stage 3: Glazing, Windows & Doors', 3),
  ('c4444444-4444-4444-4444-444444444444', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Stage 4: Plumbing, Sanitaryware & Drainage', 4),
  ('c5555555-5555-5555-5555-555555555555', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Stage 5: Electrical Installation & DB Boards', 5),
  ('c6666666-6666-6666-6666-666666666666', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Stage 6: Plastering, Ceiling & Floor Screeding', 6),
  ('c7777777-7777-7777-7777-777777777777', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Stage 7: Floor & Wall Tiling, BICs & Kitchen Fittings', 7),
  ('c8888888-8888-8888-8888-888888888888', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Stage 8: Painting, Varnishing, External Aprons & Final Commissioning', 8);

-- Sample items (representative)
INSERT INTO boq_items (section_id, description, unit, quantity, rate, sort_order) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'Common clay / cement bricks (230x115x75mm)', 'Each', 21500, 0.16, 1),
  ('c1111111-1111-1111-1111-111111111111', 'Ordinary Portland Cement (50kg bags)', 'Bags', 155, 11.50, 2),
  ('c2222222-2222-2222-2222-222222222222', 'Treated SA Pine structural roof timber', 'Lengths', 145, 13.50, 1),
  ('c2222222-2222-2222-2222-222222222222', 'IBR Chromadek / Aluzinc 0.5mm roof sheets', 'm²', 215, 11.50, 2);