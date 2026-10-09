import React, { useState, useRef } from 'react';
import { X, Upload, FileText, AlertCircle, Loader2 } from 'lucide-react';

interface SyllabusUploadModalProps {
  isOpen: boolean;
  subjectName: string;
  isReplacing?: boolean;
  onUpload: (file: File) => Promise<void>;
  onClose: () => void;
}

export const SyllabusUploadModal: React.FC<SyllabusUploadModalProps> = ({
  isOpen,
  subjectName,
  isReplacing = false,
  onUpload,
  onClose,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a valid PDF file. Syllabus must be in PDF format.');
      setFile(null);
      return;
    }
    setError(null);
    setFile(selectedFile);
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
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a syllabus PDF file to upload.');
      return;
    }

    setIsUploading(true);
    setError(null);
    try {
      await onUpload(file);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to upload syllabus';
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
              <FileText className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {isReplacing ? 'Replace Syllabus PDF' : 'Upload Subject Syllabus'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Upload the official syllabus copy for <span className="font-semibold text-neutral-800 dark:text-neutral-200">{subjectName}</span>. 
            Once uploaded, clicking &quot;See Syllabus&quot; will directly open this document inside the app.
          </p>

          {error && (
            <div className="p-2.5 rounded bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
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
                  handleFile(e.target.files[0]);
                }
              }}
            />

            {file ? (
              <div className="flex flex-col items-center">
                <div className="p-2.5 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 mb-2">
                  <FileText className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 max-w-[280px] truncate">
                  {file.name}
                </p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {formatFileSize(file.size)} &bull; Click or drop another file to replace
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="p-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 mb-2">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
                  Click to select or drag &amp; drop syllabus PDF
                </p>
                <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                  Supports PDF files up to 25 MB
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
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
              disabled={!file || isUploading}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-md bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-white transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isReplacing ? 'Update Syllabus' : 'Save Syllabus'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
