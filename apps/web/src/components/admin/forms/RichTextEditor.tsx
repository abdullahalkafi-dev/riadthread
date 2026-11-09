'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  label: string;
  minHeight?: number;
}

type Command = { label: string; title: string; run: () => void };

const exec = (command: string, arg?: string) => document.execCommand(command, false, arg);

/**
 * A small WYSIWYG editor for descriptions and text pages. It offers only what the
 * website can render (bold, italic, headings, lists, links); the API removes
 * anything else when the page is saved.
 */
export function RichTextEditor({ value, onChange, label, minHeight = 160 }: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Write the HTML in only when it differs from what the editor already shows,
  // otherwise the caret would jump to the start on every keystroke.
  useEffect(() => {
    const el = ref.current;
    if (el && el.innerHTML !== value) el.innerHTML = value;
  }, [value]);

  const commands: Command[] = [
    { label: 'B', title: 'Bold', run: () => exec('bold') },
    { label: 'I', title: 'Italic', run: () => exec('italic') },
    { label: 'H3', title: 'Heading', run: () => exec('formatBlock', 'h3') },
    { label: 'H4', title: 'Sub-heading', run: () => exec('formatBlock', 'h4') },
    { label: 'Text', title: 'Normal paragraph', run: () => exec('formatBlock', 'p') },
    { label: '• List', title: 'Bulleted list', run: () => exec('insertUnorderedList') },
    { label: '1. List', title: 'Numbered list', run: () => exec('insertOrderedList') },
    {
      label: 'Link',
      title: 'Add a link',
      run: () => {
        const url = window.prompt('Link address (https://…)');
        if (url) exec('createLink', url);
      },
    },
  ];

  return (
    <div className="overflow-hidden rounded-[10px] border border-admin-line bg-white focus-within:border-terracotta-500 focus-within:ring-4 focus-within:ring-terracotta-500/10">
      <div className="flex flex-wrap gap-0.5 border-b border-admin-line bg-sand-50 p-1.5" role="toolbar" aria-label={`${label} formatting`}>
        {commands.map((c) => (
          <button
            key={c.label}
            type="button"
            title={c.title}
            // Keep the selection inside the editor when a toolbar button is pressed.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              c.run();
              if (ref.current) onChange(ref.current.innerHTML);
            }}
            className={cn('rounded-md px-2.5 py-1 text-[13px] font-bold text-ink-soft hover:bg-sand-200', c.label === 'I' && 'italic')}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div
        ref={ref}
        role="textbox"
        aria-multiline="true"
        aria-label={label}
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        style={{ minHeight }}
        className="prose-admin p-3 outline-none"
      />
    </div>
  );
}
