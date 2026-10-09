import React, { useEffect } from 'react';
import { X, ExternalLink, Download, FileText, Trash2 } from 'lucide-react';

interface PdfViewerModalProps {
  isOpen: boolean;
  title: string;
  pdfUrl: string;
  fileName?: string;
  onClose: () => void;
  onDelete?: () => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  isOpen,
  title,
  pdfUrl,
  fileName,
  onClose,
  onDelete,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !pdfUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl h-[92vh] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* PDF Viewer Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-neutral-50 dark:bg-neutral-850 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
          <div className="flex items-center gap-2 min-w-0 pr-3">
            <div className="p-1.5 rounded bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate" title={title}>
                {title}
              </h3>
              {fileName && (
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                  {fileName}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Open in new tab */}
            <a
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-750 transition-colors"
              title="Open PDF in new browser tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Download PDF */}
            <a
              href={pdfUrl}
              download={fileName || title}
              className="p-1.5 rounded text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-750 transition-colors"
              title="Download PDF"
            >
              <Download className="w-4 h-4" />
            </a>

            {/* Optional Delete action */}
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="p-1.5 rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                title="Remove this document"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <div className="w-[1px] h-4 bg-neutral-300 dark:bg-neutral-700 mx-1" />

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-750 transition-colors"
              title="Close viewer (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Viewer Body */}
        <div className="flex-1 w-full h-full bg-neutral-100 dark:bg-neutral-950 relative overflow-hidden">
          <iframe
            src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1`}
            title={title}
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </div>
  );
};
