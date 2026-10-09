import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Undo,
  Redo,
  Pilcrow,
} from 'lucide-react';

interface AnswerEditorProps {
  content: string;
  onChange: (html: string) => void;
  editable?: boolean;
  placeholder?: string;
}

export const AnswerEditor: React.FC<AnswerEditorProps> = ({
  content,
  onChange,
  editable = true,
  placeholder = 'Write the complete exam-ready answer here...',
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
    ],
    content: content || '<p></p>',
    editable: editable,
    editorProps: {
      attributes: {
        class:
          'min-h-[220px] max-h-[500px] overflow-y-auto px-4 py-3 focus:outline-none text-neutral-900 dark:text-neutral-100 text-base leading-relaxed',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Keep editor content in sync when prop content changes externally
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '<p></p>');
    }
  }, [content, editor]);

  if (!editor) {
    return (
      <div className="border border-neutral-200 dark:border-neutral-800 rounded p-4 text-sm text-neutral-400">
        Loading editor...
      </div>
    );
  }

  if (!editable) {
    return (
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <EditorContent editor={editor} />
      </div>
    );
  }

  return (
    <div className="border border-neutral-300 dark:border-neutral-700 rounded-md overflow-hidden bg-white dark:bg-neutral-900 focus-within:border-neutral-900 dark:focus-within:border-neutral-400 transition-colors">
      {/* Notebook Toolbar */}
      <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 bg-neutral-50 dark:bg-neutral-800/80 border-b border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300">
        {/* Headings */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={`p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-medium flex items-center gap-1 ${
            editor.isActive('paragraph') ? 'bg-neutral-200 dark:bg-neutral-700 font-bold' : ''
          }`}
          title="Paragraph / Normal text"
        >
          <Pilcrow className="w-3.5 h-3.5" />
          <span>P</span>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-medium flex items-center gap-0.5 ${
            editor.isActive('heading', { level: 1 }) ? 'bg-neutral-200 dark:bg-neutral-700 font-bold' : ''
          }`}
          title="Main Heading (H1)"
        >
          <Heading1 className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-medium flex items-center gap-0.5 ${
            editor.isActive('heading', { level: 2 }) ? 'bg-neutral-200 dark:bg-neutral-700 font-bold' : ''
          }`}
          title="Sub Heading (H2)"
        >
          <Heading2 className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-medium flex items-center gap-0.5 ${
            editor.isActive('heading', { level: 3 }) ? 'bg-neutral-200 dark:bg-neutral-700 font-bold' : ''
          }`}
          title="Section Heading (H3)"
        >
          <Heading3 className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-5 bg-neutral-300 dark:bg-neutral-700 mx-1" />

        {/* Text Formats */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 ${
            editor.isActive('bold') ? 'bg-neutral-200 dark:bg-neutral-700 font-bold' : ''
          }`}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 ${
            editor.isActive('italic') ? 'bg-neutral-200 dark:bg-neutral-700 italic' : ''
          }`}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 ${
            editor.isActive('underline') ? 'bg-neutral-200 dark:bg-neutral-700 underline' : ''
          }`}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-5 bg-neutral-300 dark:bg-neutral-700 mx-1" />

        {/* Lists */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 ${
            editor.isActive('bulletList') ? 'bg-neutral-200 dark:bg-neutral-700' : ''
          }`}
          title="Bullet Points"
        >
          <List className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 ${
            editor.isActive('orderedList') ? 'bg-neutral-200 dark:bg-neutral-700' : ''
          }`}
          title="Numbered List"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>

        {/* Quotes & Code */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 ${
            editor.isActive('blockquote') ? 'bg-neutral-200 dark:bg-neutral-700' : ''
          }`}
          title="Blockquote / Definition"
        >
          <Quote className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 ${
            editor.isActive('code') ? 'bg-neutral-200 dark:bg-neutral-700 font-mono' : ''
          }`}
          title="Inline Code / Keyword"
        >
          <Code className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-5 bg-neutral-300 dark:bg-neutral-700 mx-1" />

        {/* History */}
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30 disabled:hover:bg-transparent"
          title="Undo"
        >
          <Undo className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30 disabled:hover:bg-transparent"
          title="Redo"
        >
          <Redo className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Editor Body */}
      <EditorContent editor={editor} />

      {!content && (
        <div className="px-4 pb-2 text-xs text-neutral-400 dark:text-neutral-500 italic select-none">
          {placeholder}
        </div>
      )}
    </div>
  );
};

export const AnswerViewer: React.FC<{ html: string }> = ({ html }) => {
  if (!html || html === '<p></p>') {
    return (
      <div className="text-neutral-400 dark:text-neutral-500 italic text-sm py-4">
        No answer or explanation written yet. Click &quot;Edit Topic&quot; to write an exam answer.
      </div>
    );
  }

  return (
    <div
      className="academic-answer-content text-neutral-900 dark:text-neutral-100 text-base leading-relaxed space-y-3"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
