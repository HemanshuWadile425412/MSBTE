import React, { useState } from 'react';
import type { Subject, Chapter } from '../types';
import {
  Plus,
  ArrowLeft,
  Edit2,
  Trash2,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Layers,
  FileText,
  Paperclip,
  Loader2,
  BookOpen,
  FileCheck2,
  MoreVertical,
  Upload,
} from 'lucide-react';
import { ChapterModal } from './ChapterModal';
import { SubjectModal } from './SubjectModal';
import { ConfirmModal } from './ConfirmModal';
import { SyllabusUploadModal } from './SyllabusUploadModal';
import { PdfViewerModal } from './PdfViewerModal';
import { SubjectPYQSection } from './SubjectPYQSection';
import { uploadSubjectSyllabus, deleteStorageFile } from '../lib/supabase';

interface SubjectDetailProps {
  subject: Subject;
  chapters: Chapter[];
  userId: string;
  isLoadingChapters?: boolean;
  onBackToSubjects: () => void;
  onOpenChapter: (chapterId: string) => void;
  onUpdateSubject: (data: Partial<Subject>) => Promise<void>;
  onDeleteSubject: () => Promise<void>;
  onCreateChapter: (data: { name: string; chapter_number?: string }) => Promise<void>;
  onReorderChapters: (reorderedChapters: Chapter[]) => Promise<void>;
}

