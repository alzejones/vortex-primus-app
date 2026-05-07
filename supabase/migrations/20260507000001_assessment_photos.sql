-- Migration: Assessment Photos Feature
-- Creates assessment_photos table and storage bucket

-- Create assessment_photos table
CREATE TABLE assessment_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES physical_assessments(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES trainers(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  storage_path TEXT NOT NULL,
  label TEXT CHECK (label IN ('frente', 'costas', 'lateral_dir', 'lateral_esq', 'outro')) DEFAULT 'outro',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Performance indexes
CREATE INDEX idx_assessment_photos_assessment_id ON assessment_photos(assessment_id);
CREATE INDEX idx_assessment_photos_client_id ON assessment_photos(client_id);

-- Enable RLS
ALTER TABLE assessment_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policy: trainers can only manage photos for their own clients
CREATE POLICY "trainer_can_manage_own_photos" ON assessment_photos
  FOR ALL USING (
    trainer_id IN (
      SELECT id FROM trainers WHERE user_id = auth.uid()
    )
  );

-- Create storage bucket for assessment photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assessment-photos',
  'assessment-photos', 
  false,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
CREATE POLICY "Allow authenticated users to insert photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'assessment-photos' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Allow authenticated users to select photos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'assessment-photos' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Allow authenticated users to delete photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'assessment-photos' AND
    auth.uid() IS NOT NULL
  );