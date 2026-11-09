'use client';

import { useState } from 'react';
import type { EnquiryStatus } from '@riad/shared';
import { ScoreBadge, Thumbs } from '@/components/admin';
import { cn } from '@/lib/cn';
import { timeAgo } from '@/lib/admin-format';
import type { EnquiryRow } from '@/types/api';
import { PIPELINE, STATUS_COLOUR, statusLabel } from './statusMeta';

interface EnquiryBoardProps {
  rows: EnquiryRow[];
  onOpen: (id: string) => void;
  onMove: (row: EnquiryRow, status: EnquiryStatus) => void;
}

/** One column per stage. Dragging a card to another column changes its status. */
export function EnquiryBoard({ rows, onOpen, onMove }: EnquiryBoardProps) {
  const [dragging, setDragging] = useState<EnquiryRow | null>(null);
  const [over, setOver] = useState<EnquiryStatus | null>(null);

  return (
    <div className="grid auto-cols-[minmax(250px,1fr)] grid-flow-col items-start gap-3.5 overflow-x-auto pb-3.5">
      {PIPELINE.map((status) => {
        const cards = rows.filter((e) => e.status === status);
        return (
          <section
            key={status}
            aria-label={statusLabel(status)}
            onDragOver={(e) => {
              if (!dragging) return;
              e.preventDefault();
              setOver(status);
            }}
            onDragLeave={() => setOver((current) => (current === status ? null : current))}
            onDrop={(e) => {
              e.preventDefault();
              if (dragging && dragging.status !== status) onMove(dragging, status);
              setDragging(null);
              setOver(null);
            }}
            className={cn(
              'min-h-[200px] rounded-card bg-sand-200 p-2.5 transition',
              over === status && 'bg-[#e6d8bf] outline-2 outline-dashed outline-terracotta-500',
            )}
          >
            <h4 className="flex items-center justify-between px-1.5 pb-2.5 pt-1 text-[12.5px] font-bold tracking-[.02em]">
              <b style={{ color: STATUS_COLOUR[status] }}>{statusLabel(status)}</b>
              <span className="rounded-full bg-white px-2 text-xs">{cards.length}</span>
            </h4>
            {cards.map((e) => (
              <article
                key={e.id}
                draggable
                onDragStart={(ev) => {
                  setDragging(e);
                  ev.dataTransfer.effectAllowed = 'move';
                  ev.dataTransfer.setData('text/plain', e.id);
                }}
                onDragEnd={() => {
                  setDragging(null);
                  setOver(null);
                }}
                onClick={() => onOpen(e.id)}
                className={cn(
                  'mb-[9px] cursor-grab rounded-xl border border-admin-line bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,.05)] transition hover:-translate-y-px hover:shadow-card',
                  dragging?.id === e.id && 'opacity-40',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[12.5px] font-semibold tabular-nums text-ink-soft">{e.ref}</span>
                  <ScoreBadge level={e.score.level} />
                </div>
                <div className="mt-1 font-semibold">{e.contact.business || e.contact.name}</div>
                <div className="mb-2 mt-0.5 text-[12.5px] text-ink-soft">
                  {e.itemCount} product{e.itemCount === 1 ? '' : 's'} · {e.qtyTotal} units
                </div>
                <div className="flex items-center justify-between">
                  <Thumbs urls={e.thumbs} total={e.itemCount} />
                  <span className="text-[11.5px] text-ink-mute">{timeAgo(e.createdAt)}</span>
                </div>
              </article>
            ))}
          </section>
        );
      })}
    </div>
  );
}
