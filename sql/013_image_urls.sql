-- 013: Migrate image_url (text) → image_urls (jsonb array) for multi-image support

-- Step 1: Add new jsonb column
ALTER TABLE scheduled_posts ADD COLUMN image_urls jsonb DEFAULT '[]'::jsonb;

-- Step 2: Migrate existing single image_url into image_urls array
UPDATE scheduled_posts
SET image_urls = jsonb_build_array(image_url)
WHERE image_url IS NOT NULL AND image_url != '';

-- Step 3: Drop old column
ALTER TABLE scheduled_posts DROP COLUMN image_url;
