import React, { useState, useEffect, useMemo } from 'react';
import type { Subject, SubjectResource } from '../types';
import { supabase, uploadSubjectResource, deleteStorageFile, getFileViewUrl } from '../lib/supabase';
import {
  FileText,
  Plus,
  Download,
  Trash2,
  Eye,
  Calendar,
  Search,
  Loader2,
  BookOpen,
} from 'lucide-react';
import { AddPYQModal } from './AddPYQModal';
import { PdfViewerModal } from './PdfViewerModal';
import { ConfirmModal } from './ConfirmModal';

interface SubjectPYQSectionProps {
  subject: Subject;
  userId: string;
}

export const SubjectPYQSection: React.FC<SubjectPYQSectionProps> = ({
  subject,
  userId,
}) => {
  const [resources, setResources] = useState<SubjectResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | SubjectResource['category']>('all');

  // Add Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // In-App Viewer Modal
  const [activeViewerResource, setActiveViewerResource] = useState<SubjectResource | null>(null);

  // Delete Confirm
  const [deletingResource, setDeletingResource] = useState<SubjectResource | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchResources = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('subject_resources')
        .select('*')
        .eq('subject_id', subject.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load subject resources:', error);
      } else if (data) {
        const loaded: SubjectResource[] = data.map((item) => ({
          ...item,
          public_url: getFileViewUrl(item.storage_path),
        }));
        setResources(loaded);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [subject.id]);

  const handleUpload = async (data: {
    file: File;
    title: string;
    year_session?: string;
    category: SubjectResource['category'];
    description?: string;
  }) => {
    // 1. Upload to storage
    const { path, publicUrl } = await uploadSubjectResource(userId, subject.id, data.file);

    // 2. Insert into DB
    const { data: dbData, error: dbError } = await supabase
      .from('subject_resources')
      .insert({
        subject_id: subject.id,
        user_id: userId,
        title: data.title,
        description: data.description || null,
        category: data.category,
        year_session: data.year_session || null,
        storage_path: path,
        file_name: data.file.name,
        file_size: data.file.size,
        mime_type: data.file.type,
      })
      .select()
      .single();

    if (dbError) {
      // rollback storage upload on DB error
      await deleteStorageFile(path);
      throw dbError;
    }

    if (dbData) {
      const newResource: SubjectResource = {
        ...dbData,
        public_url: publicUrl,
      };
      setResources((prev) => [newResource, ...prev]);
    }
  };

  const handleDelete = async () => {
    if (!deletingResource) return;
    setIsDeleting(true);
    try {
      // 1. Delete from DB
      const { error: dbError } = await supabase
        .from('subject_resources')
        .delete()
        .eq('id', deletingResource.id);

      if (dbError) throw dbError;

      // 2. Delete from Storage
      await deleteStorageFile(deletingResource.storage_path);

      // 3. Update local state
      setResources((prev) => prev.filter((r) => r.id !== deletingResource.id));
      if (activeViewerResource?.id === deletingResource.id) {
        setActiveViewerResource(null);
      }
    } catch (err) {
      console.error('Failed to delete resource:', err);
    } finally {
      setIsDeleting(false);
      setDeletingResource(null);
    }
  };

  const filteredResources = useMemo(() => {
    return resources.filter((res) => {
      const matchesSearch =
        !searchQuery.trim() ||
        res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (res.year_session && res.year_session.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (res.description && res.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat = selectedCategory === 'all' || res.category === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [resources, searchQuery, selectedCategory]);

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getCategoryBadge = (cat: SubjectResource['category']) => {
    switch (cat) {
      case 'pyq':
        return {
          label: 'Question Paper',
          className: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/40',
        };
      case 'model_answer':
        return {
          label: 'Model Answer',
          className: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40',
        };
      case 'notes':
        return {
          label: 'Question Bank',
          className: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/40',
        };
      default:
        return {
          label: 'Reference Paper',
          className: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700',
        };
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-3">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <span>Previous Year Papers &amp; PYQs</span>
            <span className="text-xs font-normal text-neutral-500 dark:text-neutral-400">
              ({resources.length})
            </span>
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Exam question papers and model answers for {subject.name}. Click any paper to view inside the app.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-white text-xs font-medium transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add PYQ / Paper</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      {resources.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-850 p-1 rounded-md text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-white dark:bg-neutral-750 font-medium text-neutral-900 dark:text-neutral-100 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              All ({resources.length})
            </button>
            <button
              onClick={() => setSelectedCategory('pyq')}
              className={`px-2.5 py-1 rounded transition-colors ${
                selectedCategory === 'pyq'
                  ? 'bg-white dark:bg-neutral-750 font-medium text-neutral-900 dark:text-neutral-100 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              Question Papers
            </button>
            <button
              onClick={() => setSelectedCategory('model_answer')}
              className={`px-2.5 py-1 rounded transition-colors ${
                selectedCategory === 'model_answer'
                  ? 'bg-white dark:bg-neutral-750 font-medium text-neutral-900 dark:text-neutral-100 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              Model Answers
            </button>
            <button
              onClick={() => setSelectedCategory('notes')}
              className={`px-2.5 py-1 rounded transition-colors ${
                selectedCategory === 'notes'
                  ? 'bg-white dark:bg-neutral-750 font-medium text-neutral-900 dark:text-neutral-100 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              Question Banks
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by session or name..."
              className="w-full pl-8 pr-3 py-1 text-xs rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400"
            />
          </div>
        </div>
      )}

      {/* PYQ Papers Grid / Layout */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-neutral-400">
          <Loader2 className="w-4 h-4 animate-spin inline mr-1.5" />
          Loading previous year papers...
        </div>
      ) : resources.length === 0 ? (
        /* Empty State */
        <div className="py-12 text-center bg-white dark:bg-neutral-900 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg p-6">
          <BookOpen className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            No Previous Year Question Papers Added
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
            Upload past exam papers, MSBTE model answer copies, and question banks to prepare thoroughly for exams.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-md hover:bg-neutral-800 dark:hover:bg-white cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add First PYQ / Paper</span>
          </button>
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="py-8 text-center text-xs text-neutral-400">
          No papers match your search or filter criteria.
        </div>
      ) : (
        /* Grid of Papers */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredResources.map((item) => {
            const badge = getCategoryBadge(item.category);
            return (
              <div
                key={item.id}
                className="group bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 rounded-lg p-4 transition-all shadow-xs flex flex-col justify-between"
              >
                <div>
                  {/* Top Tags */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${badge.className}`}
                    >
                      {badge.label}
                    </span>

                    {item.year_session ? (
                      <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-neutral-400" />
                        {item.year_session}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-neutral-400">PDF</span>
                    )}
                  </div>

                  {/* Title & Document Icon */}
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 rounded bg-red-100/80 dark:bg-red-950/40 text-red-700 dark:text-red-400 shrink-0 mt-0.5">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3
                        onClick={() => setActiveViewerResource(item)}
                        className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 hover:underline cursor-pointer line-clamp-2"
                        title={item.title}
                      >
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-850 flex items-center justify-between text-[11px] text-neutral-400 dark:text-neutral-500">
                    <span>{formatFileSize(item.file_size)}</span>
                    <span>
                      {new Date(item.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-850 flex items-center justify-between gap-2">
                  {/* View in App Button (Primary) */}
                  <button
                    type="button"
                    onClick={() => setActiveViewerResource(item)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded text-xs font-medium bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-white transition-colors cursor-pointer"
                    title="View paper directly in app"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View in App</span>
                  </button>

                  {/* Download */}
                  {item.public_url && (
                    <a
                      href={item.public_url}
                      download={item.file_name || item.title}
                      className="p-1.5 rounded border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                      title="Download PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  )}

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => setDeletingResource(item)}
                    className="p-1.5 rounded border border-neutral-200 dark:border-neutral-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                    title="Delete this paper"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add PYQ Modal */}
      <AddPYQModal
        isOpen={isAddModalOpen}
        subjectName={subject.name}
        onUpload={handleUpload}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* In-App PDF Viewer Modal */}
      {activeViewerResource && (
        <PdfViewerModal
          isOpen={Boolean(activeViewerResource)}
          title={`${activeViewerResource.title}${
            activeViewerResource.year_session ? ` (${activeViewerResource.year_session})` : ''
          }`}
          fileName={activeViewerResource.file_name || undefined}
          pdfUrl={activeViewerResource.public_url || ''}
          onClose={() => setActiveViewerResource(null)}
          onDelete={() => {
            const res = activeViewerResource;
            setActiveViewerResource(null);
            setDeletingResource(res);
          }}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={Boolean(deletingResource)}
        title="Delete Question Paper?"
        message={`Are you sure you want to delete "${deletingResource?.title}"? The PDF file will be permanently removed.`}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeletingResource(null)}
      />
    </div>
  );
};
