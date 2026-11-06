import { ENQUIRY_STATUSES } from '@riad/shared';
import { cached, CACHE_TAGS } from '../../lib/cache';
import { Enquiry, type EnquiryDoc } from '../enquiry/enquiry.model';
import { toListDto } from '../enquiry/enquiry.dto';

const OPEN = ['new', 'contacted', 'discussion', 'quote'];
const TZ = 'Europe/London';

/**
 * Everything the Overview screen needs, in a fixed number of queries
 * (never one per row), cached for a minute.
 */
export const getOverview = () =>
  cached(CACHE_TAGS.overview, 'overview', 60, async () => {
    const now = new Date();
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 86_400_000);
    const endOfToday = new Date(now);
    endOfToday.setUTCHours(23, 59, 59, 999);

    const [byStatus, confirmedThisMonth, hotOpen, attention, latest, perDay, topProducts] = await Promise.all([
      Enquiry.aggregate<{ _id: string; n: number }>([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
      Enquiry.countDocuments({ status: 'confirmed', confirmedAt: { $gte: startOfMonth } }),
      Enquiry.countDocuments({ 'score.level': 'hot', status: { $in: OPEN } } as Record<string, unknown>),
      // New enquiries first, then anything whose follow-up date has arrived.
      Enquiry.find({ $or: [{ status: 'new' }, { status: { $in: OPEN }, followUpAt: { $lte: endOfToday } }] } as Record<string, unknown>)
        .select('ref contact status score followUpAt createdAt itemCount qtyTotal thumbs source unread kind email')
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
      Enquiry.find({ status: { $ne: 'spam' } })
        .select('ref contact status score followUpAt createdAt itemCount qtyTotal thumbs source unread kind email')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Enquiry.aggregate<{ _id: string; n: number }>([
        { $match: { createdAt: { $gte: fourteenDaysAgo }, status: { $ne: 'spam' } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: TZ } }, n: { $sum: 1 } } },
      ]),
      // Item names and thumbnails are frozen on the enquiry, so no product lookup is needed.
      Enquiry.aggregate<{ _id: string; name: string; thumb?: string; n: number }>([
        { $match: { status: { $ne: 'spam' }, createdAt: { $gte: new Date(now.getTime() - 90 * 86_400_000) } } },
        { $unwind: '$items' },
        { $group: { _id: '$items.productId', name: { $first: '$items.name' }, thumb: { $first: '$items.thumb' }, n: { $sum: 1 } } },
        { $sort: { n: -1 } },
        { $limit: 5 },
      ]),
    ]);

    const counts = Object.fromEntries(ENQUIRY_STATUSES.map((s) => [s, byStatus.find((b) => b._id === s)?.n ?? 0]));

    // A complete 14-day series, with zeros for quiet days.
    const series: Array<{ date: string; count: number }> = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86_400_000);
      const key = new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d);
      series.push({ date: key, count: perDay.find((p) => p._id === key)?.n ?? 0 });
    }

    return {
      generatedAt: now,
      counts,
      newCount: counts.new ?? 0,
      openLeads: OPEN.reduce((n, s) => n + (counts[s] ?? 0), 0),
      confirmedThisMonth,
      hotOpen,
      needsAttention: (attention as unknown as EnquiryDoc[]).map(toListDto),
      latest: (latest as unknown as EnquiryDoc[]).map(toListDto),
      series,
      topProducts: topProducts.map((p) => ({ productId: String(p._id), name: p.name, thumb: p.thumb ?? null, enquiries: p.n })),
    };
  });
