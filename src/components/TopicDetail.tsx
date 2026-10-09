import React, { useState } from 'react';
import type { Subject, Chapter, Topic } from '../types';
import {
  HelpCircle,
  Edit3,
  Trash2,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Printer,
  Copy,
  Check,
} from 'lucide-react';
import { AnswerViewer } from './AnswerEditor';
import { TopicModal } from './TopicModal';
import { ConfirmModal } from './ConfirmModal';

interface TopicDetailProps {
  subject: Subject;
  chapter: Chapter;
  topic: Topic;
  allTopics: Topic[];
  onBackToChapter: () => void;
  onNavigateTopic: (topicId: string) => void;
  onUpdateTopic: (data: { name: string; question: string; answer: string }) => Promise<void>;
  onDeleteTopic: () => Promise<void>;
}

export const TopicDetail: React.FC<TopicDetailProps> = ({
  subject,
  chapter,
  topic,
  allTopics,
  onBackToChapter,
  onNavigateTopic,
  onUpdateTopic,
  onDeleteTopic,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copied, setCopied] = useState(false);

  // Determine prev and next topic index
  const currentIndex = allTopics.findIndex((t) => t.id === topic.id);
  const prevTopic = currentIndex > 0 ? allTopics[currentIndex - 1] : null;
  const nextTopic = currentIndex >= 0 && currentIndex < allTopics.length - 1 ? allTopics[currentIndex + 1] : null;

  const handleCopyAnswer = async () => {
    try {
      // Strip HTML tags for clipboard plain text
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = topic.answer || '';
      const textToCopy = `Question:\n${topic.question}\n\nAnswer:\n${tempDiv.textContent || tempDiv.innerText || ''}`;
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDeleteTopic();
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <button
          onClick={onBackToChapter}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {chapter.chapter_number ? `${chapter.chapter_number}: ` : ''}{chapter.name}</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Copy */}
          <button
            onClick={handleCopyAnswer}
            className="p-1.5 rounded-md border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors text-xs flex items-center gap-1"
            title="Copy question and answer to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {/* Print */}
          <button
            onClick={handlePrint}
            className="p-1.5 rounded-md border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors text-xs flex items-center gap-1"
            title="Print or save as PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print</span>
          </button>

          {/* Edit */}
          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-1.5 rounded-md bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-white text-xs font-medium flex items-center gap-1 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Topic</span>
          </button>

          {/* Delete */}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-1.5 rounded-md border border-neutral-200 dark:border-neutral-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors text-xs"
            title="Delete topic"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Topic Content Paper / Notebook */}
      <article className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 sm:p-8 shadow-xs">
        {/* Topic Title */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mb-2">
            <span className="font-mono bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
              {subject.subject_code ? subject.subject_code : subject.name}
            </span>
            <span>&bull;</span>
            <span>{chapter.chapter_number ? `${chapter.chapter_number}` : chapter.name}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            {topic.name}
          </h1>
        </div>

        {/* Exam Question Card */}
        {topic.question ? (
          <div className="mb-8 p-4 rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40">
            <div className="flex items-start gap-2.5">
              <div className="p-1 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 shrink-0 mt-0.5">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Possible Exam Question
                </span>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 leading-snug">
                  {topic.question}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Exam-Ready Answer Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Exam-Ready Answer &amp; Notes
            </h2>
            <span className="text-[11px] text-neutral-400">
              Last saved: {new Date(topic.updated_at).toLocaleDateString()}
            </span>
          </div>

          <div className="pt-2">
            <AnswerViewer html={topic.answer} />
          </div>
        </div>
      </article>

      {/* Prev / Next Topic Navigation Footer */}
      {(prevTopic || nextTopic) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {prevTopic ? (
            <button
              onClick={() => onNavigateTopic(prevTopic.id)}
              className="flex items-center gap-3 p-3 text-left rounded-md border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 bg-white dark:bg-neutral-900 transition-colors group cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-neutral-100" />
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-mono text-neutral-400 block">Previous Topic</span>
                <span className="text-xs font-medium text-neutral-900 dark:text-neutral-100 truncate block">
                  {prevTopic.name}
                </span>
              </div>
            </button>
          ) : <div />}

          {nextTopic ? (
            <button
              onClick={() => onNavigateTopic(nextTopic.id)}
              className="flex items-center justify-between p-3 text-right rounded-md border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 bg-white dark:bg-neutral-900 transition-colors group sm:col-start-2 cursor-pointer"
            >
              <div className="min-w-0 text-left sm:text-right flex-1">
                <span className="text-[10px] uppercase font-mono text-neutral-400 block">Next Topic</span>
                <span className="text-xs font-medium text-neutral-900 dark:text-neutral-100 truncate block">
                  {nextTopic.name}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-neutral-100 shrink-0 ml-3" />
            </button>
          ) : <div />}
        </div>
      )}

      {/* Edit Topic Modal */}
      <TopicModal
        isOpen={isEditing}
        topic={topic}
        onSave={async (data) => {
          await onUpdateTopic(data);
          setIsEditing(false);
        }}
        onClose={() => setIsEditing(false)}
      />

      {/* Delete Topic Confirm Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Topic?"
        message={`Are you sure you want to delete "${topic.name}"? This topic and its exam answer will be permanently removed.`}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
};
