'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Button, ButtonLink, Callout, Icon, QueryError, Tabs, useToast } from '@/components/admin';
import { ConfirmDialog } from '@/components/admin/forms/ConfirmDialog';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  useCreateProductMutation,
  useDeleteProductMutation,
  useDuplicateProductMutation,
  useGetProductQuery,
  useSetProductStatusMutation,
  useUpdateProductMutation,
} from '@/store/admin/productsApi';
import { useListTaxonomyQuery } from '@/store/admin/taxonomyApi';
import { errorMessage, fieldErrors } from '@/store/baseApi';
import type { AdminProduct } from '@/types/api';
import { timeAgo } from '../shared/format';
import { EditorSidebar } from './EditorSidebar';
import {
  PRODUCT_TABS,
  blankDraft,
  createBody,
  draftChecks,
  isDirty,
  patchBody,
  tabOfField,
  toDraft,
  validateDraft,
  type FieldErrors,
  type ProductDraft,
  type ProductTab,
} from './formModel';
import { BasicsTab } from './tabs/BasicsTab';
import { DescriptionTab } from './tabs/DescriptionTab';
import { ALL_COLOURS, MediaTab } from './tabs/MediaTab';
import { SeoTab } from './tabs/SeoTab';
import type { TabProps } from './tabs/types';
import { VariantsTab } from './tabs/VariantsTab';
import { WholesaleTab } from './tabs/WholesaleTab';

type Confirm = 'delete' | 'archive' | null;

function EditorSkeleton() {
  return (
    <div className="space-y-4" aria-busy>
      <Skeleton className="h-9 w-72" />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Skeleton className="h-[520px]" />
        <Skeleton className="h-[520px]" />
      </div>
    </div>
  );
}

interface ProductEditorProps {
  /** Omit to create a new product. */
  productId?: string;
}

/**
 * Create or edit one product. The forms change a local draft; Save sends only the
 * fields that changed. Publishing is separate and runs the API's checklist.
 */
