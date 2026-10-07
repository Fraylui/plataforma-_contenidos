"use client";

import { useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapImage from "@tiptap/extension-image";
import { Image as ImageIcon, LinkBreak, LinkSimple as LinkIcon, ListBullets, ListNumbers, Quotes, TextB, TextHThree, TextHTwo, TextItalic, type Icon } from "@phosphor-icons/react";
import type { AdminImage } from "@/lib/api/admin-types";
import { ImageInsertDialog } from "./image-insert-dialog";
import { LinkInsertDialog } from "./link-insert-dialog";

/**
 * Toolbar deliberadamente mínima — negrita, cursiva, títulos, listas, cita,
 * link, imagen — coincide 1:1 con lo que `HtmlSanitizer` (backend) permite
 * guardar. Agregar un botón acá sin extender esa policy hace que el formato
 * se pierda silenciosamente al guardar.
 */
export function RichTextEditor({
  value,
  onChange,
  disabled,
  allImages,
}: {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  allImages: AdminImage[];
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      // StarterKit 3 ya trae Link: configurarlo aparte lo registraba dos veces (aviso de Tiptap en consola).
      StarterKit.configure({ heading: { levels: [2, 3] }, link: { openOnClick: false, autolink: true } }),
      TiptapImage.configure({ HTMLAttributes: { class: "rounded-md" } }),
    ],
    content: value,
    editable: !disabled,
    editorProps: {
      attributes: {
        class:
          "prose prose-theme prose-sm sm:prose-base max-w-none min-h-[16rem] px-3 py-2 focus:outline-none prose-headings:font-bold prose-a:text-accent",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) return null;

  return (
    <div className="overflow-hidden rounded-control border border-field-border bg-field transition-[border-color,box-shadow] focus-within:border-accent focus-within:ring-[3px] focus-within:ring-ring">
      {!disabled && <Toolbar editor={editor} allImages={allImages} />}
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({ editor, allImages }: { editor: Editor; allImages: AdminImage[] }) {
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border bg-surface px-2 py-1.5">
      <ToolbarButton
        icon={TextB}
        label="Negrita"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        icon={TextItalic}
        label="Cursiva"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolbarDivider />
      <ToolbarButton
        icon={TextHTwo}
        label="Título 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      />
      <ToolbarButton
        icon={TextHThree}
        label="Título 3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      />
      <ToolbarDivider />
      <ToolbarButton
        icon={ListBullets}
        label="Lista"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        icon={ListNumbers}
        label="Lista numerada"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
      <ToolbarButton
        icon={Quotes}
        label="Cita"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      />
      <ToolbarDivider />
      <ToolbarButton
        icon={LinkIcon}
        label="Enlace"
        active={editor.isActive("link")}
        onClick={() => setLinkDialogOpen(true)}
      />
      <ToolbarButton
        icon={LinkBreak}
        label="Quitar enlace"
        active={false}
        disabled={!editor.isActive("link")}
        onClick={() => editor.chain().focus().unsetLink().run()}
      />
      <LinkInsertDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        currentUrl={editor.getAttributes("link").href as string | undefined}
        onConfirm={(url) => editor.chain().focus().setLink({ href: url }).run()}
        onRemove={() => editor.chain().focus().unsetLink().run()}
      />
      <ToolbarDivider />
      <ToolbarButton
        icon={ImageIcon}
        label="Insertar imagen"
        active={false}
        onClick={() => setImageDialogOpen(true)}
      />
      <ImageInsertDialog
        open={imageDialogOpen}
        onOpenChange={setImageDialogOpen}
        allImages={allImages}
        onInsert={(src, alt) => editor.chain().focus().setImage({ src, alt: alt || undefined }).run()}
      />
    </div>
  );
}

function ToolbarButton({
  icon: Icon,
  label,
  active,
  disabled,
  onClick,
}: {
  icon: Icon;
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`flex min-h-9 min-w-9 items-center justify-center rounded transition-colors disabled:pointer-events-none disabled:opacity-40 ${
        active ? "bg-accent-soft text-accent" : "text-muted hover:bg-accent-soft hover:text-accent"
      }`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

function ToolbarDivider() {
  return <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />;
}