export const SubjectDetail: React.FC<SubjectDetailProps> = ({
  subject,
  chapters,
  userId,
  isLoadingChapters = false,
  onBackToSubjects,
  onOpenChapter,
  onUpdateSubject,
  onDeleteSubject,
  onCreateChapter,
  onReorderChapters,
}) => {
  // Tabs: 'chapters' or 'pyqs'
  const [activeTab, setActiveTab] = useState<'chapters' | 'pyqs'>('chapters');

  // Subject Edit / Delete
  const [isEditingSubject, setIsEditingSubject] = useState(false);
  const [showDeleteSubjectConfirm, setShowDeleteSubjectConfirm] = useState(false);
  const [isDeletingSubject, setIsDeletingSubject] = useState(false);

  // Chapters
  const [isAddingChapter, setIsAddingChapter] = useState(false);

  // Syllabus Modal / In-App Viewer
  const [isUploadSyllabusOpen, setIsUploadSyllabusOpen] = useState(false);
  const [isViewingSyllabus, setIsViewingSyllabus] = useState(false);
  const [showSyllabusMenu, setShowSyllabusMenu] = useState(false);
  const [showDeleteSyllabusConfirm, setShowDeleteSyllabusConfirm] = useState(false);
  const [isDeletingSyllabus, setIsDeletingSyllabus] = useState(false);

  const handleMoveChapter = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= chapters.length) return;

    const newChapters = [...chapters];
    const temp = newChapters[index];
    newChapters[index] = newChapters[targetIndex];
    newChapters[targetIndex] = temp;

    const updatedWithPositions = newChapters.map((ch, idx) => ({
      ...ch,
      position: idx,
    }));

    await onReorderChapters(updatedWithPositions);
  };

  const handleDeleteSubject = async () => {
    setIsDeletingSubject(true);
    try {
      await onDeleteSubject();
    } finally {
      setIsDeletingSubject(false);
      setShowDeleteSubjectConfirm(false);
    }
  };

  // Click on "See Syllabus" button
  const handleSeeSyllabusClick = () => {
    if (subject.syllabus_url) {
      // Directly open the syllabus PDF in-app!
      setIsViewingSyllabus(true);
    } else {
      // Prompt to upload syllabus PDF
      setIsUploadSyllabusOpen(true);
    }
  };

  // Syllabus Upload Handler
  const handleUploadSyllabus = async (file: File) => {
    // 1. Upload to Supabase Storage
    const { path, publicUrl } = await uploadSubjectSyllabus(userId, subject.id, file);

    // 2. If there was a previous syllabus file, clean it up
    if (subject.syllabus_path && subject.syllabus_path !== path) {
      await deleteStorageFile(subject.syllabus_path);
    }

    // 3. Update Subject in DB and state
    await onUpdateSubject({
      syllabus_url: publicUrl,
      syllabus_path: path,
      syllabus_filename: file.name,
    });

    // 4. Directly open the newly uploaded syllabus PDF in the app viewer!
    setIsViewingSyllabus(true);
  };

  // Syllabus Delete Handler
  const handleDeleteSyllabus = async () => {
    setIsDeletingSyllabus(true);
    try {
      if (subject.syllabus_path) {
        await deleteStorageFile(subject.syllabus_path);
      }
      await onUpdateSubject({
        syllabus_url: null,
        syllabus_path: null,
        syllabus_filename: null,
      });
      setIsViewingSyllabus(false);
      setShowDeleteSyllabusConfirm(false);
      setShowSyllabusMenu(false);
    } catch (err) {
      console.error('Failed to delete syllabus:', err);
    } finally {
      setIsDeletingSyllabus(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar / Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <button
          onClick={onBackToSubjects}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Subjects</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditingSubject(true)}
            className="p-1.5 rounded-md border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors text-xs flex items-center gap-1"
            title="Edit subject name/code"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Edit Subject</span>
          </button>

          <button
            onClick={() => setShowDeleteSubjectConfirm(true)}
            className="p-1.5 rounded-md border border-neutral-200 dark:border-neutral-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors text-xs"
            title="Delete subject"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Subject Header Banner */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            {subject.subject_code && (
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                {subject.subject_code}
              </span>
            )}
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {chapters.length} {chapters.length === 1 ? 'Chapter' : 'Chapters'}
            </span>

            {/* Syllabus Status Pill */}
            {subject.syllabus_url ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                <FileCheck2 className="w-3 h-3" />
                <span>Syllabus Attached</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] text-neutral-400 dark:text-neutral-500">
                &bull; No syllabus PDF added yet
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            {subject.name}
          </h1>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* "See Syllabus" Button */}
          <div className="relative inline-flex items-center">
            <button
              type="button"
              onClick={handleSeeSyllabusClick}
              className={`inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-md text-xs font-medium transition-all cursor-pointer shadow-xs ${
                subject.syllabus_url
                  ? 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-750 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700'
                  : 'bg-neutral-50 dark:bg-neutral-850 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-dashed border-neutral-300 dark:border-neutral-700'
              }`}
              title={
                subject.syllabus_url
                  ? 'Click to open syllabus PDF directly inside the app'
                  : 'Click to upload syllabus PDF for this subject'
              }
            >
              <BookOpen className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span>See Syllabus</span>
              {subject.syllabus_url && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              )}
            </button>

            {/* Syllabus options menu (if syllabus exists) */}
            {subject.syllabus_url && (
              <div className="relative ml-1">
                <button
                  type="button"
                  onClick={() => setShowSyllabusMenu((prev) => !prev)}
                  className="p-2 rounded-md border border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  title="Syllabus options"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>

                {showSyllabusMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowSyllabusMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 z-50 w-44 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-md shadow-lg py-1 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setShowSyllabusMenu(false);
                          setIsUploadSyllabusOpen(true);
                        }}
                        className="w-full text-left px-3 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Replace Syllabus PDF</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowSyllabusMenu(false);
                          setShowDeleteSyllabusConfirm(true);
                        }}
                        className="w-full text-left px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Syllabus</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Add Chapter Button */}
          <button
            onClick={() => setIsAddingChapter(true)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-md bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-white text-xs font-medium transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Chapter</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs: Chapters & Units vs PYQs & Papers */}
      <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-px">
        <button
          onClick={() => setActiveTab('chapters')}
          className={`flex items-center gap-2 pb-3 px-1 text-xs font-semibold transition-colors border-b-2 cursor-pointer ${
            activeTab === 'chapters'
              ? 'border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100'
              : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Chapters &amp; Units</span>
          <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
            {chapters.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('pyqs')}
          className={`flex items-center gap-2 pb-3 px-1 text-xs font-semibold transition-colors border-b-2 cursor-pointer ${
            activeTab === 'pyqs'
              ? 'border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100'
              : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Previous Year Papers (PYQs)</span>
        </button>
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'chapters' ? (
        /* Chapters List Section */
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Unit-wise Syllabus
            </h2>
            <span className="text-[11px] text-neutral-400">
              Use arrows to reorder syllabus chapters
            </span>
          </div>

          {isLoadingChapters && chapters.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-400">
              <Loader2 className="w-4 h-4 animate-spin inline mr-1.5" />
              Loading chapters...
            </div>
          ) : chapters.length === 0 ? (
            <div className="py-12 text-center bg-white dark:bg-neutral-900 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg p-6">
              <Layers className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                No chapters in this subject yet
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
                Add your first chapter or unit to organize exam topics, notes, and revision materials.
              </p>
              <button
                onClick={() => setIsAddingChapter(true)}
                className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-md hover:bg-neutral-800 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Chapter</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {chapters.map((ch, idx) => (
                <div
                  key={ch.id}
                  className="group p-3.5 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors flex items-center justify-between gap-3"
                >
                  {/* Reorder arrows */}
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveChapter(idx, 'up');
                      }}
                      disabled={idx === 0}
                      className="p-1 rounded text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 disabled:opacity-20 transition-colors"
                      title="Move chapter up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveChapter(idx, 'down');
                      }}
                      disabled={idx === chapters.length - 1}
                      className="p-1 rounded text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 disabled:opacity-20 transition-colors"
                      title="Move chapter down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Chapter clickable info */}
                  <div
                    onClick={() => onOpenChapter(ch.id)}
                    className="flex-1 min-w-0 cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        {ch.chapter_number ? (
                          <span className="text-[11px] font-mono font-semibold text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.2 rounded">
                            {ch.chapter_number}
                          </span>
                        ) : (
                          <span className="text-[11px] font-mono text-neutral-400">
                            {idx + 1}.
                          </span>
                        )}
                        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-neutral-950 dark:group-hover:white truncate">
                          {ch.name}
                        </h3>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3 text-neutral-400" />
                          <span>{ch.topic_count || 0} topics</span>
                        </span>
                        {Boolean(ch.resource_count) && (
                          <span className="flex items-center gap-1">
                            <Paperclip className="w-3 h-3 text-neutral-400" />
                            <span>{ch.resource_count} materials</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-neutral-100 group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* PYQs and Question Papers Section */
        <SubjectPYQSection subject={subject} userId={userId} />
      )}

      {/* Edit Subject Modal */}
      <SubjectModal
        isOpen={isEditingSubject}
        subject={subject}
        onSave={async (data) => {
          await onUpdateSubject(data);
          setIsEditingSubject(false);
        }}
        onClose={() => setIsEditingSubject(false)}
      />

      {/* Delete Subject Confirm */}
      <ConfirmModal
        isOpen={showDeleteSubjectConfirm}
        title="Delete Subject?"
        message={`Are you sure you want to delete "${subject.name}"? All ${chapters.length} chapters, their topics, notes, and uploaded question papers will be permanently deleted.`}
        isLoading={isDeletingSubject}
        onConfirm={handleDeleteSubject}
        onCancel={() => setShowDeleteSubjectConfirm(false)}
      />

      {/* Add Chapter Modal */}
      <ChapterModal
        isOpen={isAddingChapter}
        onSave={async (data) => {
          await onCreateChapter(data);
          setIsAddingChapter(false);
        }}
        onClose={() => setIsAddingChapter(false)}
      />

      {/* Syllabus Upload Modal */}
      <SyllabusUploadModal
        isOpen={isUploadSyllabusOpen}
        subjectName={subject.name}
        isReplacing={Boolean(subject.syllabus_url)}
        onUpload={handleUploadSyllabus}
        onClose={() => setIsUploadSyllabusOpen(false)}
      />

      {/* In-App Syllabus PDF Viewer Modal */}
      {subject.syllabus_url && (
        <PdfViewerModal
          isOpen={isViewingSyllabus}
          title={`${subject.name} - Official Syllabus`}
          fileName={subject.syllabus_filename || undefined}
          pdfUrl={subject.syllabus_url}
          onClose={() => setIsViewingSyllabus(false)}
          onDelete={() => {
            setIsViewingSyllabus(false);
            setShowDeleteSyllabusConfirm(true);
          }}
        />
      )}

      {/* Confirm Delete Syllabus */}
      <ConfirmModal
        isOpen={showDeleteSyllabusConfirm}
        title="Remove Syllabus PDF?"
        message={`Are you sure you want to remove the syllabus document for "${subject.name}"? You can upload a new one at any time.`}
        isLoading={isDeletingSyllabus}
        onConfirm={handleDeleteSyllabus}
        onCancel={() => setShowDeleteSyllabusConfirm(false)}
      />
    </div>
  );
};
