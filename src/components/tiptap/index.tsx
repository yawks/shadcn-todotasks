import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { Toolbar } from './toolbars/toolbar';
import { BubbleMenuComponent } from './bubble-menu';
import { FloatingMenuComponent } from './floating-menu';

interface TiptapProps {
  content: string;
  onChange: (content: string) => void;
}

const Tiptap = ({ content, onChange }: TiptapProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
      Link.configure({
        openOnClick: false,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-2xl m-5 focus:outline-none",
      },
    }
  });

  return (
    <div className="border rounded-md">
      <Toolbar editor={editor} />
      <BubbleMenuComponent editor={editor} />
      <FloatingMenuComponent editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};

export default Tiptap;
