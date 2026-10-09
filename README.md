# Academic Workspace (Personal Syllabus & Exam Notes)

A complete, private academic management web application built for personal syllabus organization, exam-ready answer curation, and chapter-level revision materials storage.

Built with **React**, **Vite**, **TypeScript**, **Tailwind CSS**, and **Supabase** (PostgreSQL, Auth, Storage), ready for one-click deployment to **Vercel**.

---

## 📚 Academic Architecture

The application follows a hierarchical academic structure:

```
Subjects ──► Chapters ──► Topics
               │
               └──► Overall Information (Summary, Handwritten Notes & PDF Cheat Sheets)
```

1. **Subjects**:
   - Manage academic courses/subjects with name and optional subject code (e.g. `22516`, `OSY-501`).
   - Cards display subject name, subject code, and real-time chapter counts.
   - Full CRUD support (create, edit, delete with confirmation).

2. **Chapters**:
   - Organized within parent subjects with optional unit/chapter numbering (e.g. `Chapter 1`, `Unit III`).
   - Compact chapter overview with topic count and attached revision materials indicator.
   - Reorder chapters up or down to align with syllabus progression.
   - Dedicated chapter-level **Overall Information** section.

3. **Chapter-Level Overall Information**:
   - **Written Chapter Summary**: Editable overview of the chapter, key formulas, and exam highlights.
   - **Revision Materials & Cheat Sheets**:
     - Upload images (JPG, PNG, WebP) such as photographs of handwritten classroom notes and diagrams.
     - Upload PDF documents such as unit cheat sheets, formula guides, and previous question papers.
     - Add titles and optional descriptions.
     - Image Lightbox: Full-screen image preview directly in the application.
     - Open files in new tabs or download them locally.
     - Edit metadata and securely delete files from both PostgreSQL and Supabase Storage.

4. **Topics**:
   - Topic name with possible exam question (displayed in a prominent callout card).
   - **Exam-Ready Answer Editor**:
     - Powered by a rich-text editor with support for headings (H1, H2, H3), paragraphs, numbered lists, bullet points, blockquotes, inline keywords/code, and text formatting (bold, italic, underline).
     - Full formatting preservation when saving, closing, and reopening.
     - Next / Previous topic quick navigation buttons.
     - One-click copy question & answer to clipboard, and print-ready view.

5. **Deep Search**:
   - Global search dialog accessible via `Ctrl+K` (or `Cmd+K`) from any screen.
   - Searches across PostgreSQL database content:
     - Subjects by name and subject code
     - Chapters by name and written summary
     - Topics by name, exam question, and answer body text
   - Results display hierarchical breadcrumbs (`Subject > Chapter`) and highlight matching snippets.
   - Clicking any result navigates directly to that subject, chapter, or topic.

6. **Design & Aesthetics**:
   - Clean, academic notebook aesthetic.
   - White background by default with black typography and neutral grey borders.
   - Optional dark mode toggle (persists in `localStorage`).
   - Mobile-first responsive layout for phone, tablet, and desktop studying.
   - Confirmation dialogs to prevent accidental deletions.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite, TypeScript
- **Styling**: Tailwind CSS v4 (neutral notebook theme)
- **Icons**: Lucide React
- **Rich Text Editor**: TipTap (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-underline`)
- **Backend & Database**: Supabase PostgreSQL (UUID primary keys, cascading deletes, foreign keys, and indexes)
- **Authentication**: Supabase Auth (Private email/password authentication with owner registration toggle)
- **File Storage**: Supabase Storage (`academic_materials` bucket with Row Level Security)
- **Deployment**: Vercel (Single-Page Application rewrite rules via `vercel.json`)

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js 18+ (tested with Node.js v24)
- npm 9+

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Fill in your Supabase project credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-or-publishable-key
```

### 4. Run Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🔐 Database & Security (Supabase Setup)

The complete SQL schema, performance indexes, and Row Level Security (RLS) policies are located in:
[`supabase/migrations/20261009000000_academic_workspace_schema.sql`](./supabase/migrations/20261009000000_academic_workspace_schema.sql)

### Applied Tables & Schema:
- **`subjects`**: `id`, `user_id`, `name`, `subject_code`, `position`, `created_at`, `updated_at`
- **`chapters`**: `id`, `subject_id`, `user_id`, `name`, `chapter_number`, `summary`, `position`, `created_at`, `updated_at`
- **`topics`**: `id`, `chapter_id`, `user_id`, `name`, `question`, `answer`, `position`, `created_at`, `updated_at`
- **`chapter_resources`**: `id`, `chapter_id`, `user_id`, `title`, `description`, `resource_type`, `storage_path`, `file_name`, `file_size`, `mime_type`, `created_at`, `updated_at`

### Row Level Security (RLS) Highlights:
- RLS is enabled on all tables.
- All `SELECT`, `INSERT`, `UPDATE`, and `DELETE` policies enforce `auth.uid() = user_id`.
- Parent hierarchy is strictly validated on writes:
  - Adding/updating chapters verifies ownership of the parent `subjects`.
  - Adding/updating topics and chapter resources verifies ownership of the parent `chapters`.
- Storage bucket `academic_materials` isolates files into `${user_id}/${chapter_id}/${filename}`, with authenticated RLS storage policies preventing unauthorized access.

---

## ☁️ Deployment to Vercel

### Step 1: Push Code to GitHub / Git Provider
```bash
git init
git add .
git commit -m "feat: complete academic workspace application"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

### Step 2: Import into Vercel
1. Log in to your [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** ➔ **Project**.
3. Select your repository.
4. Framework Preset: **Vite** (auto-detected).
5. Build Command: `npm run build`
6. Output Directory: `dist`

### Step 3: Add Environment Variables in Vercel
In the **Environment Variables** section of the Vercel project settings, add:
- `VITE_SUPABASE_URL`: `https://ehrmhjpsxwyqsebxdsyh.supabase.co`
- `VITE_SUPABASE_ANON_KEY`: `sb_publishable_YQNJ04dBGeXtSfB_ngVBDA_gG-H34oq` (or your publishable/anon key)

### Step 4: Deploy
Click **Deploy**. Your academic workspace is live with automatic SSL and global CDN caching. SPA deep routing is automatically handled via [`vercel.json`](./vercel.json).

---

## 📝 License
Personal Academic Use.
