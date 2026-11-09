'use client';

import { useEffect, useState } from 'react';
import type { EnquiryStatus } from '@riad/shared';
import { Button, Card, Icon, Input, PageHeader, Pagination, QueryError, Segmented, Select, useToast } from '@/components/admin';
import { Skeleton } from '@/components/ui/Skeleton';
import { useListEnquiriesQuery, useUpdateStatusMutation } from '@/store/admin/enquiriesApi';
import { errorMessage } from '@/store/baseApi';
import type { EnquiryRow } from '@/types/api';
import { EnquiryPanel } from './detail/EnquiryPanel';
import { EnquiryBoard } from './EnquiryBoard';
import { EnquiryTable } from './EnquiryTable';
import { downloadEnquiriesCsv } from './exportCsv';
import { StatusChips } from './StatusChips';
import { statusLabel } from './statusMeta';
import { useEnquiryFilters } from './useEnquiryFilters';

const PAGE_SIZE = 20;
/** The board shows every stage at once, so it loads one large page instead of paging. */
const BOARD_LIMIT = 100;

function TableSkeleton() {
  return (
    <div className="space-y-3 p-4" aria-busy>
      {[0, 1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}

/** Search box that waits for a pause in typing before it changes the address. */
function SearchBox({ value, onCommit }: { value: string; onCommit: (q: string) => void }) {
  const [draft, setDraft] = useState(value);
  // Follow the address when it changes from elsewhere (the topbar search, back button).
  useEffect(() => setDraft(value), [value]);
  useEffect(() => {
    if (draft === value) return;
    const timer = setTimeout(() => onCommit(draft.trim()), 350);
    return () => clearTimeout(timer);
  }, [draft, value, onCommit]);

  return (
    <div className="relative min-w-[220px] max-w-[320px] flex-1">
      <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" />
      <Input
        type="search"
        aria-label="Search enquiries"
        placeholder="Business, name, reference, product…"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="!pl-[38px]"
      />
    </div>
  );
}

export function EnquiriesScreen() {
  const { filters, update } = useEnquiryFilters();
  const toast = useToast();
  const [exporting, setExporting] = useState(false);
  const [updateStatus] = useUpdateStatusMutation();

  const board = filters.view === 'board';
  const { data, error, isLoading, isFetching, refetch } = useListEnquiriesQuery(
    board
      ? { q: filters.q, score: filters.score, sort: filters.sort, page: 1, limit: BOARD_LIMIT }
      : { status: filters.status, q: filters.q, score: filters.score, sort: filters.sort, page: filters.page, limit: PAGE_SIZE },
  );

  async function exportCsv() {
    setExporting(true);
    try {
      await downloadEnquiriesCsv({ status: filters.status, score: filters.score, q: filters.q, sort: filters.sort });
      toast('CSV downloaded');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'The export could not be created', 'error');
    } finally {
      setExporting(false);
    }
  }

  async function move(row: EnquiryRow, status: EnquiryStatus) {
    try {
      await updateStatus({ id: row.id, status }).unwrap();
      toast(status === 'confirmed' ? `${row.contact.business || row.contact.name} confirmed` : `${row.ref} moved to ${statusLabel(status)}`);
    } catch (e) {
      toast(errorMessage(e, 'The status could not be changed'), 'error');
    }
  }

  const open = (id: string) => update({ open: id });

  return (
    <div>
      <PageHeader
        title="Enquiries"
        description="Retailers who asked about your products. Click a row for the full picture."
        actions={
          <>
            <Button size="sm" onClick={exportCsv} disabled={exporting}>
              <Icon name="down" />
              {exporting ? 'Preparing…' : 'Export CSV'}
            </Button>
            <Segmented
              label="View"
              value={filters.view}
              onChange={(view) => update({ view })}
              options={[
                { value: 'table', label: 'Table', icon: 'list' },
                { value: 'board', label: 'Board', icon: 'kanban' },
              ]}
            />
          </>
        }
      />

      <StatusChips active={board ? undefined : filters.status} counts={data?.statusCounts ?? {}} onChange={(status) => update({ status, view: 'table' })} />

      <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
        <SearchBox value={filters.q} onCommit={(q) => update({ q })} />
        <Select aria-label="Lead score" value={filters.score ?? ''} onChange={(e) => update({ score: e.target.value || undefined })} className="!w-auto">
          <option value="">Any score</option>
          <option value="hot">Hot</option>
          <option value="warm">Warm</option>
          <option value="cold">Cold</option>
        </Select>
        <Select aria-label="Sort" value={filters.sort} onChange={(e) => update({ sort: e.target.value })} className="!w-auto">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </Select>
        {isFetching && !isLoading && <span className="text-[12.5px] text-ink-mute">Updating…</span>}
      </div>

      {error && !data ? (
        <Card>
          <QueryError error={error} onRetry={refetch} />
        </Card>
      ) : board ? (
        isLoading || !data ? <TableSkeleton /> : <EnquiryBoard rows={data.items} onOpen={open} onMove={move} />
      ) : (
        <Card className="overflow-hidden">
          {isLoading || !data ? (
            <TableSkeleton />
          ) : (
            <>
              <EnquiryTable rows={data.items} onOpen={open} />
              <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} limit={data.meta.limit} onChange={(page) => update({ page })} />
            </>
          )}
        </Card>
      )}

      <EnquiryPanel id={filters.open} onClose={() => update({ open: undefined })} />
    </div>
  );
}
