import { EmptyState, ScoreBadge, StatusPill, Table, TBody, Td, Th, THead, Thumbs, Tr } from '@/components/admin';
import { cn } from '@/lib/cn';
import { timeAgo } from '@/lib/admin-format';
import type { EnquiryRow } from '@/types/api';

interface EnquiryTableProps {
  rows: EnquiryRow[];
  onOpen: (id: string) => void;
}

const productsLine = (e: EnquiryRow) =>
  e.itemCount === 0 ? 'General enquiry' : `${e.itemCount} product${e.itemCount > 1 ? 's' : ''}`;

export function EnquiryTable({ rows, onOpen }: EnquiryTableProps) {
  if (rows.length === 0) return <EmptyState title="No enquiries match this filter">Try another status or clear the search.</EmptyState>;

  return (
    <Table>
      <THead>
        <tr>
          <Th>Retailer</Th>
          <Th>Products</Th>
          <Th className="max-[900px]:hidden">Qty</Th>
          <Th className="max-[900px]:hidden">Source</Th>
          <Th>Score</Th>
          <Th>Status</Th>
          <Th className="max-[640px]:hidden">Received</Th>
        </tr>
      </THead>
      <TBody>
        {rows.map((e) => (
          <Tr key={e.id} onActivate={() => onOpen(e.id)} aria-label={`Open enquiry ${e.ref}`}>
            <Td>
              <div className={cn('font-semibold', e.unread && 'before:mr-[7px] before:inline-block before:h-2 before:w-2 before:rounded-full before:bg-terracotta-500 before:content-[""]')}>
                {e.contact.business || e.contact.name}
              </div>
              <div className="text-[12.5px] text-ink-soft">
                {e.contact.name}
                {e.contact.city && ` · ${e.contact.city}`} · <span className="font-semibold tabular-nums">{e.ref}</span>
              </div>
            </Td>
            <Td>
              <div className="flex items-center gap-2.5">
                <Thumbs urls={e.thumbs} total={e.itemCount} />
                <span className="text-[12.5px] text-ink-soft max-[900px]:hidden">{productsLine(e)}</span>
              </div>
            </Td>
            <Td className="max-[900px]:hidden">
              <b>{e.qtyTotal}</b> <span className="text-[12.5px] text-ink-mute">units</span>
            </Td>
            <Td className="text-[12.5px] max-[900px]:hidden">{e.source ?? '—'}</Td>
            <Td>
              <ScoreBadge level={e.score.level} />
            </Td>
            <Td>
              <StatusPill status={e.status} />
            </Td>
            <Td className="text-[12.5px] text-ink-soft max-[640px]:hidden">{timeAgo(e.createdAt)}</Td>
          </Tr>
        ))}
      </TBody>
    </Table>
  );
}
