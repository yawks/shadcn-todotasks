import { Editor, FloatingMenu } from '@tiptap/react';
import { Heading1, Heading2, Heading3, List, ListOrdered, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FloatingMenuProps {
  editor: Editor | null;
}

export function FloatingMenuComponent({ editor }: FloatingMenuProps) {
  if (!editor) {
    return null;
  }

  return (
    <FloatingMenu editor={editor} tippyOptions={{ duration: 100 }}>
      <div className="flex flex-col space-y-1 bg-background border rounded-md p-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 className="h-4 w-4 mr-2" />
          Heading 1
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="h-4 w-4 mr-2" />
          Heading 2
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="h-4 w-4 mr-2" />
          Heading 3
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4 mr-2" />
          Bullet List
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4 mr-2" />
          Numbered List
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-4 w-4 mr-2" />
          Blockquote
        </Button>
      </div>
    </FloatingMenu>
  );
}
