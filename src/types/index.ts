export interface Subject {
  id: string;
  user_id: string;
  name: string;
  subject_code: string | null;
  syllabus_url?: string | null;
  syllabus_path?: string | null;
  syllabus_filename?: string | null;
  position: number;
  created_at: string;
  updated_at: string;
  chapter_count?: number;
}

export interface Chapter {
  id: string;
  subject_id: string;
  user_id: string;
  name: string;
  chapter_number: string | null;
  summary: string;
  position: number;
  created_at: string;
  updated_at: string;
  topic_count?: number;
  resource_count?: number;
}

export interface Topic {
  id: string;
  chapter_id: string;
  user_id: string;
  name: string;
  question: string;
  answer: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface ChapterResource {
  id: string;
  chapter_id: string;
  user_id: string;
  title: string;
  description: string | null;
  resource_type: 'image' | 'pdf' | 'document';
  storage_path: string;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
  updated_at: string;
  public_url?: string;
}

export interface SubjectResource {
  id: string;
  subject_id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: 'pyq' | 'model_answer' | 'notes' | 'other';
  year_session: string | null; // e.g. 'Winter 2023', 'Summer 2024'
  storage_path: string;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
  updated_at: string;
  public_url?: string;
}

export type ViewMode = 
  | { type: 'subjects' }
  | { type: 'subject-detail'; subjectId: string }
  | { type: 'chapter-detail'; subjectId: string; chapterId: string }
  | { type: 'topic-detail'; subjectId: string; chapterId: string; topicId: string };

export interface SearchResultItem {
  id: string;
  type: 'subject' | 'chapter' | 'topic';
  title: string;
  subtitle?: string;
  subjectId: string;
  chapterId?: string;
  topicId?: string;
  snippet?: string;
  matchField?: string;
}
