'use client';

import { Button, Icon } from '@/components/admin';

/** Returns a copy of the list with one item moved; a move off either end is ignored. */
export function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item!);
  return next;
}

interface ItemFrameProps {
  /** Short name used in button labels, e.g. "slide" or "question". */
  noun: string;
  index: number;
  count: number;
  onMove: (to: number) => void;
  onRemove: () => void;
  children: React.ReactNode;
}

/** The box around one repeatable item, with move up / move down / remove. */
export function ItemFrame({ noun, index, count, onMove, onRemove, children }: ItemFrameProps) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-admin-line bg-white p-3">
      <span className="mt-1 grid h-6 w-6 flex-none place-items-center rounded-full bg-sand-200 text-xs font-bold text-ink-soft">{index + 1}</span>
      <div className="min-w-0 flex-1 space-y-2.5">{children}</div>
      <div className="flex flex-none flex-col gap-1">
        <Button size="sm" variant="ghost" disabled={index === 0} aria-label={`Move ${noun} ${index + 1} up`} onClick={() => onMove(index - 1)}>
          <Icon name="up" />
        </Button>
        <Button size="sm" variant="ghost" disabled={index === count - 1} aria-label={`Move ${noun} ${index + 1} down`} onClick={() => onMove(index + 1)}>
          <Icon name="down" />
        </Button>
        <Button size="sm" variant="danger" aria-label={`Remove ${noun} ${index + 1}`} onClick={onRemove}>
          <Icon name="x" />
        </Button>
      </div>
    </div>
  );
}

export function AddItemButton({ noun, onClick, disabled }: { noun: string; onClick: () => void; disabled?: boolean }) {
  return (
    <Button size="sm" onClick={onClick} disabled={disabled}>
      <Icon name="plus" />
      Add {noun}
    </Button>
  );
}
