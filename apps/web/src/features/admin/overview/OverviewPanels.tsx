import Link from 'next/link';
import { Card, CardBody, CardHeader, EmptyState, ScoreBadge, StatusPill, Thumbs, ButtonLink } from '@/components/admin';
import { formatDate, timeAgo } from '@/lib/admin-format';
import type { Overview } from '@/types/api';
import { enquiryHref, PIPELINE, STATUS_COLOUR, statusLabel } from '../enquiries/statusMeta';

/** The pipeline as one proportional bar, with a legend that filters the enquiries list. */
export function PipelineCard({ counts }: { counts: Overview['counts'] }) {
  const total = PIPELINE.reduce((n, s) => n + (counts[s] ?? 0), 0);
  return (
    <Card>
      <CardHeader title="Pipeline" action={<span className="text-[12.5px] text-ink-soft">All open &amp; closed leads</span>} />
      <CardBody>
        {total === 0 ? (
          <EmptyState>No enquiries yet. They will appear here as soon as the first one arrives.</EmptyState>
        ) : (
          <div className="flex h-[46px] gap-[3px] overflow-hidden rounded-xl">
            {PIPELINE.filter((s) => counts[s]).map((s) => (
              <div
                key={s}
                title={statusLabel(s)}
                style={{ flex: counts[s], background: STATUS_COLOUR[s] }}
                className="grid min-w-[30px] place-items-center text-[13px] font-bold text-white transition-[flex] duration-500"
              >
                {counts[s]}
              </div>
            ))}
          </div>
        )}
        <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-[12.5px] text-ink-soft">
          {PIPELINE.map((s) => (
            <Link key={s} href={`/admin/enquiries?status=${s}`} className="hover:text-ink">
              <i className="mr-1.5 inline-block h-[9px] w-[9px] rounded-[3px]" style={{ background: STATUS_COLOUR[s] }} />
              {statusLabel(s)} · {counts[s] ?? 0}
            </Link>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

/** New enquiries and follow-ups that have come due. */
export function AttentionCard({ items }: { items: Overview['needsAttention'] }) {
  return (
    <Card>
      <CardHeader title="Needs attention" />
      <CardBody>
        {items.length === 0 ? (
          <EmptyState>All caught up.</EmptyState>
        ) : (
          items.slice(0, 5).map((e) => (
            <Link
              key={e.id}
              href={enquiryHref(e.id)}
              className="group flex items-center gap-3 border-b border-admin-line py-[11px] last:border-b-0"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold group-hover:underline">{e.contact.business || e.contact.name}</div>
                <div className="text-[12.5px] text-ink-soft">
                  {e.status === 'new' ? 'New · reply needed' : `Follow-up due ${e.followUpAt ? formatDate(e.followUpAt) : ''}`}
                </div>
              </div>
              <ScoreBadge level={e.score.level} />
            </Link>
          ))
        )}
      </CardBody>
    </Card>
  );
}

/** Enquiries per day for the last 14 days, as plain bars (no chart library needed). */
export function ActivityChart({ series }: { series: Overview['series'] }) {
  const max = Math.max(1, ...series.map((d) => d.count));
  const total = series.reduce((n, d) => n + d.count, 0);
  return (
    <Card>
      <CardHeader title="Enquiries · last 14 days" action={<span className="text-[12.5px] text-ink-soft">{total} total</span>} />
      <CardBody>
        <div className="flex h-[130px] items-end gap-1.5 pt-2" role="img" aria-label={`${total} enquiries in the last 14 days`}>
          {series.map((d) => (
            <div
              key={d.date}
              style={{ height: `${Math.max(4, (d.count / max) * 100)}%` }}
              className="group relative min-h-1 flex-1 rounded-t-md rounded-b-sm bg-gradient-to-b from-terracotta-300 to-terracotta-500"
            >
              <span className="pointer-events-none absolute bottom-full left-1/2 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-[7px] py-0.5 text-[11px] text-white group-hover:block">
                {formatDate(d.date)} · {d.count}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex justify-between text-[11px] text-ink-mute">
          <span>14 days ago</span>
          <span>Today</span>
        </div>
      </CardBody>
    </Card>
  );
}

export function TopProductsCard({ products }: { products: Overview['topProducts'] }) {
  const max = products[0]?.enquiries ?? 1;
  return (
    <Card>
      <CardHeader title="Most enquired products" />
      <CardBody>
        {products.length === 0 ? (
          <EmptyState>Products people ask about will rank here.</EmptyState>
        ) : (
          products.map((p) => (
            <div key={p.productId} className="flex items-center gap-3 py-[9px]">
              {p.thumb ? (
                // eslint-disable-next-line @next/next/no-img-element -- small stored thumbnail
                <img src={p.thumb} alt="" loading="lazy" className="h-12 w-[38px] flex-none rounded-[10px] border-2 border-white bg-sand-200 object-cover shadow-[0_0_0_1px_#e6dccb]" />
              ) : (
                <div className="h-12 w-[38px] flex-none rounded-[10px] bg-sand-200" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-2">
                  <b className="truncate font-semibold">{p.name}</b>
                  <span className="text-[12.5px] text-ink-soft">{p.enquiries}</span>
                </div>
                <div className="mt-[5px] h-1.5 overflow-hidden rounded-full bg-sand-200">
                  <i className="block h-full rounded-full bg-zellige-500" style={{ width: `${(p.enquiries / max) * 100}%` }} />
                </div>
              </div>
            </div>
          ))
        )}
      </CardBody>
    </Card>
  );
}

export function LatestCard({ items }: { items: Overview['latest'] }) {
  return (
    <Card>
      <CardHeader
        title="Latest enquiries"
        action={
          <ButtonLink href="/admin/enquiries" variant="ghost" size="sm">
            View all
          </ButtonLink>
        }
      />
      <CardBody className="pt-1.5">
        {items.length === 0 ? (
          <EmptyState>No enquiries yet.</EmptyState>
        ) : (
          items.slice(0, 5).map((e) => (
            <Link key={e.id} href={enquiryHref(e.id)} className="group flex items-center gap-3 border-b border-admin-line py-[11px] last:border-b-0">
              <Thumbs urls={e.thumbs} total={e.itemCount} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold group-hover:underline">
                  {e.contact.business || e.contact.name}
                  {e.contact.city && <span className="font-normal text-ink-mute"> · {e.contact.city}</span>}
                </div>
                <div className="text-[12.5px] text-ink-soft">
                  {e.itemCount > 0 ? `${e.itemCount} product${e.itemCount > 1 ? 's' : ''} · ${e.qtyTotal} units` : 'General enquiry'}
                </div>
              </div>
              <div className="max-sm:hidden">
                <ScoreBadge level={e.score.level} />
              </div>
              <StatusPill status={e.status} />
              <span className="w-20 text-right text-[12.5px] text-ink-mute max-sm:hidden">{timeAgo(e.createdAt)}</span>
            </Link>
          ))
        )}
      </CardBody>
    </Card>
  );
}