export function ProductEditor({ productId }: ProductEditorProps) {
  const router = useRouter();
  const toast = useToast();
  const isNew = !productId;

  const { data: product, isLoading, isError, error, refetch } = useGetProductQuery(productId ?? '', { skip: isNew });
  const categories = useListTaxonomyQuery('categories');
  const collections = useListTaxonomyQuery('collections');
  const [createProduct, { isLoading: creating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: updating }] = useUpdateProductMutation();
  const [setStatus, { isLoading: changingStatus }] = useSetProductStatusMutation();
  const [duplicateProduct, { isLoading: duplicating }] = useDuplicateProductMutation();
  const [deleteProduct, { isLoading: deleting }] = useDeleteProductMutation();

  /** `saved` is what the server has; `draft` is what is on screen. */
  const [saved, setSaved] = useState<ProductDraft | null>(null);
  const [draft, setDraft] = useState<ProductDraft | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [tab, setTab] = useState<ProductTab>('basics');
  const [colourFilter, setColourFilter] = useState(ALL_COLOURS);
  const [confirm, setConfirm] = useState<Confirm>(null);

  // Load the draft once per product. Later refetches must not overwrite what is being typed.
  useEffect(() => {
    if (product && saved === null) {
      const d = toDraft(product);
      setSaved(d);
      setDraft(d);
    }
  }, [product, saved]);

  // A new product starts with the first category and collection selected.
  useEffect(() => {
    if (!isNew || draft || !categories.data || !collections.data) return;
    const blank = blankDraft({ categoryId: categories.data[0]?.id ?? '', collectionId: collections.data[0]?.id ?? '', order: 0 });
    setSaved(blank);
    setDraft(blank);
  }, [isNew, draft, categories.data, collections.data]);

  const dirty = draft && saved ? isDirty(saved, draft) : false;

  // Browsers ask before closing a tab with unsaved work.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const update = useCallback<TabProps['update']>((patch) => {
    setDraft((current) => (current ? { ...current, ...(typeof patch === 'function' ? patch(current) : patch) } : current));
    setErrors({});
  }, []);

  const checks = useMemo(() => (draft ? draftChecks(draft) : []), [draft]);
  const failingTabs = new Set(checks.filter((c) => !c.ok).map((c) => c.tab));
  const busy = creating || updating || changingStatus || duplicating || deleting;

  function goTo(next: ProductTab, colourId?: string) {
    setTab(next);
    if (next === 'media') setColourFilter(colourId ?? ALL_COLOURS);
  }

  /** Shows what went wrong and moves to the tab that needs fixing. */
  function report(err: unknown) {
    const fields = fieldErrors(err);
    setErrors(fields);
    toast(errorMessage(err), 'error');
    const first = Object.keys(fields)[0];
    if (!first) return;
    if (first.startsWith('checks.')) {
      const failing = checks.find((c) => `checks.${c.key}` === first);
      if (failing) setTab(failing.tab);
    } else {
      setTab(tabOfField(first));
    }
  }

  /**
   * Takes the server's version as the new baseline. If the owner kept typing while the
   * request was running, their newer edits stay on screen and still count as unsaved.
   */
  function adopt(next: AdminProduct, sent: ProductDraft) {
    const d = toDraft(next);
    setSaved(d);
    setDraft((current) => (current === sent ? d : current));
    setErrors({});
  }

  /** Saves the draft. Returns the saved product, or null when it could not be saved. */
  async function save(): Promise<AdminProduct | null> {
    if (!draft || !saved) return null;
    const problems = validateDraft(draft);
    if (Object.keys(problems).length > 0) {
      setErrors(problems);
      setTab(tabOfField(Object.keys(problems)[0]!));
      toast('Please check the highlighted fields', 'error');
      return null;
    }
    try {
      if (isNew) {
        const created = await createProduct(createBody(draft)).unwrap();
        adopt(created, draft);
        toast('Product created as a draft');
        router.replace(`/admin/products/${created.id}`);
        return created;
      }
      const patch = patchBody(saved, draft);
      if (Object.keys(patch).length === 0) return product ?? null;
      const updated = await updateProduct({ id: productId!, body: patch }).unwrap();
      adopt(updated, draft);
      toast('Saved');
      return updated;
    } catch (err) {
      report(err);
      return null;
    }
  }

  async function publish() {
    const target = dirty || isNew ? await save() : (product ?? null);
    if (!target) return;
    try {
      await setStatus({ id: target.id, action: 'publish' }).unwrap();
      toast('Published. The website refreshes shortly');
    } catch (err) {
      report(err);
    }
  }

  async function changeStatus(action: 'unpublish' | 'archive', message: string) {
    if (!productId) return;
    try {
      await setStatus({ id: productId, action }).unwrap();
      toast(message);
    } catch (err) {
      report(err);
    }
  }

  async function duplicate() {
    if (!productId) return;
    try {
      const copy = await duplicateProduct(productId).unwrap();
      toast('Duplicated as a draft');
      router.push(`/admin/products/${copy.id}`);
    } catch (err) {
      report(err);
    }
  }

  async function remove() {
    if (!productId) return;
    try {
      await deleteProduct(productId).unwrap();
      toast('Product deleted');
      router.replace('/admin/products');
    } catch (err) {
      setConfirm(null);
      report(err);
    }
  }

  if (!isNew && isLoading) return <EditorSkeleton />;
  if (!isNew && isError) {
    const notFound = (error as { status?: number } | undefined)?.status === 404;
    return (
      <div className="max-w-xl">
        <QueryError error={notFound ? { data: { message: 'That product does not exist. It may have been deleted' } } : error} {...(notFound ? {} : { onRetry: refetch })} />
        <ButtonLink href="/admin/products">Back to products</ButtonLink>
      </div>
    );
  }
  if (!draft || !saved) return <EditorSkeleton />;

  const status = product?.status ?? 'draft';
  const collectionName = collections.data?.find((c) => c.id === draft.collectionId)?.name ?? '';
  const tabProps: TabProps = { draft, update, errors, goTo };

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <Link href="/admin/products" className="mb-1.5 inline-flex items-center gap-1 text-[13px] text-ink-soft hover:text-ink">
            <Icon name="back" />
            All products
          </Link>
          <h1 className="font-display text-[26px] font-normal leading-[1.1] sm:text-[30px]">{draft.name || 'New product'}</h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-2 text-ink-soft">
            {!isNew && <Badge tone={status}>{status[0]!.toUpperCase() + status.slice(1)}</Badge>}
            <span className="text-[13px] text-ink-mute">{isNew ? 'Not saved yet' : dirty ? 'Unsaved changes' : `Last saved ${timeAgo(product?.updatedAt)}`}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {status === 'published' && (
            <ButtonLink href={`/products/${saved.slug}`} target="_blank" rel="noopener">
              <Icon name="ext" />
              View on website
            </ButtonLink>
          )}
          <Button onClick={save} disabled={busy || (!isNew && !dirty)}>
            {isNew ? 'Create draft' : 'Save changes'}
          </Button>
          {status === 'published' ? (
            <Button onClick={() => changeStatus('unpublish', 'Unpublished')} disabled={busy}>
              Unpublish
            </Button>
          ) : (
            status !== 'archived' && (
              <Button variant="primary" onClick={publish} disabled={busy}>
                Publish
              </Button>
            )
          )}
        </div>
      </div>

      {Object.keys(errors).length > 0 && (
        <Callout tone="error" className="mb-4">
          Some fields need attention: {Object.values(errors).slice(0, 3).join(' · ')}
        </Callout>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px] min-[1700px]:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0">
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={PRODUCT_TABS.map((t) => ({
              value: t.key,
              label: (
                <>
                  {t.label}
                  {(failingTabs as Set<string>).has(t.key) && <span className="ml-[7px] inline-block h-2 w-2 rounded-full bg-terracotta-500" title="Needs attention" />}
                </>
              ),
            }))}
          />
          {tab === 'basics' && <BasicsTab {...tabProps} saved={!isNew} />}
          {tab === 'description' && <DescriptionTab {...tabProps} />}
          {tab === 'variants' && <VariantsTab {...tabProps} />}
          {tab === 'media' && <MediaTab {...tabProps} colourFilter={colourFilter} onColourFilter={setColourFilter} />}
          {tab === 'wholesale' && <WholesaleTab {...tabProps} />}
          {tab === 'seo' && <SeoTab {...tabProps} productId={productId} />}
        </div>

        <EditorSidebar
          draft={draft}
          collectionName={collectionName}
          checks={checks}
          onGoto={goTo}
          {...(isNew
            ? {}
            : {
                actions: {
                  status,
                  busy,
                  onDuplicate: duplicate,
                  onArchive: () => setConfirm('archive'),
                  onRestore: () => changeStatus('unpublish', 'Restored to drafts'),
                  onDelete: () => setConfirm('delete'),
                },
              })}
        />
      </div>

      <ConfirmDialog
        open={confirm === 'archive'}
        title="Archive this product?"
        message="It will no longer appear on the website. You can restore it to drafts at any time."
        confirmLabel="Archive"
        busy={changingStatus}
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          await changeStatus('archive', 'Archived');
          setConfirm(null);
        }}
      />
      <ConfirmDialog
        open={confirm === 'delete'}
        title="Delete this product?"
        message="This removes the product and cannot be undone. Enquiries that already include it keep their own copy of its details."
        confirmLabel="Delete product"
        danger
        busy={deleting}
        onCancel={() => setConfirm(null)}
        onConfirm={remove}
      />
    </>
  );
}
