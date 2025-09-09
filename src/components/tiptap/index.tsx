import '@/styles/tiptap-custom.css';

import { EditorContent, useEditor } from '@tiptap/react';

import Blockquote from '@tiptap/extension-blockquote';
import Bold from '@tiptap/extension-bold';
import BulletList from '@tiptap/extension-bullet-list';
import CodeBlock from '@tiptap/extension-code-block';
import Heading from '@tiptap/extension-heading';
import Italic from '@tiptap/extension-italic';
import Link from '@tiptap/extension-link';
import ListItem from '@tiptap/extension-list-item';
import OrderedList from '@tiptap/extension-ordered-list';
import Placeholder from '@tiptap/extension-placeholder';
import SlashCommandExtension from './slash-extension';
import StarterKit from '@tiptap/starter-kit';

interface TiptapProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  noBorder?: boolean;
}

const Tiptap = ({ content, onChange, placeholder, noBorder }: TiptapProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Keep most starter kit defaults but customize specific ones
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        blockquote: false,
        codeBlock: false,
        bold: false,
        italic: false,
      }),
      Heading.configure({
        levels: [1, 2, 3],
      }),
      BulletList,
      OrderedList,
      ListItem,
      Blockquote,
      CodeBlock,
      Bold,
      Italic,
      Placeholder.configure({
        placeholder: placeholder || 'Tapez "/" pour voir les options de formatage...',
      }),
      Link.configure({
        openOnClick: false,
      }),
      SlashCommandExtension,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "outline-none prose prose-sm max-w-none px-3 py-2 min-h-[80px]",
      },
    }
  });

  return (
    <div className={`border-input placeholder:text-muted-foreground flex min-h-[80px] w-full rounded-md bg-transparent text-base shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm ${noBorder ? '' : 'border'}`}>
      <EditorContent editor={editor} className="w-full [&_.ProseMirror]:min-h-[80px] [&_.ProseMirror]:outline-none" />
    </div>
  );
};

export default Tiptap;
