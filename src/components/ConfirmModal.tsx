import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Delete',
  isDestructive = true,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-lg p-6">
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-3">
          {isDestructive && (
            <div className="p-2 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
          )}
          <div>
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              {title}
            </h3>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md border border-neutral-300 dark:border-neutral-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800'
                : 'bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white'
            } disabled:opacity-50`}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
