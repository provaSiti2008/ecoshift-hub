-- SQL Migration Script: Backfill User Ratings from Existing Reviews
-- Run this in Supabase SQL Editor to fix existing data

-- Step 1: Verify columns exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS rating REAL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "totalReviews" INTEGER DEFAULT 0;

-- Step 2: Update all users with their calculated ratings from existing reviews
UPDATE users u 
SET 
    rating = subquery.avg_rating,
    "totalReviews" = subquery.review_count
FROM (
    SELECT 
        "reviewedId" as user_id,
        AVG(rating) as avg_rating,
        COUNT(*) as review_count
    FROM reviews
    GROUP BY "reviewedId"
) subquery
WHERE u.id = subquery.user_id;

-- Step 3: Set rating to NULL for users with no reviews (clean up)
UPDATE users 
SET rating = NULL, "totalReviews" = 0
WHERE id NOT IN (SELECT DISTINCT "reviewedId" FROM reviews);

-- Step 4: Create PostgreSQL trigger for automatic future recalculation
-- This ensures ratings are automatically updated when reviews are added/modified/deleted
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users 
    SET rating = (SELECT AVG(rating) FROM reviews WHERE "reviewedId" = COALESCE(NEW."reviewedId", OLD."reviewedId")),
        "totalReviews" = (SELECT COUNT(*) FROM reviews WHERE "reviewedId" = COALESCE(NEW."reviewedId", OLD."reviewedId"))
    WHERE id = COALESCE(NEW."reviewedId", OLD."reviewedId");
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS reviews_update_rating ON reviews;

-- Create trigger
CREATE TRIGGER reviews_update_rating
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_user_rating();

-- Verification query: Show top 10 users by rating
SELECT 
    id,
    name,
    rating,
    "totalReviews"
FROM users
WHERE "totalReviews" > 0
ORDER BY rating DESC
LIMIT 10;
