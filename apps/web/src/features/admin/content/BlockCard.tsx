'use client';

import { useState, type ComponentType } from 'react';
import { blockData } from '@riad/shared';
import { Badge, Button, Callout, Card, Icon, Toggle, useToast } from '@/components/admin';
import { cn } from '@/lib/cn';
import { useSaveBlockMutation, type ContentBlockRow } from '@/store/admin/contentApi';
import { errorMessage, fieldErrors } from '@/store/baseApi';
import type { BlockData, BlockKey } from '@/types/api';
import type { AnyBlockDef, BlockEditorProps } from './blocks/types';

/** The stored data with the schema's defaults filled in, so the editor always gets a complete value. */
function normalise(def: AnyBlockDef, data: Record<string, unknown>): BlockData<BlockKey> {
  const parsed = blockData[def.key].safeParse(data);
  // Stored blocks were validated when saved; if one is older than the schema, edit what is there.
  return (parsed.success ? parsed.data : data) as BlockData<BlockKey>;
}

interface BlockCardProps {
  def: AnyBlockDef;
  row: ContentBlockRow;
}

/** One homepage block: show/hide switch, an editor that opens on demand, and its own Save. */
export function BlockCard({ def, row }: BlockCardProps) {
  const toast = useToast();
  const [save, { isLoading: saving }] = useSaveBlockMutation();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(() => normalise(def, row.data));
  const [errors, setErrors] = useState<Record<string, string>>({});

  // One deliberate widening: each editor is typed for its own block, and this card handles them all.
  const Editor = def.Editor as unknown as ComponentType<BlockEditorProps<BlockData<BlockKey>>>;
  const dirty = JSON.stringify(value) !== JSON.stringify(normalise(def, row.data));

  async function saveVisible(visible: boolean) {
    try {
      await save({ key: def.key, visible, data: normalise(def, row.data) }).unwrap();
      toast(visible ? `${def.title} is shown on the website` : `${def.title} is hidden`);
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  }

  async function saveData() {
    const parsed = blockData[def.key].safeParse(value);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path.join('.'), i.message])));
      toast('Please check the highlighted fields', 'error');
      return;
    }
    try {
      const saved = await save({ key: def.key, data: parsed.data as Record<string, unknown> }).unwrap();
      setValue(normalise(def, saved.data));
      setErrors({});
      toast(`${def.title} saved. The website updates within a minute`);
    } catch (err) {
      setErrors(Object.fromEntries(Object.entries(fieldErrors(err)).map(([k, v]) => [k.replace(/^data\./, ''), v])));
      toast(errorMessage(err), 'error');
    }
  }

  return (
    <Card>
      <div className="flex items-center gap-3 px-[18px] py-3.5">
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
          <Icon name="chevronRight" className={cn('transition-transform', open && 'rotate-90')} />
          <span className="min-w-0">
            <span className="block font-display text-lg leading-tight">{def.title}</span>
            <span className="block text-[13px] text-ink-soft">{def.description}</span>
          </span>
        </button>
        {dirty && <Badge tone="discussion">Unsaved</Badge>}
        {!row.visible && <Badge tone="draft">Hidden</Badge>}
        <Toggle checked={row.visible} onChange={saveVisible} label={`Show ${def.title} on the website`} />
      </div>
      {open && (
        <div className="space-y-4 border-t border-admin-line px-[18px] pb-[18px] pt-4">
          {Object.keys(errors).length > 0 && <Callout tone="error">{Object.values(errors).slice(0, 3).join(' · ')}</Callout>}
          <Editor
            value={value}
            onChange={(next) => {
              setValue(next);
              setErrors({});
            }}
            errors={errors}
          />
          <div className="flex gap-2">
            <Button variant="primary" onClick={saveData} disabled={!dirty || saving}>
              Save {def.title.toLowerCase()}
            </Button>
            {dirty && (
              <Button variant="ghost" onClick={() => setValue(normalise(def, row.data))}>
                Discard changes
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
