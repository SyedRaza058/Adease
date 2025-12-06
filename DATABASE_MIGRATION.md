# Database Migration for Ad Scheduling Feature

## Required Database Changes

To enable the ad scheduling and rotation feature, you need to add two new columns to the `adease_ads` table in Supabase:

### SQL Migration

Run this SQL in your Supabase SQL Editor:

```sql
-- Add duration column (in seconds)
ALTER TABLE adease_ads 
ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 10;

-- Add display_order column for managing ad sequence
ALTER TABLE adease_ads 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Add scheduling columns (optional - for time-based scheduling)
ALTER TABLE adease_ads 
ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ;

ALTER TABLE adease_ads 
ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ;

-- Update existing ads to have default duration if null
UPDATE adease_ads 
SET duration = 10 
WHERE duration IS NULL;

-- Update existing ads to have display_order based on creation time
UPDATE adease_ads 
SET display_order = sub.row_num - 1
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY screen_id ORDER BY created_at) as row_num
  FROM adease_ads
) sub
WHERE adease_ads.id = sub.id;
```

## New Features

1. **Duration-based Ad Rotation**: Ads automatically rotate based on their specified duration
2. **Multiple Ads per Screen**: Each screen can now display multiple ads in sequence
3. **Scheduled Display**: Ads change automatically after their duration expires
4. **Duration Management**: Users can set display duration (5-300 seconds) when creating ads
5. **Time-based Scheduling**: Ads can be scheduled with start and end times
6. **Multiple Image Upload**: Upload multiple images at once - each creates a separate ad
7. **Smart Filtering**: Preview page only shows ads that are within their scheduled time window

## How It Works

- When you create an ad, you specify a duration in seconds (default: 10 seconds)
- The preview page (`/ad/[screen_id]`) fetches all ads for that screen
- Ads rotate automatically based on their individual durations
- The rotation loops continuously through all ads for the screen

## Usage

1. Create multiple ads for the same screen
2. Set different durations for each ad
3. Preview the screen to see all ads rotating automatically
4. The preview URL is now based on `screen_id` instead of `ad_id`

