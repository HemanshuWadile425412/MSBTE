-- Migration: Add Predicted Results and Chapter Progress Tables

CREATE TABLE IF NOT EXISTS public.predicted_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    student_name TEXT DEFAULT '',
    enrollment_no TEXT DEFAULT '',
    seat_no TEXT DEFAULT '',
    exam_session TEXT DEFAULT 'Winter 2026',
    course_semester TEXT DEFAULT 'Diploma in Computer Engineering - Semester V',
    elective_code TEXT NOT NULL DEFAULT '315326',
    subjects_data JSONB NOT NULL DEFAULT '[]'::jsonb,
    overall_max INTEGER NOT NULL DEFAULT 850,
    overall_obtained NUMERIC(6,2) NOT NULL DEFAULT 0,
    percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
    result_class TEXT DEFAULT 'PASS',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_predicted_results_user UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_predicted_results_user_id ON public.predicted_results(user_id);

ALTER TABLE public.predicted_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own predicted result"
    ON public.predicted_results FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own predicted result"
    ON public.predicted_results FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own predicted result"
    ON public.predicted_results FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own predicted result"
    ON public.predicted_results FOR DELETE
    USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.chapter_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject_code TEXT NOT NULL,
    chapter_number INTEGER NOT NULL CHECK (chapter_number >= 1 AND chapter_number <= 6),
    is_completed BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_chapter_progress_user_subject_chapter UNIQUE (user_id, subject_code, chapter_number)
);

CREATE INDEX IF NOT EXISTS idx_chapter_progress_user_id ON public.chapter_progress(user_id);

ALTER TABLE public.chapter_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own chapter progress"
    ON public.chapter_progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chapter progress"
    ON public.chapter_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chapter progress"
    ON public.chapter_progress FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chapter progress"
    ON public.chapter_progress FOR DELETE
    USING (auth.uid() = user_id);
