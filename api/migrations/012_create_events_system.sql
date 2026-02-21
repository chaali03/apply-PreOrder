-- Create events table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    music_url TEXT,
    music_title VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create comments table
CREATE TABLE IF NOT EXISTS event_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES event_comments(id) ON DELETE CASCADE,
    commenter_name VARCHAR(100) NOT NULL,
    comment_text TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_events_active ON events(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_event ON event_comments(event_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON event_comments(parent_id);

-- Add comments
COMMENT ON TABLE events IS 'Events/posts like Instagram stories';
COMMENT ON TABLE event_comments IS 'Public anonymous comments on events';
COMMENT ON COLUMN event_comments.is_admin IS 'True if comment is from SCAFF*FOOD admin (verified)';
COMMENT ON COLUMN event_comments.parent_id IS 'For reply threads';
