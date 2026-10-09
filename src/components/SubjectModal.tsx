import React, { useState, useEffect } from 'react';
import type { Subject } from '../types';
import { X, BookOpen } from 'lucide-react';

interface SubjectModalProps {
  isOpen: boolean;
  subject?: Subject | null;
  isLoading?: boolean;
  onSave: (data: { name: string; subject_code?: string }) => Promise<void>;
  onClose: () => void;
}

export const SubjectModal: React.FC<SubjectModalProps> = ({
  isOpen,
  subject,
  isLoading = false,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (subject) {
      setName(subject.name);
      setSubjectCode(subject.subject_code || '');
    } else {
      setName('');
      setSubjectCode('');
    }
    setError(null);
  }, [subject, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Subject name is required.');
      return;
    }

    try {
      await onSave({
        name: name.trim(),
        subject_code: subjectCode.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save subject');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 shadow-xl">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <BookOpen className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            {subject ? 'Edit Subject' : 'Add New Subject'}
          </h3>
        </div>

        {error && (
          <div className="mb-4 p-2.5 text-xs rounded border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Subject Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Operating Systems, Advanced Java, Software Engineering"
              required
              autoFocus
              className="w-full text-sm px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Subject Code <span className="text-neutral-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={subjectCode}
              onChange={(e) => setSubjectCode(e.target.value)}
              placeholder="e.g. 22516, OSY-501"
              className="w-full text-sm font-mono px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-400"
            />
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-2">
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
              className="px-4 py-2 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white rounded-md transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : subject ? 'Update Subject' : 'Add Subject'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
