import React, { useState, useRef } from 'react';
import { X, Upload, FileText, AlertCircle, Loader2, Tag } from 'lucide-react';
import type { SubjectResource } from '../types';

interface AddPYQModalProps {
  isOpen: boolean;
  subjectName: string;
  onUpload: (data: {
    file: File;
    title: string;
    year_session?: string;
    category: SubjectResource['category'];
    description?: string;
  }) => Promise<void>;
  onClose: () => void;
}

const COMMON_SESSIONS = [
  'Winter 2024',
  'Summer 2024',
  'Winter 2023',
  'Summer 2023',
  'Winter 2022',
  'Model Paper',
];

export const AddPYQModal: React.FC<AddPYQModalProps> = ({
  isOpen,
  subjectName,
  onUpload,
  onClose,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [yearSession, setYearSession] = useState('');
  const [category, setCategory] = useState<SubjectResource['category']>('pyq');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a valid PDF file. Papers and PYQs must be in PDF format.');
      setFile(null);
      return;
    }
    setError(null);
    setFile(selectedFile);

    // Auto-generate a clean title if title is empty
    if (!title) {
      const cleanName = selectedFile.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      setTitle(cleanName);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a question paper PDF.');
      return;
    }
    if (!title.trim()) {
      setError('Please enter a paper title.');
      return;
    }

    setIsUploading(true);
    setError(null);
    try {
      await onUpload({
        file,
        title: title.trim(),
        year_session: yearSession.trim() || undefined,
        category,
        description: description.trim() || undefined,
      });
      // Reset & close
      setFile(null);
      setTitle('');
      setYearSession('');
      setDescription('');
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to upload paper';
      setError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Add Previous Year Paper / PDF
              </h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                {subjectName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-2.5 rounded bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Drag & Drop File */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Select Question Paper PDF <span className="text-red-500">*</span>
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer border-2 border-dashed rounded-lg p-5 text-center transition-colors ${
                isDragging
                  ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-50 dark:bg-neutral-800/50'
                  : file
                  ? 'border-neutral-400 dark:border-neutral-600 bg-neutral-50/50 dark:bg-neutral-850/50'
                  : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />

              {file ? (
                <div className="flex flex-col items-center">
                  <div className="p-2 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 mb-1.5">
                    <FileText className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 max-w-[280px] truncate">
                    {file.name}
                  </p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {formatFileSize(file.size)} &bull; Click to choose different file
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 mb-1.5">
                    <Upload className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
                    Click to select or drag &amp; drop PDF paper
                  </p>
                  <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                    PDF format only
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Title input */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Paper Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Winter 2023 Question Paper"
              required
              className="w-full px-3 py-2 text-xs rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-400"
            />
          </div>

          {/* Category selection */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'pyq', label: 'Question Paper' },
                { id: 'model_answer', label: 'Model Answer' },
                { id: 'notes', label: 'Notes / Bank' },
                { id: 'other', label: 'Other' },
              ].map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setCategory(cat.id as SubjectResource['category'])}
                  className={`px-2.5 py-1.5 text-xs rounded-md border text-center transition-colors ${
                    category === cat.id
                      ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-medium'
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Exam Session / Year with quick chips */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Exam Session / Year
            </label>
            <input
              type="text"
              value={yearSession}
              onChange={(e) => setYearSession(e.target.value)}
              placeholder="e.g. Winter 2023 or Summer 2024"
              className="w-full px-3 py-2 text-xs rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-400"
            />
            {/* Quick Chips */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[11px] text-neutral-400 flex items-center gap-1 mr-1">
                <Tag className="w-3 h-3" /> Quick fill:
              </span>
              {COMMON_SESSIONS.map((session) => (
                <button
                  type="button"
                  key={session}
                  onClick={() => setYearSession(session)}
                  className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                    yearSession === session
                      ? 'border-neutral-900 dark:border-white bg-neutral-100 dark:bg-neutral-800 font-medium text-neutral-900 dark:text-white'
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                >
                  {session}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Notes / Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Any specific note regarding marks weightage, topics covered, etc."
              className="w-full px-3 py-2 text-xs rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-400 resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-3.5 py-1.5 text-xs font-medium rounded-md border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!file || !title.trim() || isUploading}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-md bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-white transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Uploading Paper...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Paper</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
