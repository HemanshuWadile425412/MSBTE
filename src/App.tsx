import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './context/useAuth';

import { supabase } from './lib/supabase';
import type { Subject, Chapter, Topic, ViewMode, SearchResultItem } from './types';
import { AuthScreen } from './components/AuthScreen';
import { Navbar } from './components/Navbar';
import { SubjectsList } from './components/SubjectsList';
import { SubjectDetail } from './components/SubjectDetail';
import { ChapterDetail } from './components/ChapterDetail';
import { TopicDetail } from './components/TopicDetail';
import { SearchModal } from './components/SearchModal';
import PredictedResult from './components/PredictedResult';
import { ChapterProgressView } from './components/ChapterProgressView';
import { Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  const { user, loading: authLoading } = useAuth();

  // Navigation State
  const [view, setView] = useState<ViewMode>({ type: 'subjects' });

  // Unified In-Memory Academic Store (Zero-Stutter)
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(true);

  // Search Modal state
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Notification Toast
  const [bannerMessage, setBannerMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setBannerMessage({ text, type });
    setTimeout(() => {
      setBannerMessage((prev) => (prev?.text === text ? null : prev));
    }, 3000);
  };

  // Keyboard shortcut listener for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 1. Single, Smooth Workspace Loader (Runs once on login, keeps everything instantly reactive)
  const loadWorkspace = useCallback(async () => {
    if (!user) return;
    try {
      const [subsRes, chsRes, topsRes] = await Promise.all([
        supabase.from('subjects').select('*').order('position', { ascending: true }),
        supabase.from('chapters').select('*').order('position', { ascending: true }),
        supabase.from('topics').select('*').order('position', { ascending: true }),
      ]);

      if (subsRes.error) throw subsRes.error;
      if (chsRes.error) throw chsRes.error;
      if (topsRes.error) throw topsRes.error;

      setSubjects(subsRes.data || []);
      setChapters(chsRes.data || []);
      setTopics(topsRes.data || []);
    } catch (err) {
      console.error('Workspace load error:', err);
      showToast('Could not load notebook data. Please check your connection.', 'error');
    } finally {
      setIsWorkspaceLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadWorkspace();
    } else {
      setIsWorkspaceLoading(false);
    }
  }, [user, loadWorkspace]);

  // 2. Synchronous, Zero-Delay Derived State
  const enrichedSubjects = useMemo(() => {
    return subjects.map((s) => ({
      ...s,
      chapter_count: chapters.filter((c) => c.subject_id === s.id).length,
    }));
  }, [subjects, chapters]);

  const selectedSubject = useMemo(() => {
    if (view.type === 'subjects' || view.type === 'predicted-result' || view.type === 'progress-tracker') return null;
    return enrichedSubjects.find((s) => s.id === view.subjectId) || null;
  }, [enrichedSubjects, view]);

  const currentSubjectChapters = useMemo(() => {
    if (view.type === 'subjects' || view.type === 'predicted-result' || view.type === 'progress-tracker' || !view.subjectId) return [];
    return chapters
      .filter((c) => c.subject_id === view.subjectId)
      .map((c) => ({
        ...c,
        topic_count: topics.filter((t) => t.chapter_id === c.id).length,
      }));
  }, [chapters, topics, view]);

  const selectedChapter = useMemo(() => {
    if (view.type !== 'chapter-detail' && view.type !== 'topic-detail') return null;
    return chapters.find((c) => c.id === view.chapterId) || null;
  }, [chapters, view]);

  const currentChapterTopics = useMemo(() => {
    if (view.type !== 'chapter-detail' && view.type !== 'topic-detail') return [];
    return topics.filter((t) => t.chapter_id === view.chapterId);
  }, [topics, view]);

  const selectedTopic = useMemo(() => {
    if (view.type !== 'topic-detail') return null;
    return topics.find((t) => t.id === view.topicId) || null;
  }, [topics, view]);

  // 3. Browser History Synchronization (Deep links & Back/Forward)
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view');
      const subjectId = params.get('subject');
      const chapterId = params.get('chapter');
      const topicId = params.get('topic');

      if (viewParam === 'predicted-result') {
        setView({ type: 'predicted-result' });
      } else if (viewParam === 'progress-tracker') {
        setView({ type: 'progress-tracker' });
      } else if (topicId && chapterId && subjectId) {
        setView({ type: 'topic-detail', subjectId, chapterId, topicId });
      } else if (chapterId && subjectId) {
        setView({ type: 'chapter-detail', subjectId, chapterId });
      } else if (subjectId) {
        setView({ type: 'subject-detail', subjectId });
      } else {
        setView({ type: 'subjects' });
      }
    };

    window.addEventListener('popstate', handlePopState);
    handlePopState();
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (newView: ViewMode) => {
    setView(newView);
    const url = new URL(window.location.href);
    url.search = '';

    if (newView.type === 'predicted-result') {
      url.searchParams.set('view', 'predicted-result');
    } else if (newView.type === 'progress-tracker') {
      url.searchParams.set('view', 'progress-tracker');
    } else if (newView.type === 'subject-detail') {
      url.searchParams.set('subject', newView.subjectId);
    } else if (newView.type === 'chapter-detail') {
      url.searchParams.set('subject', newView.subjectId);
      url.searchParams.set('chapter', newView.chapterId);
    } else if (newView.type === 'topic-detail') {
      url.searchParams.set('subject', newView.subjectId);
      url.searchParams.set('chapter', newView.chapterId);
      url.searchParams.set('topic', newView.topicId);
    }

    window.history.pushState({}, '', url.toString());
  };

  // --- Instant CRUD Mutations ---
  const handleCreateSubject = async (data: { name: string; subject_code?: string }) => {
    if (!user) return;
    const { data: created, error } = await supabase
      .from('subjects')
      .insert({
        user_id: user.id,
        name: data.name,
        subject_code: data.subject_code || null,
        position: subjects.length,
      })
      .select()
      .single();

    if (error) {
      showToast(error.message, 'error');
      throw error;
    }
    if (created) {
      setSubjects((prev) => [...prev, created]);
      showToast('Subject created');
    }
  };

  const handleUpdateSubject = async (id: string, data: Partial<Subject>) => {
    // Instant local state update
    setSubjects((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...data, updated_at: new Date().toISOString() } : s))
    );

    const { error } = await supabase
      .from('subjects')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      showToast('Failed to save changes to database', 'error');
      loadWorkspace(); // Re-sync
    } else {
      showToast('Subject updated');
    }
  };

  const handleDeleteSubject = async (id: string) => {
    // Instant removal from state
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    setChapters((prev) => prev.filter((c) => c.subject_id !== id));
    navigateTo({ type: 'subjects' });

    const { error } = await supabase.from('subjects').delete().eq('id', id);
    if (error) {
      showToast('Failed to delete subject from database', 'error');
      loadWorkspace();
    } else {
      showToast('Subject deleted');
    }
  };

  // --- Chapter Operations ---
  const handleCreateChapter = async (data: { name: string; chapter_number?: string }) => {
    if (!user || !selectedSubject) return;
    const { data: created, error } = await supabase
      .from('chapters')
      .insert({
        user_id: user.id,
        subject_id: selectedSubject.id,
        name: data.name,
        chapter_number: data.chapter_number || null,
        summary: '',
        position: currentSubjectChapters.length,
      })
      .select()
      .single();

    if (error) {
      showToast(error.message, 'error');
      throw error;
    }
    if (created) {
      setChapters((prev) => [...prev, created]);
      showToast('Chapter added');
    }
  };

  const handleUpdateChapter = async (data: { name: string; chapter_number?: string }) => {
    if (!selectedChapter) return;
    const chapterId = selectedChapter.id;

    // Instant local state update
    setChapters((prev) =>
      prev.map((c) => (c.id === chapterId ? { ...c, ...data, updated_at: new Date().toISOString() } : c))
    );

    const { error } = await supabase
      .from('chapters')
      .update({
        name: data.name,
        chapter_number: data.chapter_number || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', chapterId);

    if (error) {
      showToast('Failed to save chapter', 'error');
      loadWorkspace();
    } else {
      showToast('Chapter updated');
    }
  };

  const handleUpdateChapterSummary = async (newSummary: string) => {
    if (!selectedChapter) return;
    const chapterId = selectedChapter.id;

    // Instant local state update
    setChapters((prev) =>
      prev.map((c) => (c.id === chapterId ? { ...c, summary: newSummary, updated_at: new Date().toISOString() } : c))
    );

    const { error } = await supabase
      .from('chapters')
      .update({
        summary: newSummary,
        updated_at: new Date().toISOString(),
      })
      .eq('id', chapterId);

    if (error) {
      showToast('Failed to save summary', 'error');
      loadWorkspace();
    } else {
      showToast('Summary saved');
    }
  };

  const handleDeleteChapter = async () => {
    if (!selectedChapter || !selectedSubject) return;
    const chapterId = selectedChapter.id;
    const subjectId = selectedSubject.id;

    // Instant local state removal
    setChapters((prev) => prev.filter((c) => c.id !== chapterId));
    setTopics((prev) => prev.filter((t) => t.chapter_id !== chapterId));
    navigateTo({ type: 'subject-detail', subjectId });

    const { error } = await supabase.from('chapters').delete().eq('id', chapterId);
    if (error) {
      showToast('Failed to delete chapter', 'error');
      loadWorkspace();
    } else {
      showToast('Chapter deleted');
    }
  };

  const handleReorderChapters = async (reorderedChapters: Chapter[]) => {
    // Instant update
    const reorderedIds = new Map(reorderedChapters.map((c, idx) => [c.id, idx]));
    setChapters((prev) =>
      prev.map((c) => (reorderedIds.has(c.id) ? { ...c, position: reorderedIds.get(c.id)! } : c))
    );

    try {
      for (const ch of reorderedChapters) {
        await supabase.from('chapters').update({ position: ch.position }).eq('id', ch.id);
      }
      showToast('Chapter order updated');
    } catch {
      showToast('Failed to save order change', 'error');
    }
  };

  // --- Topic Operations ---
  const handleCreateTopic = async (data: { name: string; question: string; answer: string }) => {
    if (!user || !selectedChapter) return;
    const { data: created, error } = await supabase
      .from('topics')
      .insert({
        user_id: user.id,
        chapter_id: selectedChapter.id,
        name: data.name,
        question: data.question,
        answer: data.answer,
        position: currentChapterTopics.length,
      })
      .select()
      .single();

    if (error) {
      showToast(error.message, 'error');
      throw error;
    }
    if (created) {
      setTopics((prev) => [...prev, created]);
      showToast('Topic saved');
    }
  };

  const handleUpdateTopic = async (data: { name: string; question: string; answer: string }) => {
    if (!selectedTopic) return;
    const topicId = selectedTopic.id;

    // Instant local state update
    setTopics((prev) =>
      prev.map((t) => (t.id === topicId ? { ...t, ...data, updated_at: new Date().toISOString() } : t))
    );

    const { error } = await supabase
      .from('topics')
      .update({
        name: data.name,
        question: data.question,
        answer: data.answer,
        updated_at: new Date().toISOString(),
      })
      .eq('id', topicId);

    if (error) {
      showToast('Failed to save topic changes', 'error');
      loadWorkspace();
    } else {
      showToast('Topic updated');
    }
  };

  const handleDeleteTopic = async () => {
    if (!selectedTopic || !selectedChapter || !selectedSubject) return;
    const topicId = selectedTopic.id;
    const subjectId = selectedSubject.id;
    const chapterId = selectedChapter.id;

    // Instant local state removal
    setTopics((prev) => prev.filter((t) => t.id !== topicId));
    navigateTo({ type: 'chapter-detail', subjectId, chapterId });

    const { error } = await supabase.from('topics').delete().eq('id', topicId);
    if (error) {
      showToast('Failed to delete topic', 'error');
      loadWorkspace();
    } else {
      showToast('Topic deleted');
    }
  };

  // --- Search Navigation ---
  const handleSearchResultNavigation = (item: SearchResultItem) => {
    if (item.type === 'subject') {
      navigateTo({ type: 'subject-detail', subjectId: item.subjectId });
    } else if (item.type === 'chapter' && item.chapterId) {
      navigateTo({
        type: 'chapter-detail',
        subjectId: item.subjectId,
        chapterId: item.chapterId,
      });
    } else if (item.type === 'topic' && item.chapterId && item.topicId) {
      navigateTo({
        type: 'topic-detail',
        subjectId: item.subjectId,
        chapterId: item.chapterId,
        topicId: item.topicId,
      });
    }
  };

  // Initial Auth Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
        <div className="flex items-center gap-2 text-sm font-medium text-neutral-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Opening Academic Workspace...</span>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <AuthScreen />;
  }

  // Initial Single Data Load Screen
  if (isWorkspaceLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
        <div className="flex items-center gap-2 text-sm font-medium text-neutral-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading notebook contents...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 antialiased transition-colors">
      {/* Toast Notification Banner */}
      {bannerMessage && (
        <div
          className={`fixed bottom-4 right-4 z-50 px-4 py-2.5 rounded-md text-xs font-medium shadow-lg border transition-all ${
            bannerMessage.type === 'success'
              ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 border-neutral-800 dark:border-neutral-200'
              : 'bg-red-600 text-white border-red-700'
          }`}
        >
          {bannerMessage.text}
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        currentView={view}
        currentSubject={selectedSubject}
        currentChapter={selectedChapter}
        currentTopic={selectedTopic}
        onNavigateHome={() => navigateTo({ type: 'subjects' })}
        onNavigateSubject={(subjectId) => navigateTo({ type: 'subject-detail', subjectId })}
        onNavigateChapter={(subjectId, chapterId) =>
          navigateTo({ type: 'chapter-detail', subjectId, chapterId })
        }
        onNavigatePredictedResult={() => navigateTo({ type: 'predicted-result' })}
        onNavigateProgressTracker={() => navigateTo({ type: 'progress-tracker' })}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Main Content Area - ZERO-DELAY SYNCHRONOUS RENDERING */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {view.type === 'subjects' ? (
          <SubjectsList
            subjects={enrichedSubjects}
            onOpenSubject={(subjectId) => navigateTo({ type: 'subject-detail', subjectId })}
            onCreateSubject={handleCreateSubject}
            onUpdateSubject={handleUpdateSubject}
            onDeleteSubject={handleDeleteSubject}
            onOpenGlobalSearch={() => setIsSearchOpen(true)}
            onOpenPredictedResult={() => navigateTo({ type: 'predicted-result' })}
            onOpenProgressTracker={() => navigateTo({ type: 'progress-tracker' })}
          />
        ) : view.type === 'predicted-result' ? (
          <PredictedResult
            onBack={() => navigateTo({ type: 'subjects' })}
          />
        ) : view.type === 'progress-tracker' ? (
          <ChapterProgressView
            userId={user.id}
            onBack={() => navigateTo({ type: 'subjects' })}
            showToast={showToast}
          />
        ) : view.type === 'subject-detail' && selectedSubject ? (
          <SubjectDetail
            subject={selectedSubject}
            chapters={currentSubjectChapters}
            userId={user.id}
            onBackToSubjects={() => navigateTo({ type: 'subjects' })}
            onOpenChapter={(chapterId) =>
              navigateTo({
                type: 'chapter-detail',
                subjectId: selectedSubject.id,
                chapterId,
              })
            }
            onUpdateSubject={(data) => handleUpdateSubject(selectedSubject.id, data)}
            onDeleteSubject={() => handleDeleteSubject(selectedSubject.id)}
            onCreateChapter={handleCreateChapter}
            onReorderChapters={handleReorderChapters}
          />
        ) : view.type === 'chapter-detail' && selectedSubject && selectedChapter ? (
          <ChapterDetail
            subject={selectedSubject}
            chapter={selectedChapter}
            topics={currentChapterTopics}
            userId={user.id}
            onBackToSubject={() =>
              navigateTo({ type: 'subject-detail', subjectId: selectedSubject.id })
            }
            onOpenTopic={(topicId) =>
              navigateTo({
                type: 'topic-detail',
                subjectId: selectedSubject.id,
                chapterId: selectedChapter.id,
                topicId,
              })
            }
            onUpdateChapter={handleUpdateChapter}
            onUpdateChapterSummary={handleUpdateChapterSummary}
            onDeleteChapter={handleDeleteChapter}
            onCreateTopic={handleCreateTopic}
          />
        ) : view.type === 'topic-detail' && selectedSubject && selectedChapter && selectedTopic ? (
          <TopicDetail
            subject={selectedSubject}
            chapter={selectedChapter}
            topic={selectedTopic}
            allTopics={currentChapterTopics}
            onBackToChapter={() =>
              navigateTo({
                type: 'chapter-detail',
                subjectId: selectedSubject.id,
                chapterId: selectedChapter.id,
              })
            }
            onNavigateTopic={(topicId) =>
              navigateTo({
                type: 'topic-detail',
                subjectId: selectedSubject.id,
                chapterId: selectedChapter.id,
                topicId,
              })
            }
            onUpdateTopic={handleUpdateTopic}
            onDeleteTopic={handleDeleteTopic}
          />
        ) : (
          /* Fallback only if direct link points to deleted item */
          <div className="py-16 text-center text-xs text-neutral-400">
            <p>Item not found or was removed.</p>
            <button
              onClick={() => navigateTo({ type: 'subjects' })}
              className="mt-3 text-xs underline text-neutral-600 dark:text-neutral-300"
            >
              Back to all subjects
            </button>
          </div>
        )}
      </main>

      {/* Global Search Dialog */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={handleSearchResultNavigation}
      />
    </div>
  );
};

export default App;
