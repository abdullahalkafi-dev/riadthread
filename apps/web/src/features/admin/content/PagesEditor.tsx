'use client';

import { useState } from 'react';
import { PAGE_KEYS } from '@riad/shared';
import { Button, Card, CardBody, CardHeader, Chip, Field, Input, QueryError, useToast } from '@/components/admin';
import { RichTextEditor } from '@/components/admin/forms/RichTextEditor';
import { Skeleton } from '@/components/ui/Skeleton';
import { useGetPageQuery, useSavePageMutation } from '@/store/admin/contentApi';
import { errorMessage, fieldErrors } from '@/store/baseApi';
import type { PageContent } from '@/types/api';

const TITLES: Record<(typeof PAGE_KEYS)[number], string> = {
  about: 'About',
  contact: 'Contact',
  'faq-page': 'FAQ page',
  privacy: 'Privacy policy',
  cookies: 'Cookie policy',
  terms: 'Terms',
};

interface Draft {
  title: string;
  bodyHtml: string;
  seoTitle: string;
  seoDescription: string;
}
const toDraft = (p: PageContent): Draft => ({ title: p.title, bodyHtml: p.bodyHtml, seoTitle: p.seoTitle, seoDescription: p.seoDescription });

function PageForm({ pageKey, page }: { pageKey: string; page: PageContent }) {
  const toast = useToast();
  const [save, { isLoading }] = useSavePageMutation();
  const [saved, setSaved] = useState(() => toDraft(page));
  const [draft, setDraft] = useState(saved);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dirty = JSON.stringify(saved) !== JSON.stringify(draft);
  const set = (patch: Partial<Draft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setErrors({});
  };

  async function submit() {
    if (!draft.title.trim()) {
      setErrors({ title: 'Enter a title for the page' });
      return;
    }
    try {
      const result = await save({ key: pageKey, body: draft }).unwrap();
      // The server cleans the HTML, so show exactly what was stored.
      const next = toDraft(result);
      setSaved(next);
      setDraft(next);
      toast('Page saved. The website updates within a minute');
    } catch (err) {
      setErrors(fieldErrors(err));
      toast(errorMessage(err), 'error');
    }
  }

  return (
    <Card>
      <CardHeader title={TITLES[pageKey as keyof typeof TITLES] ?? pageKey} />
      <CardBody className="space-y-3.5">
        <Field label="Page title" htmlFor="pg-title" error={errors.title}>
          <Input id="pg-title" value={draft.title} maxLength={120} onChange={(e) => set({ title: e.target.value })} invalid={!!errors.title} />
        </Field>
        <div>
          <span className="mb-[5px] block text-[12.5px] font-semibold text-ink-soft">Page text</span>
          <RichTextEditor label="Page text" value={draft.bodyHtml} onChange={(bodyHtml) => set({ bodyHtml })} minHeight={260} />
          <p className="mt-1 text-xs text-ink-mute">Headings, lists, bold, italic and links. Anything else is removed when you save.</p>
        </div>
        <div className="grid gap-3.5 md:grid-cols-2">
          <Field label="Search title (optional)" htmlFor="pg-seo-title" error={errors.seoTitle}>
            <Input id="pg-seo-title" value={draft.seoTitle} maxLength={120} onChange={(e) => set({ seoTitle: e.target.value })} />
          </Field>
          <Field label="Search description (optional)" htmlFor="pg-seo-desc" error={errors.seoDescription}>
            <Input id="pg-seo-desc" value={draft.seoDescription} maxLength={300} onChange={(e) => set({ seoDescription: e.target.value })} />
          </Field>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" onClick={submit} disabled={!dirty || isLoading}>
            Save page
          </Button>
          {dirty && (
            <Button variant="ghost" onClick={() => setDraft(saved)}>
              Discard changes
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

/** The text pages (About, Contact, policies): pick one, edit, save. */
export function PagesEditor() {
  const [key, setKey] = useState<(typeof PAGE_KEYS)[number]>(PAGE_KEYS[0]);
  const { data, isLoading, isError, error, refetch } = useGetPageQuery(key);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Page">
        {PAGE_KEYS.map((k) => (
          <Chip key={k} active={k === key} onClick={() => setKey(k)}>
            {TITLES[k]}
          </Chip>
        ))}
      </div>
      {isError ? (
        <Card>
          <QueryError error={error} onRetry={refetch} />
        </Card>
      ) : isLoading || !data ? (
        <Skeleton className="h-[420px] rounded-card" />
      ) : (
        <PageForm key={`${key}:${data.updatedAt ?? 'new'}`} pageKey={key} page={data} />
      )}
    </div>
  );
}
