import React, { useState } from 'react';
import type { Subject } from '../types';
import {
  Plus,
  BookOpen,
  Search,
  ChevronRight,
  MoreVertical,
  Edit2,
  Trash2,
  Layers,
} from 'lucide-react';
import { SubjectModal } from './SubjectModal';
import { ConfirmModal } from './ConfirmModal';

interface SubjectsListProps {
  subjects: Subject[];
  onOpenSubject: (subjectId: string) => void;
  onCreateSubject: (data: { name: string; subject_code?: string }) => Promise<void>;
  onUpdateSubject: (id: string, data: { name: string; subject_code?: string }) => Promise<void>;
  onDeleteSubject: (id: string) => Promise<void>;
  onOpenGlobalSearch: () => void;
}

export const SubjectsList: React.FC<SubjectsListProps> = ({
  subjects,
  onOpenSubject,
  onCreateSubject,
  onUpdateSubject,
  onDeleteSubject,
  onOpenGlobalSearch,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [deletingSubject, setDeletingSubject] = useState<Subject | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const filteredSubjects = subjects.filter((s) => {
    const q = filterQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      (s.subject_code && s.subject_code.toLowerCase().includes(q))
    );
  });

  const handleDelete = async () => {
    if (!deletingSubject) return;
    setIsDeleting(true);
    try {
      await onDeleteSubject(deletingSubject.id);
      setDeletingSubject(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Academic Syllabus
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Manage your course subjects, chapter structures, and exam answers
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Search Trigger */}
          <button
            type="button"
            onClick={onOpenGlobalSearch}
            className="flex items-center gap-2 px-3 py-2 rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-850 text-neutral-500 dark:text-neutral-400 text-xs transition-colors cursor-pointer"
            title="Global Search (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Search syllabus...</span>
            <kbd className="hidden sm:inline font-mono text-[10px] bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-1 rounded">
              Ctrl+K
            </kbd>
          </button>

          {/* Add Subject */}
          <button
            type="button"
            onClick={() => setIsAddingSubject(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-white text-xs font-medium transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Subject</span>
          </button>
        </div>
      </div>

      {/* Local Filter input (if multiple subjects exist) */}
      {subjects.length > 4 && (
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter subjects by name or code..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-400"
          />
        </div>
      )}

      {/* Subjects Grid */}
      {subjects.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-neutral-900 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg p-6">
          <BookOpen className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            No subjects created yet
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
            Start organizing your academic curriculum by creating your first subject. You can add chapters, exam questions, and revision notes inside.
          </p>
          <button
            type="button"
            onClick={() => setIsAddingSubject(true)}
            className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-md hover:bg-neutral-800 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Subject</span>
          </button>
        </div>
      ) : filteredSubjects.length === 0 ? (
        <div className="py-12 text-center text-xs text-neutral-400">
          No subjects match &quot;{filterQuery}&quot;.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubjects.map((s) => (
            <div
              key={s.id}
              onClick={() => onOpenSubject(s.id)}
              className="group relative p-5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-400 dark:hover:border-neutral-600 transition-all flex flex-col justify-between cursor-pointer shadow-2xs hover:shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  {s.subject_code ? (
                    <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                      {s.subject_code}
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono text-neutral-400">
                      Subject
                    </span>
                  )}

                  {/* Actions Dropdown Toggle */}
                  <div
                    className="relative"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveMenuId(activeMenuId === s.id ? null : s.id)}
                      className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                      title="Subject options"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {activeMenuId === s.id && (
                      <div className="absolute right-0 top-6 z-20 w-32 bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-750 rounded-md shadow-lg py-1 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null);
                            setEditingSubject(s);
                          }}
                          className="w-full px-3 py-1.5 text-left text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1.5"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null);
                            setDeletingSubject(s);
                          }}
                          className="w-full px-3 py-1.5 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-neutral-950 dark:group-hover:text-white line-clamp-2">
                  {s.name}
                </h3>
              </div>

              <div className="mt-6 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{s.chapter_count ?? 0} {s.chapter_count === 1 ? 'Chapter' : 'Chapters'}</span>
                </span>

                <div className="flex items-center gap-1 text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-neutral-100 font-medium">
                  <span>Open</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Subject Modal */}
      <SubjectModal
        isOpen={isAddingSubject}
        onSave={async (data) => {
          await onCreateSubject(data);
          setIsAddingSubject(false);
        }}
        onClose={() => setIsAddingSubject(false)}
      />

      {/* Edit Subject Modal */}
      <SubjectModal
        isOpen={Boolean(editingSubject)}
        subject={editingSubject}
        onSave={async (data) => {
          if (editingSubject) {
            await onUpdateSubject(editingSubject.id, data);
            setEditingSubject(null);
          }
        }}
        onClose={() => setEditingSubject(null)}
      />

      {/* Delete Subject Confirm Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingSubject)}
        title="Delete Subject?"
        message={`Are you sure you want to delete "${deletingSubject?.name}"? All chapters, topics, and revision materials within it will be permanently deleted.`}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeletingSubject(null)}
      />
    </div>
  );
};
