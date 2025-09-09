import { Extension } from '@tiptap/core';
import { ReactRenderer } from '@tiptap/react';
import SlashCommand from './slash-command';
import Suggestion from '@tiptap/suggestion';

const SlashCommandExtension = Extension.create({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        allowSpaces: false,
        allowedPrefixes: [' ', '\n'],
        startOfLine: false,
        decorationTag: 'span',
        decorationClass: 'slash-command-decoration',
        command: ({ editor, range, props }: any) => {
          props.command({ editor, range, props });
        },
        items: ({ query }: any) => {
          return [
            {
              title: 'Text',
              description: 'Just start writing with plain text.',
              searchTerms: ['p', 'paragraph'],
              command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).run();
              },
            },
            {
              title: 'Heading 1',
              description: 'Big section heading.',
              searchTerms: ['title', 'big', 'large'],
              command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run();
              },
            },
            {
              title: 'Heading 2',
              description: 'Medium section heading.',
              searchTerms: ['subtitle', 'medium'],
              command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run();
              },
            },
            {
              title: 'Heading 3',
              description: 'Small section heading.',
              searchTerms: ['subtitle', 'small'],
              command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run();
              },
            },
            {
              title: 'Bullet List',
              description: 'Create a simple bullet list.',
              searchTerms: ['unordered', 'point'],
              command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).toggleBulletList().run();
              },
            },
            {
              title: 'Numbered List',
              description: 'Create a list with numbering.',
              searchTerms: ['ordered'],
              command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).toggleOrderedList().run();
              },
            },
            {
              title: 'Quote',
              description: 'Capture a quote.',
              searchTerms: ['blockquote'],
              command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).toggleBlockquote().run();
              },
            },
            {
              title: 'Code',
              description: 'Capture a code snippet.',
              searchTerms: ['codeblock'],
              command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
              },
            },
          ].filter(item => 
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.description.toLowerCase().includes(query.toLowerCase()) ||
            item.searchTerms.some((term: string) => term.includes(query.toLowerCase()))
          );
        },
        render: () => {
          let component: ReactRenderer;
          let popup: HTMLElement;

          return {
            onStart: (props: any) => {
              component = new ReactRenderer(SlashCommand, {
                props,
                editor: props.editor,
              });

              popup = document.createElement('div');
              popup.className = 'slash-command-popup-container';
              popup.style.position = 'absolute';
              popup.style.zIndex = '1000';
              document.body.appendChild(popup);
              popup.appendChild(component.element);

              if (props.clientRect) {
                const rect = props.clientRect();
                popup.style.top = `${rect.bottom + window.scrollY + 5}px`;
                popup.style.left = `${rect.left + window.scrollX}px`;
              }
            },

            onUpdate: (props: any) => {
              component.updateProps(props);

              if (props.clientRect && popup) {
                const rect = props.clientRect();
                popup.style.top = `${rect.bottom + window.scrollY + 5}px`;
                popup.style.left = `${rect.left + window.scrollX}px`;
              }
            },

            onKeyDown: (props: any) => {
              if (props.event.key === 'Escape') {
                return true;
              }
              return component.ref?.onKeyDown?.(props);
            },

            onExit: () => {
              if (popup && popup.parentNode) {
                popup.parentNode.removeChild(popup);
              }
              if (component) {
                component.destroy();
              }
            },
          };
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

export default SlashCommandExtension;
