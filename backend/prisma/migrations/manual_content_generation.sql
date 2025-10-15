-- Migration: Add Content Generation Tracking
-- Description: Creates content_generation_status table for tracking AI pipeline execution
-- Date: 2025-10-14

-- Create the content_generation_status table
CREATE TABLE IF NOT EXISTS content_generation_status (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    subject_id INTEGER NOT NULL,
    grade_level VARCHAR(50) NOT NULL,
    board VARCHAR(50) NOT NULL,
    chapters_generated BOOLEAN DEFAULT false,
    topics_generated BOOLEAN DEFAULT false,
    generation_started_at TIMESTAMP(6),
    generation_completed_at TIMESTAMP(6),
    status VARCHAR(50) DEFAULT 'pending' NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key to subjects table
    CONSTRAINT fk_subject FOREIGN KEY (subject_id) 
        REFERENCES subjects(id) 
        ON DELETE CASCADE 
        ON UPDATE NO ACTION,
    
    -- Unique constraint to prevent duplicate generation
    CONSTRAINT unique_generation_combination 
        UNIQUE (user_id, subject_id, grade_level, board)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_content_gen_user_id 
    ON content_generation_status(user_id);

CREATE INDEX IF NOT EXISTS idx_content_gen_status 
    ON content_generation_status(status);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_content_generation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function
CREATE TRIGGER trigger_content_generation_updated_at
    BEFORE UPDATE ON content_generation_status
    FOR EACH ROW
    EXECUTE FUNCTION update_content_generation_updated_at();

-- Add comments for documentation
COMMENT ON TABLE content_generation_status IS 
    'Tracks AI content generation status to prevent duplicate executions and monitor progress';

COMMENT ON COLUMN content_generation_status.status IS 
    'Current status: pending, in_progress, completed, or failed';

COMMENT ON COLUMN content_generation_status.chapters_generated IS 
    'Whether chapters have been successfully generated';

COMMENT ON COLUMN content_generation_status.topics_generated IS 
    'Whether topics have been successfully generated for all chapters';

-- Verify the table was created
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'content_generation_status'
ORDER BY ordinal_position;
