import React, { useState, useEffect, useRef } from 'react';
import type { Chapter, ChapterResource } from '../types';
import { supabase, uploadChapterFile, deleteChapterFile, getFileViewUrl } from '../lib/supabase';
import {
  Upload,
  Download,
  ExternalLink,
  Edit2,
  Trash2,
  Check,
  X,
  FileIcon,
  Maximize2,
  Info,
  Loader2,
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface ChapterOverallInfoProps {
  chapter: Chapter;
  onUpdateSummary: (newSummary: string) => Promise<void>;
  userId: string;
}

export const ChapterOverallInfo: React.FC<ChapterOverallInfoProps> = ({
  chapter,
  onUpdateSummary,
  userId,
}) => {
  // Summary state
  const [summary, setSummary] = useState(chapter.summary || '');
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [isSavingSummary, setIsSavingSummary] = useState(false);

  // Resources state
  const [resources, setResources] = useState<ChapterResource[]>([]);
  const [isLoadingResources, setIsLoadingResources] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'image' | 'pdf'>('all');

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceDesc, setResourceDesc] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit resource modal
  const [editingResource, setEditingResource] = useState<ChapterResource | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  // Delete resource confirmation
  const [deletingResource, setDeletingResource] = useState<ChapterResource | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Image lightbox preview modal
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // Sync summary with prop
  useEffect(() => {
    setSummary(chapter.summary || '');
  }, [chapter.summary]);

  // Load resources for this chapter
  useEffect(() => {
    fetchResources();
  }, [chapter.id]);

  const fetchResources = async () => {
    setIsLoadingResources(true);
    try {
      const { data, error } = await supabase
        .from('chapter_resources')
        .select('*')
        .eq('chapter_id', chapter.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch chapter resources:', error);
      } else if (data) {
        const loadedWithUrls: ChapterResource[] = data.map((res) => ({
          ...res,
          public_url: getFileViewUrl(res.storage_path),
        }));
        setResources(loadedWithUrls);
      }
    } finally {
      setIsLoadingResources(false);
    }
  };

  const handleSaveSummary = async () => {
    setIsSavingSummary(true);
    try {
      await onUpdateSummary(summary);
      setIsEditingSummary(false);
    } catch (err) {
      console.error('Failed to save summary:', err);
    } finally {
      setIsSavingSummary(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    // Suggest clean title from file name
    const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    setResourceTitle(cleanName);
    setUploadError(null);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !resourceTitle.trim()) {
      setUploadError('Please select a file and provide a title.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // 1. Upload to Supabase Storage
      const { path, publicUrl } = await uploadChapterFile(userId, chapter.id, selectedFile);

      // Determine resource type
      const isImg = selectedFile.type.startsWith('image/');
      const isPdf = selectedFile.type === 'application/pdf';
      const resourceType: 'image' | 'pdf' | 'document' = isImg ? 'image' : isPdf ? 'pdf' : 'document';

      // 2. Insert metadata into chapter_resources table
      const { data, error: dbError } = await supabase
        .from('chapter_resources')
        .insert({
          chapter_id: chapter.id,
          user_id: userId,
          title: resourceTitle.trim(),
          description: resourceDesc.trim() || null,
          resource_type: resourceType,
          storage_path: path,
          file_name: selectedFile.name,
          file_size: selectedFile.size,
          mime_type: selectedFile.type,
        })
        .select()
        .single();

      if (dbError) {
        throw dbError;
      }

      // 3. Update state
      if (data) {
        setResources((prev) => [{ ...data, public_url: publicUrl }, ...prev]);
      }

      // Reset form
      setSelectedFile(null);
      setResourceTitle('');
      setResourceDesc('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      setUploadError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenEdit = (res: ChapterResource) => {
    setEditingResource(res);
    setEditTitle(res.title);
    setEditDesc(res.description || '');
  };

  const handleSaveEdit = async () => {
    if (!editingResource) return;
    try {
      const { error } = await supabase
        .from('chapter_resources')
        .update({
          title: editTitle.trim(),
          description: editDesc.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingResource.id);

      if (error) throw error;

      setResources((prev) =>
        prev.map((r) =>
          r.id === editingResource.id
            ? { ...r, title: editTitle.trim(), description: editDesc.trim() || null }
            : r
        )
      );
      setEditingResource(null);
    } catch (err) {
      console.error('Failed to update resource:', err);
    }
  };

  const handleDeleteResource = async () => {
    if (!deletingResource) return;
    setIsDeleting(true);

    try {
      // 1. Delete from storage
      await deleteChapterFile(deletingResource.storage_path);

      // 2. Delete from DB
      const { error } = await supabase
        .from('chapter_resources')
        .delete()
        .eq('id', deletingResource.id);

      if (error) throw error;

      setResources((prev) => prev.filter((r) => r.id !== deletingResource.id));
      setDeletingResource(null);
    } catch (err) {
      console.error('Failed to delete resource:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredResources = resources.filter((res) => {
    if (filterType === 'all') return true;
    if (filterType === 'image') return res.resource_type === 'image';
    if (filterType === 'pdf') return res.resource_type === 'pdf' || res.resource_type === 'document';
    return true;
  });

  return (
    <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-5 bg-neutral-50/50 dark:bg-neutral-900/40 mb-8 space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            Overall Information &amp; Revision Material
          </h2>
        </div>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          Chapter Overview &bull; Handwritten Notes &bull; Cheat Sheets
        </span>
      </div>

      {/* 1. Chapter Written Summary */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-md p-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Chapter Summary &amp; Key Highlights
          </label>
          {!isEditingSummary ? (
            <button
              onClick={() => setIsEditingSummary(true)}
              className="text-xs flex items-center gap-1 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 font-medium"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Summary</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSummary(chapter.summary || '');
                  setIsEditingSummary(false);
                }}
                disabled={isSavingSummary}
                className="text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSummary}
                disabled={isSavingSummary}
                className="text-xs flex items-center gap-1 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-2.5 py-1 rounded font-medium disabled:opacity-50"
              >
                {isSavingSummary ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Check className="w-3 h-3" />
                )}
                <span>Save</span>
              </button>
            </div>
          )}
        </div>

        {isEditingSummary ? (
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={4}
            placeholder="Write a concise chapter summary, key formulas, exam priorities, or concepts to remember..."
            className="w-full text-sm p-3 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-400 leading-relaxed font-sans"
          />
        ) : summary.trim() ? (
          <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed">
            {summary}
          </p>
        ) : (
          <p className="text-sm text-neutral-400 dark:text-neutral-500 italic">
            No summary written yet. Click &quot;Edit Summary&quot; to write a concise chapter overview.
          </p>
        )}
      </div>

      {/* 2. Upload Form */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-md p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3 flex items-center gap-1.5">
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Study Materials (Notes / Cheat Sheets / Diagrams)</span>
        </h3>

        {uploadError && (
          <div className="mb-3 p-2.5 text-xs rounded border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300">
            {uploadError}
          </div>
        )}

        <form onSubmit={handleUploadSubmit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* File input */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Select File (JPG, PNG, WebP, PDF)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleFileChange}
                disabled={isUploading}
                className="w-full text-xs text-neutral-600 dark:text-neutral-400 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border file:border-neutral-300 dark:file:border-neutral-700 file:text-xs file:font-medium file:bg-neutral-100 dark:file:bg-neutral-800 file:text-neutral-800 dark:file:text-neutral-200 hover:file:bg-neutral-200 cursor-pointer"
              />
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Resource Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={resourceTitle}
                onChange={(e) => setResourceTitle(e.target.value)}
                placeholder="e.g. Unit Formula Sheet, Handwritten Notes"
                disabled={isUploading}
                className="w-full text-xs px-3 py-2 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-400"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Optional Description
              </label>
              <input
                type="text"
                value={resourceDesc}
                onChange={(e) => setResourceDesc(e.target.value)}
                placeholder="e.g. Pages 1-5, Important diagrams"
                disabled={isUploading}
                className="w-full text-xs px-3 py-2 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-400"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isUploading || !selectedFile || !resourceTitle.trim()}
              className="text-xs flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 px-3.5 py-2 rounded font-medium disabled:opacity-40 transition-colors cursor-pointer"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Uploading to Storage...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Resource</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 3. Uploaded Materials List / Gallery */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Attached Revision Files ({resources.length})
            </h3>
          </div>

          {/* Filter tabs */}
          {resources.length > 0 && (
            <div className="flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded border ${
                  filterType === 'all'
                    ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900 font-medium'
                    : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                All ({resources.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('image')}
                className={`px-2.5 py-1 rounded border ${
                  filterType === 'image'
                    ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900 font-medium'
                    : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                Images ({resources.filter((r) => r.resource_type === 'image').length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('pdf')}
                className={`px-2.5 py-1 rounded border ${
                  filterType === 'pdf'
                    ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900 font-medium'
                    : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                PDFs ({resources.filter((r) => r.resource_type !== 'image').length})
              </button>
            </div>
          )}
        </div>

        {isLoadingResources ? (
          <div className="text-center py-6 text-xs text-neutral-400">
            <Loader2 className="w-4 h-4 animate-spin inline mr-1.5" />
            Loading chapter materials...
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="text-center py-6 bg-white dark:bg-neutral-900 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-md text-neutral-400 text-xs">
            No revision materials uploaded yet. Use the upload box above to store handwritten notes, formulas, or PDF cheat sheets.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredResources.map((res) => {
              const isImage = res.resource_type === 'image';
              return (
                <div
                  key={res.id}
                  className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-md overflow-hidden flex flex-col justify-between group"
                >
                  {/* Preview Area */}
                  {isImage ? (
                    <div
                      className="relative h-36 bg-neutral-100 dark:bg-neutral-800 overflow-hidden cursor-pointer"
                      onClick={() =>
                        setPreviewImage({
                          url: res.public_url || '',
                          title: res.title,
                        })
                      }
                      title="Click to expand full size"
                    >
                      <img
                        src={res.public_url}
                        alt={res.title}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                        <span className="opacity-0 group-hover:opacity-100 bg-black/75 text-white text-[11px] px-2 py-1 rounded flex items-center gap-1 transition-opacity">
                          <Maximize2 className="w-3 h-3" />
                          <span>Preview</span>
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-28 bg-neutral-100 dark:bg-neutral-800 flex flex-col items-center justify-center p-3 text-center border-b border-neutral-200 dark:border-neutral-800">
                      <FileIcon className="w-8 h-8 text-neutral-400 mb-1" />
                      <span className="text-[11px] font-mono text-neutral-500 uppercase">
                        {res.file_name?.split('.').pop() || 'PDF Document'}
                      </span>
                      {res.file_size && (
                        <span className="text-[10px] text-neutral-400">
                          {formatFileSize(res.file_size)}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Metadata and Actions */}
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate" title={res.title}>
                          {res.title}
                        </h4>
                        {res.description && (
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-0.5" title={res.description}>
                            {res.description}
                          </p>
                        )}
                        <span className="inline-block text-[10px] text-neutral-400 mt-1">
                          {new Date(res.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-neutral-600 dark:text-neutral-400 text-xs">
                      <div className="flex items-center gap-2">
                        {/* Open in new tab */}
                        <a
                          href={res.public_url}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-neutral-900 dark:hover:text-neutral-100 p-1"
                          title="Open in new tab"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>

                        {/* Download link */}
                        <a
                          href={res.public_url}
                          download={res.file_name || res.title}
                          className="hover:text-neutral-900 dark:hover:text-neutral-100 p-1"
                          title="Download file"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Edit metadata */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(res)}
                          className="hover:text-neutral-900 dark:hover:text-neutral-100 p-1"
                          title="Edit title &amp; description"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => setDeletingResource(res)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Delete material"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Resource Modal */}
      {editingResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="relative w-full max-w-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
              Edit Resource Details
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingResource(null)}
                className="text-xs px-3 py-1.5 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="text-xs px-3 py-1.5 rounded bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-medium"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-neutral-300 p-1 cursor-pointer"
              title="Close image"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={previewImage.url}
              alt={previewImage.title}
              className="max-h-[80vh] max-w-full rounded object-contain border border-neutral-700 shadow-2xl"
            />
            <div className="mt-2 text-center text-sm font-medium text-white">
              {previewImage.title}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={Boolean(deletingResource)}
        title="Delete Resource?"
        message={`Are you sure you want to delete "${deletingResource?.title}"? The file will be removed permanently from storage.`}
        isLoading={isDeleting}
        onConfirm={handleDeleteResource}
        onCancel={() => setDeletingResource(null)}
      />
    </div>
  );
};
