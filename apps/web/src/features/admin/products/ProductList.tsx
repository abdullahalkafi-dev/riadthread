'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Badge,
  ButtonLink,
  Button,
  Card,
  EmptyState,
  Icon,
  Input,
  PageHeader,
  Pagination,
  QueryError,
  Segmented,
  Select,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
  useToast,
} from '@/components/admin';
import { MediaThumb } from '@/components/admin/media/MediaThumb';
import { Skeleton } from '@/components/ui/Skeleton';
import { errorMessage } from '@/store/baseApi';
import { useListProductsQuery, useSetProductStatusMutation } from '@/store/admin/productsApi';
import { useListTaxonomyQuery } from '@/store/admin/taxonomyApi';
import type { AdminProductRow } from '@/types/api';
import { timeAgo } from '../shared/format';
import { useDebounced } from '../shared/useDebounced';

const PAGE_SIZE = 20;
const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
] as const;

function ColourDots({ colours }: { colours: AdminProductRow['colours'] }) {
  return (
    <span className="inline-flex items-center">
      {colours.slice(0, 6).map((c, i) => (
        <i
          key={`${c.name}-${i}`}
          title={c.name}
          style={{ backgroundColor: c.hex }}
          className="-ml-1 inline-block h-3.5 w-3.5 rounded-full border-2 border-white shadow-[0_0_0_1px_#e6dccb] first:ml-0"
        />
      ))}
    </span>
  );
}

function ProductThumb({ product, className }: { product: AdminProductRow; className: string }) {
  return (
    <div className={className}>
      {product.cover ? <MediaThumb media={product.cover} alt="" sizes="120px" /> : <div className="grid h-full place-items-center bg-sand-200 text-ink-mute"><Icon name="img" /></div>}
    </div>
  );
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }, (_, i) => (
        <Tr key={i}>
          <Td colSpan={8}>
            <div className="flex items-center gap-3">
              <Skeleton className="h-14 w-11 rounded-t-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </Td>
        </Tr>
      ))}
    </>
  );
}

