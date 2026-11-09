'use client';

import type { PublishCheck } from '@riad/shared';
import { Badge, Button, Card, CardBody, CardHeader, Icon } from '@/components/admin';
import { MediaThumb } from '@/components/admin/media/MediaThumb';
import { cn } from '@/lib/cn';
import type { ProductDraft, ProductTab } from './formModel';

interface CardPreviewProps {
  draft: ProductDraft;
  collectionName: string;
}

/** The product card as a visitor will see it, updated while the owner types. */
function CardPreview({ draft, collectionName }: CardPreviewProps) {
  const cover = draft.media.find((m) => m.media?.type === 'image')?.media ?? draft.colours[0]?.swatch ?? null;
  return (
    <Card>
      <CardHeader title="Card preview" action={<span className="text-[11.5px] text-ink-mute">as on the website</span>} />
      <CardBody>
        <div className="relative aspect-[3/4] overflow-hidden rounded-t-full rounded-b-[14px] bg-sand-200">
          {cover ? <MediaThumb media={cover} alt="" sizes="340px" /> : <div className="grid h-full place-items-center text-[13px] text-ink-mute">No cover image</div>}
          {draft.badge && (
            <span className="absolute left-1/2 top-3.5 -translate-x-1/2 whitespace-nowrap rounded-full bg-sand-50/95 px-2.5 py-1 text-[10.5px] uppercase tracking-[.16em] text-terracotta-600">{draft.badge}</span>
          )}
        </div>
        <div className="mt-2.5 flex justify-center gap-1">
          {draft.colours.map((c) => (
            <i key={c.id} title={c.name} style={{ backgroundColor: c.hex }} className="inline-block h-3.5 w-3.5 rounded-full border-2 border-white shadow-[0_0_0_1px_#e6dccb]" />
          ))}
        </div>
        <p className="mt-2 text-center font-display text-xl leading-[1.15]">{draft.name || 'Product name'}</p>
        <p className="mt-0.5 text-center text-xs text-ink-soft">
          {[collectionName, `MOQ ${draft.wholesale.moq || '—'}`, draft.wholesale.packText].filter(Boolean).join(' · ')}
        </p>
      </CardBody>
    </Card>
  );
}

interface ChecklistProps {
  checks: PublishCheck[];
  onGoto: (tab: ProductTab) => void;
}

function Checklist({ checks, onGoto }: ChecklistProps) {
  const failing = checks.filter((c) => !c.ok).length;
  return (
    <Card>
      <CardHeader title="Ready to publish?" action={<Badge tone={failing ? 'new' : 'published'}>{failing ? `${failing} to fix` : 'All set'}</Badge>} />
      <CardBody>
        <ul className="flex flex-col gap-0.5">
          {checks.map((c) => (
            <li key={c.key}>
              <button
                type="button"
                onClick={() => onGoto(c.tab)}
                className={cn('flex w-full items-center gap-2.5 rounded-[9px] px-2 py-[7px] text-left text-[13.5px] hover:bg-sand-50', c.ok ? '' : 'font-semibold')}
              >
                <Icon name={c.ok ? 'check' : 'x'} className={c.ok ? 'text-admin-ok' : 'text-admin-danger'} />
                <span>{c.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}

interface EditorSidebarProps {
  draft: ProductDraft;
  collectionName: string;
  checks: PublishCheck[];
  onGoto: (tab: ProductTab) => void;
  /** Present once the product exists; the extra actions need a saved product. */
  actions?: {
    status: 'draft' | 'published' | 'archived';
    busy: boolean;
    onDuplicate: () => void;
    onArchive: () => void;
    onRestore: () => void;
    onDelete: () => void;
  };
}

export function EditorSidebar({ draft, collectionName, checks, onGoto, actions }: EditorSidebarProps) {
  return (
    <aside className="flex flex-col gap-4 lg:sticky lg:top-[84px]">
      <CardPreview draft={draft} collectionName={collectionName} />
      <Checklist checks={checks} onGoto={onGoto} />
      {actions && (
        <Card>
          <CardHeader title="More actions" />
          <CardBody className="flex flex-col gap-2">
            <Button onClick={actions.onDuplicate} disabled={actions.busy}>
              <Icon name="copy" />
              Duplicate as a draft
            </Button>
            {actions.status === 'archived' ? (
              <Button onClick={actions.onRestore} disabled={actions.busy}>
                <Icon name="refresh" />
                Restore to drafts
              </Button>
            ) : (
              <Button onClick={actions.onArchive} disabled={actions.busy}>
                <Icon name="down" />
                Archive
              </Button>
            )}
            <Button variant="danger" onClick={actions.onDelete} disabled={actions.busy || actions.status === 'published'}>
              <Icon name="trash" />
              Delete product
            </Button>
            {actions.status === 'published' && <p className="text-xs text-ink-mute">Unpublish the product before deleting it.</p>}
          </CardBody>
        </Card>
      )}
    </aside>
  );
}
