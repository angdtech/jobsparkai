-- Add photo_url column to cv_content table to store profile photos
ALTER TABLE cv_content
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN cv_content.photo_url IS 'Base64 encoded profile photo or URL to photo';
