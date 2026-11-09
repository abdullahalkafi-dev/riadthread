'use client';

import { useEffect, useState } from 'react';
import { Button, Card, CardBody, CardHeader, Icon, QueryError, Toggle, useToast } from '@/components/admin';
import { Skeleton } from '@/components/ui/Skeleton';
import { useGetLayoutQuery, useSaveLayoutMutation, type HomeSection } from '@/store/admin/contentApi';
import { errorMessage } from '@/store/baseApi';
import { moveItem } from './blocks/ListControls';

const LABELS: Record<string, string> = {
  hero: 'Hero slides',
  trust: 'Trust bar',
  shopByCategory: 'Shop by category',
  brandFilm: 'Brand film',
  showcase: 'Product showcase',
  heritage: 'Heritage story',
  craft: 'Craft',
  lookbook: 'Lookbook',
  steps: 'How it works',
  supply: 'Who we supply',
  faq: 'FAQ',
  lineSheet: 'Line sheet offer',
  enquiry: 'Enquiry form',
};

/** The homepage sections in page order, each with a show/hide switch. */
export function HomeSections() {
  const toast = useToast();
  const { data, isLoading, isError, error, refetch } = useGetLayoutQuery();
  const [saveLayout, { isLoading: saving }] = useSaveLayoutMutation();
  const [sections, setSections] = useState<HomeSection[] | null>(null);

  // Take the saved order once; edits are kept until saved or discarded.
  useEffect(() => {
    if (data && sections === null) setSections(data);
  }, [data, sections]);

  const dirty = !!data && !!sections && JSON.stringify(data) !== JSON.stringify(sections);

  async function save() {
    if (!sections) return;
    try {
      const saved = await saveLayout(sections).unwrap();
      setSections(saved);
      toast('Homepage order saved');
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  }

  return (
    <Card className="self-start lg:sticky lg:top-[84px]">
      <CardHeader title="Homepage sections" />
      <CardBody>
        <p className="mb-3 text-[13px] text-ink-soft">Same order as the website. Switch a section off to hide it.</p>
        {isError ? (
          <QueryError error={error} onRetry={refetch} />
        ) : isLoading || !sections ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : (
          <>
            <ol>
              {sections.map((s, i) => (
                <li key={s.key} className="flex items-center gap-2 border-b border-admin-line py-2 last:border-0">
                  <span className="w-5 text-xs text-ink-mute">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate">{LABELS[s.key] ?? s.key}</span>
                  <Button size="sm" variant="ghost" disabled={i === 0} aria-label={`Move ${LABELS[s.key] ?? s.key} up`} onClick={() => setSections(moveItem(sections, i, i - 1))}>
                    <Icon name="up" />
                  </Button>
                  <Button size="sm" variant="ghost" disabled={i === sections.length - 1} aria-label={`Move ${LABELS[s.key] ?? s.key} down`} onClick={() => setSections(moveItem(sections, i, i + 1))}>
                    <Icon name="down" />
                  </Button>
                  <Toggle checked={s.visible} onChange={(visible) => setSections(sections.map((x) => (x.key === s.key ? { ...x, visible } : x)))} label={`Show ${LABELS[s.key] ?? s.key}`} />
                </li>
              ))}
            </ol>
            <div className="mt-3 flex gap-2">
              <Button variant="primary" onClick={save} disabled={!dirty || saving}>
                Save order
              </Button>
              {dirty && (
                <Button variant="ghost" onClick={() => setSections(data ?? null)}>
                  Discard
                </Button>
              )}
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
}
