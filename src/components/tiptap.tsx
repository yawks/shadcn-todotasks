import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

interface TiptapProps {
  content: string;
  onChange: (content: string) => void;
}

const Tiptap = ({ content, onChange }: TiptapProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  return (
    <EditorContent editor={editor} />
  );
};

export default Tiptap;
