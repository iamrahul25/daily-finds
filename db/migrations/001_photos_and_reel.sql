-- Run once on databases created before product pages had extra photos and reels.
ALTER TABLE products ADD COLUMN photos TEXT NOT NULL DEFAULT '[]';
ALTER TABLE products ADD COLUMN reel TEXT NOT NULL DEFAULT '';
