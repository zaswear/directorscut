"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, List, Quote, Heading2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value?:    string;
  onChange?: (html: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichEditor({ value, onChange, placeholder = "Escribe tu crítica…", className }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Placeholder.configure({ placeholder }),
    ],
    content: value ?? "",
    editorProps: {
      attributes: {
        class: "prose-editor focus:outline-none min-h-[200px] py-3 px-4",
      },
    },
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
    immediatelyRender: false,
  });

  if (!editor) return null;

  const ToolBtn = ({
    onClick,
    active,
    children,
    title,
  }: {
    onClick: () => void;
    active?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "p-1.5 rounded transition-colors duration-100",
        active
          ? "bg-[var(--accent-dim)] text-[var(--accent)]"
          : "text-text-mid hover:text-text hover:bg-[var(--surface-hi)]"
      )}
    >
      {children}
    </button>
  );

  return (
    <div className={cn("border border-[var(--border)] rounded-[6px] overflow-hidden", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-[var(--border)] bg-[var(--surface)]">
        <ToolBtn
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Negrita"
        >
          <Bold size={14} />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="Cursiva"
        >
          <Italic size={14} />
        </ToolBtn>
        <div className="w-px h-4 bg-[var(--border)] mx-1" />
        <ToolBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
          title="Encabezado"
        >
          <Heading2 size={14} />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="Lista"
        >
          <List size={14} />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          title="Cita"
        >
          <Quote size={14} />
        </ToolBtn>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
