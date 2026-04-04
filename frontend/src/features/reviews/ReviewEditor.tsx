import { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

interface Props {
  initialTitle?: string;
  initialContent?: string;
  initialIsPublic?: boolean;
  onSave: (data: { title: string; content: string; isPublic: boolean }) => void;
  onCancel: () => void;
  saving?: boolean;
}

export default function ReviewEditor({ initialTitle = '', initialContent = '', initialIsPublic = false, onSave, onCancel, saving }: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [isPublic, setIsPublic] = useState(initialIsPublic);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: '독후감을 작성해보세요...' }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[200px] p-3 focus:outline-none',
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editor) return;
    onSave({
      title,
      content: editor.getHTML(),
      isPublic,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="독후감 제목"
          required
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-lg font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Toolbar */}
      {editor && (
        <div className="flex flex-wrap gap-1 rounded-t-md border border-b-0 border-border bg-secondary/50 p-1">
          {[
            { label: 'B', action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold') },
            { label: 'I', action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic') },
            { label: 'H1', action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive('heading', { level: 2 }) },
            { label: 'H2', action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive('heading', { level: 3 }) },
            { label: 'List', action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive('bulletList') },
            { label: '1.', action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive('orderedList') },
            { label: 'Quote', action: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive('blockquote') },
            { label: 'Code', action: () => editor.chain().focus().toggleCodeBlock().run(), active: editor.isActive('codeBlock') },
          ].map(({ label, action, active }) => (
            <button key={label} type="button" onClick={action}
              className={`rounded px-2 py-1 text-xs font-medium ${active ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}>
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="rounded-b-md border border-border">
        <EditorContent editor={editor} />
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)}
            className="rounded border-border" />
          공개 독후감으로 설정
        </label>

        <div className="flex gap-2">
          <button type="button" onClick={onCancel}
            className="rounded border border-border px-4 py-2 text-sm hover:bg-secondary">취소</button>
          <button type="submit" disabled={saving}
            className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </form>
  );
}
