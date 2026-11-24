-- Background image slots (media_asset_id in JSON body)

INSERT INTO site_content (content_key, title, body, is_published) VALUES
  (
    'hero_background',
    'Homepage hero background',
    '{"media_asset_id": null, "label": "Hero"}'::jsonb,
    true
  ),
  (
    'cta_background',
    'Homepage CTA background',
    '{"media_asset_id": null, "label": "Call to action"}'::jsonb,
    true
  ),
  (
    'services_background',
    'Services band background',
    '{"media_asset_id": null, "label": "Services section"}'::jsonb,
    true
  )
ON CONFLICT (content_key) DO NOTHING;