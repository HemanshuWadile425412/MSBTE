import React, { useState, useEffect } from 'react';
import type { Topic } from '../types';
import { X, HelpCircle, FileText } from 'lucide-react';
import { AnswerEditor } from './AnswerEditor';

interface TopicModalProps {
  isOpen: boolean;
  topic?: Topic | null;
  isLoading?: boolean;
  onSave: (data: { name: string; question: string; answer: string }) => Promise<void>;
  onClose: () => void;
}

export const TopicModal: React.FC<TopicModalProps> = ({
  isOpen,
  topic,
  isLoading = false,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (topic) {
      setName(topic.name);
      setQuestion(topic.question || '');
      setAnswer(topic.answer || '');
    } else {
      setName('');
      setQuestion('');
      setAnswer('');
    }
    setError(null);
  }, [topic, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Topic name is required.');
      return;
    }

    try {
      await onSave({
        name: name.trim(),
        question: question.trim(),
        answer: answer.trim(),
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save topic');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl my-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-5 sm:p-6 shadow-2xl">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <FileText className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            {topic ? 'Edit Topic & Exam Answer' : 'Add New Topic & Exam Answer'}
          </h3>
        </div>

        {error && (
          <div className="mb-4 p-2.5 text-xs rounded border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Topic Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1">
              Topic Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Critical Section Problem &amp; Peterson's Solution"
              required
              autoFocus
              className="w-full text-sm px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-400"
            />
          </div>

          {/* Exam Question */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Possible Exam Question</span>
              <span className="text-neutral-400 font-normal lowercase">(how it appears on question papers)</span>
            </label>
            <textarea
              rows={2}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. State what is Critical Section problem. Explain the criteria to be satisfied by any solution to Critical Section problem. (4 Marks)"
              className="w-full text-sm px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-400 font-sans"
            />
          </div>

          {/* Formatted Answer Editor */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1">
              Exam-Ready Answer / Explanation
            </label>
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mb-2">
              Use headings, bullet points, numbers, and bold text for maximum exam marks. Formatting is preserved.
            </p>
            <AnswerEditor
              content={answer}
              onChange={setAnswer}
              placeholder="Write the complete exam-ready answer here. Include definitions, key points, numbered steps, and conclusions..."
            />
          </div>

          {/* Footer actions */}
          <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md border border-neutral-300 dark:border-neutral-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="px-5 py-2 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white rounded-md transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : topic ? 'Update Topic' : 'Save Topic'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
