import React, { useState, useEffect, useRef } from 'react';
import type { SearchResultItem } from '../types';
import { supabase } from '../lib/supabase';
import { Search, X, BookOpen, Layers, FileText, ChevronRight, Loader2 } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (result: SearchResultItem) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Debounced search against database
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(() => {
      executeSearch(query.trim());
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const executeSearch = async (searchTerm: string) => {
    setIsSearching(true);
    const searchFilter = `%${searchTerm}%`;

    try {
      const items: SearchResultItem[] = [];

      // 1. Search Subjects (name, subject_code)
      const { data: matchedSubjects, error: subErr } = await supabase
        .from('subjects')
        .select('id, name, subject_code')
        .or(`name.ilike.${searchFilter},subject_code.ilike.${searchFilter}`)
        .limit(6);

      if (!subErr && matchedSubjects) {
        matchedSubjects.forEach((s) => {
          items.push({
            id: s.id,
            type: 'subject',
            title: s.name,
            subtitle: s.subject_code ? `Code: ${s.subject_code}` : 'Subject',
            subjectId: s.id,
          });
        });
      }

      // 2. Search Chapters (name, summary) with parent subject details
      const { data: matchedChapters, error: chErr } = await supabase
        .from('chapters')
        .select('id, name, chapter_number, summary, subject_id, subjects(id, name, subject_code)')
        .or(`name.ilike.${searchFilter},summary.ilike.${searchFilter}`)
        .limit(8);

      if (!chErr && matchedChapters) {
        matchedChapters.forEach((ch: any) => {
          const sub = ch.subjects;
          const subTitle = sub ? (sub.subject_code ? `${sub.subject_code} - ${sub.name}` : sub.name) : 'Subject';
          let snippet = undefined;
          if (ch.summary && ch.summary.toLowerCase().includes(searchTerm.toLowerCase())) {
            snippet = extractSnippet(ch.summary, searchTerm);
          }

          items.push({
            id: ch.id,
            type: 'chapter',
            title: ch.name,
            subtitle: `${subTitle} ${ch.chapter_number ? `• ${ch.chapter_number}` : ''}`,
            subjectId: ch.subject_id,
            chapterId: ch.id,
            snippet,
            matchField: snippet ? 'Summary' : undefined,
          });
        });
      }

      // 3. Search Topics (name, question, answer) with parent chapter and subject
      const { data: matchedTopics, error: topErr } = await supabase
        .from('topics')
        .select(`
          id, 
          name, 
          question, 
          answer, 
          chapter_id,
          chapters(
            id,
            name,
            chapter_number,
            subject_id,
            subjects(id, name, subject_code)
          )
        `)
        .or(`name.ilike.${searchFilter},question.ilike.${searchFilter},answer.ilike.${searchFilter}`)
        .limit(12);

      if (!topErr && matchedTopics) {
        matchedTopics.forEach((t: any) => {
          const ch = t.chapters;
          const sub = ch?.subjects;
          const breadcrumb = `${sub?.name || 'Subject'} > ${ch?.name || 'Chapter'}`;

          let snippet = undefined;
          let matchField = undefined;

          // Check if question matched
          if (t.question && t.question.toLowerCase().includes(searchTerm.toLowerCase())) {
            snippet = extractSnippet(t.question, searchTerm);
            matchField = 'Exam Question';
          } else if (t.answer && t.answer.toLowerCase().includes(searchTerm.toLowerCase())) {
            // Strip HTML for clean snippet
            const plainAnswer = t.answer.replace(/<[^>]+>/g, ' ');
            snippet = extractSnippet(plainAnswer, searchTerm);
            matchField = 'Answer Text';
          }

          items.push({
            id: t.id,
            type: 'topic',
            title: t.name,
            subtitle: breadcrumb,
            subjectId: ch?.subject_id,
            chapterId: t.chapter_id,
            topicId: t.id,
            snippet,
            matchField,
          });
        });
      }

      setResults(items);
      setSelectedIndex(0);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const extractSnippet = (text: string, term: string) => {
    const lowerText = text.toLowerCase();
    const lowerTerm = term.toLowerCase();
    const index = lowerText.indexOf(lowerTerm);
    if (index === -1) return text.slice(0, 80) + '...';

    const start = Math.max(0, index - 35);
    const end = Math.min(text.length, index + term.length + 45);
    return (start > 0 ? '...' : '') + text.slice(start, end) + (end < text.length ? '...' : '');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      if (results[selectedIndex]) {
        onNavigate(results[selectedIndex]);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-black/50 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
          <Search className="w-5 h-5 text-neutral-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search subjects, chapters, topics, exam questions, or answers..."
            className="w-full text-sm bg-transparent text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none"
          />
          {isSearching ? (
            <Loader2 className="w-4 h-4 text-neutral-400 animate-spin ml-2 shrink-0" />
          ) : query ? (
            <button
              onClick={() => setQuery('')}
              className="text-neutral-400 hover:text-neutral-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline font-mono text-[10px] text-neutral-400 border border-neutral-200 dark:border-neutral-700 px-1.5 py-0.5 rounded">
              ESC
            </kbd>
          )}
        </div>

        {/* Results Body */}
        <div className="overflow-y-auto p-2 divide-y divide-neutral-100 dark:divide-neutral-800">
          {!query.trim() ? (
            <div className="py-12 text-center text-xs text-neutral-400">
              Type keywords to search across your whole academic notebook.
            </div>
          ) : results.length === 0 && !isSearching ? (
            <div className="py-12 text-center text-xs text-neutral-400">
              No results found for &quot;{query}&quot;.
            </div>
          ) : (
            results.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={`${item.type}-${item.id}`}
                  onClick={() => {
                    onNavigate(item);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3 rounded-md transition-colors cursor-pointer flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'bg-neutral-100 dark:bg-neutral-800'
                      : 'hover:bg-neutral-50 dark:hover:bg-neutral-850'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="p-1.5 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 shrink-0 mt-0.5">
                      {item.type === 'subject' && <BookOpen className="w-3.5 h-3.5" />}
                      {item.type === 'chapter' && <Layers className="w-3.5 h-3.5" />}
                      {item.type === 'topic' && <FileText className="w-3.5 h-3.5" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                          {item.title}
                        </span>
                        <span className="text-[10px] uppercase font-mono font-medium px-1.5 py-0.2 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
                          {item.type}
                        </span>
                      </div>

                      {item.subtitle && (
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                          {item.subtitle}
                        </p>
                      )}

                      {item.snippet && (
                        <p className="text-[11px] text-neutral-600 dark:text-neutral-300 italic bg-neutral-50 dark:bg-neutral-800/60 p-1.5 rounded mt-1.5 border border-neutral-200/60 dark:border-neutral-700/60">
                          {item.matchField && (
                            <span className="font-semibold not-italic mr-1 text-neutral-500">
                              [{item.matchField}]:
                            </span>
                          )}
                          &ldquo;{item.snippet}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0 mt-1" />
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-400 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>&uarr;&darr; Navigate</span>
            <span>&crarr; Select</span>
            <span>ESC Close</span>
          </div>
          <span>{results.length} results</span>
        </div>
      </div>
    </div>
  );
};