/** The product catalogue database: search, filter, open, and quickly publish or unpublish. */
export function ProductList() {
  const router = useRouter();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [collectionId, setCollectionId] = useState('');
  const [view, setView] = useState<'table' | 'grid'>('table');
  const [page, setPage] = useState(1);
  const q = useDebounced(search.trim());

  const categories = useListTaxonomyQuery('categories');
  const collections = useListTaxonomyQuery('collections');
  const { data, isLoading, isFetching, isError, error, refetch } = useListProductsQuery({
    page,
    limit: PAGE_SIZE,
    ...(q ? { q } : {}),
    ...(status ? { status: status as 'draft' | 'published' | 'archived' } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(collectionId ? { collectionId } : {}),
  });
  const [setProductStatus, { originalArgs, isLoading: changing }] = useSetProductStatusMutation();

  const reset = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setPage(1);
  };

  async function quickToggle(product: AdminProductRow) {
    const action = product.status === 'published' ? 'unpublish' : 'publish';
    try {
      await setProductStatus({ id: product.id, action }).unwrap();
      toast(action === 'publish' ? `“${product.name}” is now live` : `“${product.name}” was unpublished`);
    } catch (err) {
      // Publishing is blocked until the checklist passes; say so and take the owner to the editor.
      toast(errorMessage(err), 'error');
      if (action === 'publish') router.push(`/admin/products/${product.id}`);
    }
  }

  const items = data?.items ?? [];
  const busyId = changing ? (originalArgs as { id: string } | undefined)?.id : undefined;

  return (
    <>
      <PageHeader
        title="Products"
        description="The catalogue database. Everything here is what the website shows: add it once and it appears on cards, product pages, filters and enquiries."
        actions={
          <ButtonLink href="/admin/products/new" variant="primary">
            <Icon name="plus" />
            Add product
          </ButtonLink>
        }
      />

      <Card className="mb-3.5">
        <div className="flex flex-wrap items-center gap-2.5 p-3">
          <div className="relative w-full max-w-[300px]">
            <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" />
            <Input value={search} onChange={(e) => reset(setSearch)(e.target.value)} placeholder="Search name or code…" aria-label="Search products" className="pl-10" />
          </div>
          <Select value={categoryId} onChange={(e) => reset(setCategoryId)(e.target.value)} aria-label="Category" className="!w-auto">
            <option value="">All categories</option>
            {categories.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select value={collectionId} onChange={(e) => reset(setCollectionId)(e.target.value)} aria-label="Collection" className="!w-auto">
            <option value="">All collections</option>
            {collections.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select value={status} onChange={(e) => reset(setStatus)(e.target.value)} aria-label="Status" className="!w-auto">
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <span className="text-[12.5px] text-ink-soft" aria-live="polite">
            {data ? `${data.meta.total} product${data.meta.total === 1 ? '' : 's'}` : ''}
          </span>
          <div className="grow" />
          <Segmented
            label="View"
            value={view}
            onChange={setView}
            options={[
              { value: 'table', label: 'Table', icon: 'list' },
              { value: 'grid', label: 'Grid', icon: 'img' },
            ]}
          />
        </div>
      </Card>

      {isError ? (
        <Card>
          <QueryError error={error} onRetry={refetch} />
        </Card>
      ) : view === 'table' ? (
        <Card className={isFetching && !isLoading ? 'opacity-70 transition-opacity' : undefined}>
          <Table>
            <THead>
              <tr>
                <Th>Product</Th>
                <Th className="max-[900px]:hidden">Category</Th>
                <Th className="max-[900px]:hidden">Collection</Th>
                <Th>Colours</Th>
                <Th className="max-[900px]:hidden">MOQ · Pack</Th>
                <Th>Status</Th>
                <Th>Enquiries</Th>
                <Th className="max-[900px]:hidden">Updated</Th>
                <Th>
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </THead>
            <TBody>
              {isLoading ? (
                <TableSkeleton />
              ) : (
                items.map((p) => (
                  <Tr key={p.id} onActivate={() => router.push(`/admin/products/${p.id}`)}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <ProductThumb product={p} className="h-14 w-11 flex-none overflow-hidden rounded-t-full rounded-b-md border-2 border-white shadow-[0_0_0_1px_#e6dccb]" />
                        <div>
                          <div className="font-semibold">{p.name}</div>
                          <div className="text-[12.5px] text-ink-soft">
                            <span className="font-semibold tabular-nums">{p.code}</span>
                            {p.badge && ` · ${p.badge}`}
                          </div>
                        </div>
                      </div>
                    </Td>
                    <Td className="max-[900px]:hidden">{p.category ?? '—'}</Td>
                    <Td className="max-[900px]:hidden">{p.collection ?? '—'}</Td>
                    <Td>
                      <ColourDots colours={p.colours} />
                      <div className="mt-0.5 text-[11.5px] text-ink-mute">
                        {p.colours.length} colour{p.colours.length === 1 ? '' : 's'} · {p.sizeCount} size{p.sizeCount === 1 ? '' : 's'}
                      </div>
                    </Td>
                    <Td className="max-[900px]:hidden">
                      <b>{p.moq}</b> <span className="text-[12.5px] text-ink-soft">· {p.packText || '—'}</span>
                    </Td>
                    <Td>
                      <Badge tone={p.status}>{p.status[0]!.toUpperCase() + p.status.slice(1)}</Badge>
                    </Td>
                    <Td>
                      <b>{p.enquiryCount}</b>
                    </Td>
                    <Td className="text-[12.5px] text-ink-soft max-[900px]:hidden">{timeAgo(p.updatedAt)}</Td>
                    <Td className="text-right" onClick={(e) => e.stopPropagation()}>
                      {p.status !== 'archived' && (
                        <Button size="sm" variant={p.status === 'published' ? 'secondary' : 'ok'} disabled={busyId === p.id} onClick={() => quickToggle(p)}>
                          {p.status === 'published' ? 'Unpublish' : 'Publish'}
                        </Button>
                      )}
                    </Td>
                  </Tr>
                ))
              )}
            </TBody>
          </Table>
          {!isLoading && items.length === 0 && (
            <EmptyState title="No products match these filters">
              <Link href="/admin/products/new" className="underline">
                Add a product
              </Link>{' '}
              or change the filters above.
            </EmptyState>
          )}
          {data && <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} limit={data.meta.limit} onChange={setPage} />}
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-4">
            {isLoading
              ? Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-72 rounded-card" />)
              : items.map((p) => (
                  <Link key={p.id} href={`/admin/products/${p.id}`} className="group overflow-hidden rounded-card border border-admin-line bg-white shadow-card transition hover:-translate-y-[3px]">
                    <div className="relative aspect-[3/4] bg-sand-200">
                      <ProductThumb product={p} className="h-full w-full" />
                      <Badge tone={p.status} className="absolute left-2.5 top-2.5 bg-white">
                        {p.status[0]!.toUpperCase() + p.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="px-3.5 py-3">
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-[12.5px] text-ink-soft">
                        {p.category ?? 'No category'} · MOQ {p.moq}
                      </div>
                      <div className="mt-1.5 flex items-center justify-between">
                        <ColourDots colours={p.colours} />
                        <span className="text-[13px]">
                          <b>{p.enquiryCount}</b> <span className="text-ink-soft">enq.</span>
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
          </div>
          {!isLoading && items.length === 0 && <EmptyState title="No products match these filters" />}
          {data && (
            <Card className="mt-4">
              <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} limit={data.meta.limit} onChange={setPage} />
            </Card>
          )}
        </>
      )}
    </>
  );
}
