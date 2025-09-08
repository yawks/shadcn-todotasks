import { Editor, BubbleMenu } from '@tiptap/react';
import { Bold, Italic, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BubbleMenuProps {
  editor: Editor | null;
}

export function BubbleMenuComponent({ editor }: BubbleMenuProps) {
  if (!editor) {
    return null;
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
      <div className="flex space-x-1 bg-background border rounded-md p-1">
        <Button
          variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive('link') ? 'secondary' : 'ghost'}
          size="sm"
          onClick={setLink}
        >
          <Link className="h-4 w-4" />
        </Button>
      </div>
    </BubbleMenu>
  );
}
