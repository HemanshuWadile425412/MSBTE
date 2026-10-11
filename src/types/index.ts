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
  | { type: 'topic-detail'; subjectId: string; chapterId: string; topicId: string }
  | { type: 'predicted-result' }
  | { type: 'progress-tracker' };

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

export interface AssessmentHead {
  name: string; // e.g. 'TH-ESE', 'TH-PA', 'PR-ESE', 'PR-PA'
  title: string; // e.g. 'End Sem Theory', 'Progressive Theory'
  maxMarks: number;
  minMarks: number;
  obtainedMarks: number | null;
}

export interface SubjectMarksheetData {
  code: string;
  abbr: string;
  name: string;
  isElective?: boolean;
  heads: AssessmentHead[];
  totalMax: number;
  totalObtained: number;
  isPassed: boolean;
}

export interface PredictedResult {
  id?: string;
  user_id: string;
  student_name: string;
  enrollment_no: string;
  seat_no: string;
  exam_session: string;
  course_semester: string;
  elective_code: string; // '315321' | '315325' | '315326'
  subjects_data: SubjectMarksheetData[];
  overall_max: number;
  overall_obtained: number;
  percentage: number;
  result_class: string;
  created_at?: string;
  updated_at?: string;
}

export interface ChapterProgressItem {
  id?: string;
  user_id: string;
  subject_code: 'OSY' | 'STE' | 'DAN';
  chapter_number: number; // 1 to 6
  is_completed: boolean;
  updated_at?: string;
}

