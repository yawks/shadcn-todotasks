import {
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Type
} from 'lucide-react';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

interface SlashCommandProps {
  items: any[];
  command: (item: any) => void;
}

interface SlashCommandRef {
  onKeyDown: (props: any) => boolean;
}

const SlashCommand = forwardRef<SlashCommandRef, SlashCommandProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
      const item = items[index];
      if (item) {
        command(item);
      }
    };

    const upHandler = () => {
      setSelectedIndex((selectedIndex + items.length - 1) % items.length);
    };

    const downHandler = () => {
      setSelectedIndex((selectedIndex + 1) % items.length);
    };

    const enterHandler = () => {
      selectItem(selectedIndex);
    };

    useEffect(() => {
      setSelectedIndex(0);
    }, [items]);

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: any) => {
        if (event.key === 'ArrowUp') {
          upHandler();
          return true;
        }

        if (event.key === 'ArrowDown') {
          downHandler();
          return true;
        }

        if (event.key === 'Enter') {
          enterHandler();
          return true;
        }

        return false;
      },
    }));

    const getIcon = (title: string) => {
      switch (title) {
        case 'Text':
          return <Type className="w-4 h-4" />;
        case 'Heading 1':
          return <Heading1 className="w-4 h-4" />;
        case 'Heading 2':
          return <Heading2 className="w-4 h-4" />;
        case 'Heading 3':
          return <Heading3 className="w-4 h-4" />;
        case 'Bullet List':
          return <List className="w-4 h-4" />;
        case 'Numbered List':
          return <ListOrdered className="w-4 h-4" />;
        case 'Quote':
          return <Quote className="w-4 h-4" />;
        case 'Code':
          return <Code className="w-4 h-4" />;
        default:
          return <Type className="w-4 h-4" />;
      }
    };

    return (
      <div className="z-50 h-auto max-h-[330px] w-72 overflow-y-auto rounded-md border border-gray-200 bg-white p-1 shadow-md transition-all">
        {items.length > 0 ? (
          items.map((item, index) => (
            <button
              key={index}
              className={`flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-gray-100 ${
                index === selectedIndex ? 'bg-gray-100' : ''
              }`}
              onClick={() => selectItem(index)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 bg-white">
                {getIcon(item.title)}
              </div>
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-xs text-gray-500">{item.description}</p>
              </div>
            </button>
          ))
        ) : (
          <div className="px-2 py-1 text-sm text-gray-500">Aucun résultat</div>
        )}
      </div>
    );
  }
);

SlashCommand.displayName = 'SlashCommand';

export default SlashCommand;
