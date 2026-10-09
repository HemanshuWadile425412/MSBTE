import React, { useState } from 'react';
import type { Subject, Chapter, Topic } from '../types';
import {
  Plus,
  ArrowLeft,
  Edit2,
  Trash2,
  FileText,
  ChevronRight,
  HelpCircle,
  Loader2,
} from 'lucide-react';
import { ChapterOverallInfo } from './ChapterOverallInfo';
import { TopicModal } from './TopicModal';
import { ChapterModal } from './ChapterModal';
import { ConfirmModal } from './ConfirmModal';

interface ChapterDetailProps {
  subject: Subject;
  chapter: Chapter;
  topics: Topic[];
  userId: string;
  isLoadingTopics?: boolean;
  onBackToSubject: () => void;
  onOpenTopic: (topicId: string) => void;
  onUpdateChapter: (data: { name: string; chapter_number?: string }) => Promise<void>;
  onUpdateChapterSummary: (newSummary: string) => Promise<void>;
  onDeleteChapter: () => Promise<void>;
  onCreateTopic: (data: { name: string; question: string; answer: string }) => Promise<void>;
}

export const ChapterDetail: React.FC<ChapterDetailProps> = ({
  subject,
  chapter,
  topics,
  userId,
  isLoadingTopics = false,
  onBackToSubject,
  onOpenTopic,
  onUpdateChapter,
  onUpdateChapterSummary,
  onDeleteChapter,
  onCreateTopic,
}) => {
  const [isEditingChapter, setIsEditingChapter] = useState(false);
  const [showDeleteChapterConfirm, setShowDeleteChapterConfirm] = useState(false);
  const [isDeletingChapter, setIsDeletingChapter] = useState(false);

  const [isAddingTopic, setIsAddingTopic] = useState(false);

  const handleDeleteChapter = async () => {
    setIsDeletingChapter(true);
    try {
      await onDeleteChapter();
    } finally {
      setIsDeletingChapter(false);
      setShowDeleteChapterConfirm(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar / Breadcrumb / Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <button
          onClick={onBackToSubject}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {subject.name}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditingChapter(true)}
            className="p-1.5 rounded-md border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors text-xs flex items-center gap-1"
            title="Edit chapter title/number"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Edit Chapter</span>
          </button>

          <button
            onClick={() => setShowDeleteChapterConfirm(true)}
            className="p-1.5 rounded-md border border-neutral-200 dark:border-neutral-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors text-xs"
            title="Delete chapter"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Chapter Title Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mb-1">
          <span className="font-mono bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
            {subject.subject_code || subject.name}
          </span>
          {chapter.chapter_number && (
            <>
              <span>&bull;</span>
              <span className="font-medium text-neutral-700 dark:text-neutral-300">
                {chapter.chapter_number}
              </span>
            </>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          {chapter.name}
        </h1>
      </div>

      {/* 1. Overall Information Section */}
      <ChapterOverallInfo
        chapter={chapter}
        onUpdateSummary={onUpdateChapterSummary}
        userId={userId}
      />

      {/* 2. Topics Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Exam Topics &amp; Questions ({topics.length})
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Click any topic to view its full exam question and formatted answer.
            </p>
          </div>

          <button
            onClick={() => setIsAddingTopic(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-white text-xs font-medium transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Topic</span>
          </button>
        </div>

        {isLoadingTopics && topics.length === 0 ? (
          <div className="py-12 text-center text-xs text-neutral-400">
            <Loader2 className="w-4 h-4 animate-spin inline mr-1.5" />
            Loading topics...
          </div>
        ) : topics.length === 0 ? (
          <div className="py-12 text-center bg-white dark:bg-neutral-900 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg p-6">
            <FileText className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              No topics in this chapter yet
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
              Add individual topics with their possible exam questions and model answers to start building your study notes.
            </p>
            <button
              onClick={() => setIsAddingTopic(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-md hover:bg-neutral-800 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add First Topic</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {topics.map((t, idx) => (
              <div
                key={t.id}
                onClick={() => onOpenTopic(t.id)}
                className="group p-3.5 sm:p-4 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-start gap-3 min-w-0 pr-3">
                  <span className="text-xs font-mono text-neutral-400 mt-0.5 shrink-0">
                    {idx + 1}.
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-neutral-950 dark:group-hover:text-white truncate">
                      {t.name}
                    </h3>

                    {t.question ? (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1 mt-1 truncate">
                        <HelpCircle className="w-3 h-3 text-amber-600 shrink-0" />
                        <span className="truncate">{t.question}</span>
                      </p>
                    ) : (
                      <p className="text-xs text-neutral-400 dark:text-neutral-500 italic mt-0.5">
                        No question specified
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {t.answer && t.answer !== '<p></p>' ? (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40 hidden sm:inline-block">
                      Answer saved
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hidden sm:inline-block">
                      Draft
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-neutral-100 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Chapter Modal */}
      <ChapterModal
        isOpen={isEditingChapter}
        chapter={chapter}
        onSave={async (data) => {
          await onUpdateChapter(data);
          setIsEditingChapter(false);
        }}
        onClose={() => setIsEditingChapter(false)}
      />

      {/* Delete Chapter Confirm Modal */}
      <ConfirmModal
        isOpen={showDeleteChapterConfirm}
        title="Delete Chapter?"
        message={`Are you sure you want to delete "${chapter.name}"? All topics, summaries, and revision materials in this chapter will be permanently deleted.`}
        isLoading={isDeletingChapter}
        onConfirm={handleDeleteChapter}
        onCancel={() => setShowDeleteChapterConfirm(false)}
      />

      {/* Add Topic Modal */}
      <TopicModal
        isOpen={isAddingTopic}
        onSave={async (data) => {
          await onCreateTopic(data);
          setIsAddingTopic(false);
        }}
        onClose={() => setIsAddingTopic(false)}
      />
    </div>
  );
};
