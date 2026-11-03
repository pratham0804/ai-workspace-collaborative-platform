import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";

interface Props {
  content: unknown;
  readOnly?: boolean;
  onChange?: (content: unknown) => void;
}

export default function DocumentEditor({
  content,
  readOnly = false,
  onChange,
}: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({
        placeholder: "Start writing...",
      }),
    ],
    content: content as Record<string, unknown>,
    editable: !readOnly,
    onUpdate: ({ editor: current }) => {
      onChange?.(current.getJSON());
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!readOnly);
  }, [editor, readOnly]);

  useEffect(() => {
    if (!editor) return;
    const current = JSON.stringify(editor.getJSON());
    const next = JSON.stringify(content);
    if (current !== next) {
      editor.commands.setContent(content as Record<string, unknown>);
    }
  }, [editor, content]);

  if (!editor) {
    return <p className="muted">Loading editor...</p>;
  }

  return (
    <div className="editor-wrap">
      {!readOnly && (
        <div className="editor-toolbar">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            B
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            I
          </button>
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
          >
            H1
          </button>
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            List
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            1.
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          >
            Code
          </button>
          <button
            type="button"
            onClick={() => {
              const href = window.prompt("Link URL");
              if (!href) return;
              editor.chain().focus().setLink({ href }).run();
            }}
          >
            Link
          </button>
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
