-- ==============================================================================
-- ACADEMIC WORKSPACE: SUPABASE DATABASE MIGRATION & RLS POLICIES
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Subjects Table
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    subject_code TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Create Chapters Table
CREATE TABLE IF NOT EXISTS public.chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    chapter_number TEXT,
    summary TEXT DEFAULT '',
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Create Topics Table
CREATE TABLE IF NOT EXISTS public.topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    question TEXT NOT NULL DEFAULT '',
    answer TEXT NOT NULL DEFAULT '',
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Create Chapter Resources Table
CREATE TABLE IF NOT EXISTS public.chapter_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    resource_type TEXT NOT NULL, -- 'image' or 'pdf' or 'document'
    storage_path TEXT NOT NULL,
    file_name TEXT,
    file_size BIGINT,
    mime_type TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Indexes for Performance and Queries
CREATE INDEX IF NOT EXISTS idx_subjects_user_id ON public.subjects(user_id);
CREATE INDEX IF NOT EXISTS idx_subjects_position ON public.subjects(position);

CREATE INDEX IF NOT EXISTS idx_chapters_subject_id ON public.chapters(subject_id);
CREATE INDEX IF NOT EXISTS idx_chapters_user_id ON public.chapters(user_id);
CREATE INDEX IF NOT EXISTS idx_chapters_position ON public.chapters(position);

CREATE INDEX IF NOT EXISTS idx_topics_chapter_id ON public.topics(chapter_id);
CREATE INDEX IF NOT EXISTS idx_topics_user_id ON public.topics(user_id);
CREATE INDEX IF NOT EXISTS idx_topics_position ON public.topics(position);

CREATE INDEX IF NOT EXISTS idx_chapter_resources_chapter_id ON public.chapter_resources(chapter_id);
CREATE INDEX IF NOT EXISTS idx_chapter_resources_user_id ON public.chapter_resources(user_id);

-- 7. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_resources ENABLE ROW LEVEL SECURITY;

-- 8. Row Level Security Policies for Subjects
DROP POLICY IF EXISTS "Users can view their own subjects" ON public.subjects;
CREATE POLICY "Users can view their own subjects"
    ON public.subjects FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own subjects" ON public.subjects;
CREATE POLICY "Users can insert their own subjects"
    ON public.subjects FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own subjects" ON public.subjects;
CREATE POLICY "Users can update their own subjects"
    ON public.subjects FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own subjects" ON public.subjects;
CREATE POLICY "Users can delete their own subjects"
    ON public.subjects FOR DELETE
    USING (auth.uid() = user_id);

-- 9. Row Level Security Policies for Chapters
DROP POLICY IF EXISTS "Users can view their own chapters" ON public.chapters;
CREATE POLICY "Users can view their own chapters"
    ON public.chapters FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert chapters into their subjects" ON public.chapters;
CREATE POLICY "Users can insert chapters into their subjects"
    ON public.chapters FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (SELECT 1 FROM public.subjects s WHERE s.id = subject_id AND s.user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can update their own chapters" ON public.chapters;
CREATE POLICY "Users can update their own chapters"
    ON public.chapters FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (SELECT 1 FROM public.subjects s WHERE s.id = subject_id AND s.user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can delete their own chapters" ON public.chapters;
CREATE POLICY "Users can delete their own chapters"
    ON public.chapters FOR DELETE
    USING (auth.uid() = user_id);

-- 10. Row Level Security Policies for Topics
DROP POLICY IF EXISTS "Users can view their own topics" ON public.topics;
CREATE POLICY "Users can view their own topics"
    ON public.topics FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert topics into their chapters" ON public.topics;
CREATE POLICY "Users can insert topics into their chapters"
    ON public.topics FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (SELECT 1 FROM public.chapters c WHERE c.id = chapter_id AND c.user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can update their own topics" ON public.topics;
CREATE POLICY "Users can update their own topics"
    ON public.topics FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (SELECT 1 FROM public.chapters c WHERE c.id = chapter_id AND c.user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can delete their own topics" ON public.topics;
CREATE POLICY "Users can delete their own topics"
    ON public.topics FOR DELETE
    USING (auth.uid() = user_id);

-- 11. Row Level Security Policies for Chapter Resources
DROP POLICY IF EXISTS "Users can view their own chapter resources" ON public.chapter_resources;
CREATE POLICY "Users can view their own chapter resources"
    ON public.chapter_resources FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert chapter resources into their chapters" ON public.chapter_resources;
CREATE POLICY "Users can insert chapter resources into their chapters"
    ON public.chapter_resources FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (SELECT 1 FROM public.chapters c WHERE c.id = chapter_id AND c.user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can update their own chapter resources" ON public.chapter_resources;
CREATE POLICY "Users can update their own chapter resources"
    ON public.chapter_resources FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (SELECT 1 FROM public.chapters c WHERE c.id = chapter_id AND c.user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can delete their own chapter resources" ON public.chapter_resources;
CREATE POLICY "Users can delete their own chapter resources"
    ON public.chapter_resources FOR DELETE
    USING (auth.uid() = user_id);

-- 12. Supabase Storage Bucket & Storage Security Policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('academic_materials', 'academic_materials', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can upload materials" ON storage.objects;
CREATE POLICY "Authenticated users can upload materials"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'academic_materials' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can read academic materials" ON storage.objects;
CREATE POLICY "Users can read academic materials"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'academic_materials' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update their materials" ON storage.objects;
CREATE POLICY "Users can update their materials"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'academic_materials' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete their materials" ON storage.objects;
CREATE POLICY "Users can delete their materials"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'academic_materials' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 13. Auto Confirm Users Trigger (Zero Email Confirmation Required)
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email_confirmed_at = COALESCE(NEW.email_confirmed_at, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_auto_confirm ON auth.users;
CREATE TRIGGER on_auth_user_created_auto_confirm
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_user();

-- 14. Subject Syllabus & Subject-Level PYQs
ALTER TABLE public.subjects
ADD COLUMN IF NOT EXISTS syllabus_url TEXT,
ADD COLUMN IF NOT EXISTS syllabus_path TEXT,
ADD COLUMN IF NOT EXISTS syllabus_filename TEXT;

CREATE TABLE IF NOT EXISTS public.subject_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'pyq', -- 'pyq' | 'model_answer' | 'notes' | 'other'
    year_session TEXT,
    storage_path TEXT NOT NULL,
    file_name TEXT,
    file_size BIGINT,
    mime_type TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_subject_resources_subject_id ON public.subject_resources(subject_id);
CREATE INDEX IF NOT EXISTS idx_subject_resources_user_id ON public.subject_resources(user_id);

ALTER TABLE public.subject_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subject resources"
    ON public.subject_resources FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert subject resources into their subjects"
    ON public.subject_resources FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (SELECT 1 FROM public.subjects s WHERE s.id = subject_id AND s.user_id = auth.uid())
    );

CREATE POLICY "Users can update their own subject resources"
    ON public.subject_resources FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (SELECT 1 FROM public.subjects s WHERE s.id = subject_id AND s.user_id = auth.uid())
    );

CREATE POLICY "Users can delete their own subject resources"
    ON public.subject_resources FOR DELETE
    USING (auth.uid() = user_id);


