import { createHash } from 'node:crypto';
import mongoose, { Types } from 'mongoose';
import type { CreateEnquiryInput, EnquiryStatus, LineSheetRequestInput } from '@riad/shared';
import { ENQUIRY_STATUS_LABELS } from '@riad/shared';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { CACHE_TAGS, invalidate } from '../../lib/cache';
import { verifyTurnstile } from '../../lib/turnstile';
import { AppError } from '../../utils/AppError';
import { csvCell, escapeRegex } from '../../utils/text';
import { loadMedia } from '../media/media.service';
import { enqueueOutbox } from '../notification/notification.service';
import { Outbox, type OutboxType } from '../notification/outbox.model';
import { Product, type ProductDoc } from '../product/product.model';
import { getSettings } from '../settings/settings.service';
import { User } from '../user/user.model';
import { nextEnquiryRef } from './counter.model';
import { toDetailDto, toListDto } from './enquiry.dto';
import { Enquiry, type EnquiryDoc } from './enquiry.model';
import { scoreLead } from './score';

/* ------------------------------------------------------------------ */
/* Submitting an enquiry (public)                                       */
/* ------------------------------------------------------------------ */

const hashPayload = (input: CreateEnquiryInput | LineSheetRequestInput) => {
  // Tracking and the captcha token can differ between retries; the request itself must not.
  const { tracking: _t, turnstileToken: _c, website_url: _h, ...stable } = input as Record<string, unknown>;
  void _t; void _c; void _h;
  return createHash('sha256').update(JSON.stringify(stable)).digest('hex');
};

/** Only the path of the page is kept: never a query string, token or tracking id. */
const cleanPath = (url?: string) => {
  if (!url) return undefined;
  try {
    return new URL(url, env.SITE_URL).pathname.slice(0, 300);
  } catch {
    return undefined;
  }
};

const HOSTS: Array<[RegExp, string]> = [
  [/instagram|l\.instagram/i, 'Instagram'],
  [/tiktok/i, 'TikTok'],
  [/facebook|fb\.com|l\.facebook/i, 'Facebook'],
  [/google|bing|duckduckgo/i, 'Search'],
  [/whatsapp|wa\.me/i, 'WhatsApp'],
];

/** A friendly source name: the UTM source if there is one, else the referring site. */
function channelOf(a?: { source?: string | undefined; referrerOrigin?: string | undefined }) {
  if (a?.source) return a.source.slice(0, 40).replace(/^./, (c) => c.toUpperCase());
  if (a?.referrerOrigin) return HOSTS.find(([re]) => re.test(a.referrerOrigin!))?.[1] ?? 'Referral';
  return 'Direct';
}

interface ResolvedItem {
  productId: Types.ObjectId;
  name: string;
  code: string;
  slug: string;
  colour?: string;
  sizes: Array<{ label: string; qty: number }>;
  qty: number;
  thumb?: string;
}

/**
 * Re-reads every product from the database. Names, codes and availability sent
 * by the browser are never trusted. Two queries however many items there are.
 */
async function resolveItems(items: CreateEnquiryInput['items']): Promise<ResolvedItem[]> {
  if (items.length === 0) return [];
  const ids = [...new Set(items.map((i) => i.productId))];
  const products = (await Product.find({ _id: { $in: ids }, status: 'published' }).lean()) as unknown as ProductDoc[];
  const byId = new Map(products.map((p) => [String(p._id), p]));
  const media = await loadMedia(products.map((p) => (p.media[0] ? String(p.media[0].mediaId) : null)));

  return items.map((item, index) => {
    const p = byId.get(item.productId);
    const path = (field: string) => `body.items.${index}.${field}`;
    if (!p) throw AppError.unprocessable('A product in your list is no longer available', [{ path: path('productId'), message: 'Unavailable' }]);

    let colour: string | undefined;
    if (item.colour) {
      const match = p.colours.find((c) => c.name.toLowerCase() === item.colour!.toLowerCase());
      if (!match) throw AppError.unprocessable(`${p.name} is not available in ${item.colour}`, [{ path: path('colour'), message: 'Unknown colour' }]);
      colour = match.name;
    }

    const sizes = item.sizes
      .filter((s) => s.qty > 0)
      .map((s) => {
        const size = p.sizes.find((x) => x.label === s.label);
        if (!size || !size.available) throw AppError.unprocessable(`${p.name} is not available in size ${s.label}`, [{ path: path('sizes'), message: 'Unavailable size' }]);
        return { label: size.label, qty: s.qty };
      });
    const qty = sizes.reduce((sum, s) => sum + s.qty, 0);
    if (p.wholesale.belowMoq === 'block' && qty > 0 && qty < p.wholesale.moq) {
      throw AppError.unprocessable(`${p.name} has a minimum order of ${p.wholesale.moq} units`, [{ path: path('sizes'), message: 'Below the minimum order' }]);
    }

    const cover = p.media[0] ? media.get(String(p.media[0].mediaId)) : undefined;
    const thumb = cover?.variants.find((v) => v.format === 'webp' && v.width === 320)?.url ?? cover?.url ?? undefined;
    return { productId: p._id, name: p.name, code: p.code, slug: p.slug, ...(colour ? { colour } : {}), sizes, qty, ...(thumb ? { thumb } : {}) };
  });
}

export interface SubmitResult {
  ref: string;
  /** True when this was a retry of an enquiry that had already been accepted. */
  duplicate: boolean;
}

function replay(existing: { ref: string; payloadHash: string }, hash: string): SubmitResult {
  // The same key with a different request is a client bug: never overwrite or merge.
  if (existing.payloadHash !== hash) throw AppError.conflict('This submission key was already used for a different enquiry');
  return { ref: existing.ref, duplicate: true };
}

/**
 * Saves the enquiry and its e-mail records in ONE transaction, and only then
 * reports success. Retries with the same submission key return the same
 * reference instead of creating a second enquiry.
 */
async function persist(doc: Record<string, unknown>, outboxTypes: OutboxType[], hash: string): Promise<SubmitResult> {
  const session = await mongoose.startSession();
  try {
    let result!: { ref: string; outboxIds: string[] };
    await session.withTransaction(async () => {
      const ref = await nextEnquiryRef(session);
      const [created] = await Enquiry.create([{ ...doc, ref, payloadHash: hash }], { session });
      const boxes = await Outbox.create(
        outboxTypes.map((type) => ({ type, enquiryId: created!._id })),
        { session, ordered: true },
      );
      result = { ref, outboxIds: boxes.map((b) => String(b._id)) };
    });

    // Queueing is best-effort here: the sweeper re-queues anything still pending.
    await Promise.allSettled(result.outboxIds.map((id) => enqueueOutbox(id)));
    await invalidate(CACHE_TAGS.overview);
    return { ref: result.ref, duplicate: false };
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      // Two identical requests raced: the loser returns the winner's reference.
      const existing = await Enquiry.findOne({ submissionKey: doc.submissionKey as string }).select('ref payloadHash').lean();
      if (existing) return replay(existing, hash);
    }
    throw err;
  } finally {
    await session.endSession();
  }
}

export async function submitEnquiry(input: CreateEnquiryInput, ctx: { ip?: string | undefined }): Promise<SubmitResult> {
  if (!(await verifyTurnstile(input.turnstileToken, ctx.ip))) {
    throw AppError.badRequest('We could not verify that you are not a robot. Please try again');
  }
  const hash = hashPayload(input);
  const existing = await Enquiry.findOne({ submissionKey: input.submissionKey }).select('ref payloadHash').lean();
  if (existing) return replay(existing, hash);

  const items = await resolveItems(input.items);
  const qtyTotal = items.reduce((n, i) => n + i.qty, 0);

  // Tracking is stored only when the visitor said yes.
  const tracked = input.tracking?.consent === true;
  const journey = tracked ? input.tracking?.journey : undefined;
  const score = scoreLead({
    itemCount: items.length,
    qtyTotal,
    estimatedQty: input.estimatedQty,
    businessType: input.contact.type,
    journey,
  });

  const settings = await getSettings();
  const types: OutboxType[] = ['enquiry.notification', ...(settings.notifications.sendConfirmation ? (['enquiry.confirmation'] as const) : [])];

  return persist(
    {
      submissionKey: input.submissionKey,
      kind: items.length > 0 ? 'product' : 'general',
      contact: input.contact,
      message: input.message,
      preferredContact: input.preferredContact,
      deliveryBy: input.deliveryBy,
      estimatedQty: input.estimatedQty,
      items,
      itemCount: items.length,
      qtyTotal,
      thumbs: items.map((i) => i.thumb).filter((t): t is string => !!t).slice(0, 3),
      entryPoint: input.entryPoint,
      pageUrl: cleanPath(input.pageUrl),
      ...(tracked
        ? {
            visitorId: input.tracking?.visitorId,
            sessionId: input.tracking?.sessionId,
            journey: journey?.map(({ t, m, k, at }) => ({ t, m, k, at })),
            source: { ...input.tracking?.attribution, channel: channelOf(input.tracking?.attribution) },
            consent: { analytics: true, policyVersion: input.tracking?.policyVersion },
          }
        : { source: { channel: 'Not tracked' }, consent: { analytics: false } }),
      score: { rule: score.rule, level: score.level, factors: score.factors },
      status: 'new',
      unread: true,
      activity: [{ type: 'created', text: 'Enquiry received', at: new Date() }],
      email: { confirmation: settings.notifications.sendConfirmation ? 'pending' : 'skipped', notification: 'pending' },
    },
    types,
    hash,
  );
}

/** "Email me the line sheet": becomes a lead, and the PDF link is e-mailed through the outbox. */
export async function submitLineSheetRequest(input: LineSheetRequestInput, ctx: { ip?: string | undefined }): Promise<SubmitResult> {
  const settings = await getSettings();
  if (!settings.lineSheet.enabled || !settings.lineSheet.mediaId) throw AppError.notFound('The line sheet is not available right now');
  if (!(await verifyTurnstile(input.turnstileToken, ctx.ip))) throw AppError.badRequest('We could not verify that you are not a robot. Please try again');

  const hash = hashPayload(input);
  const existing = await Enquiry.findOne({ submissionKey: input.submissionKey }).select('ref payloadHash').lean();
  if (existing) return replay(existing, hash);

  const tracked = input.tracking?.consent === true;
  return persist(
    {
      submissionKey: input.submissionKey,
      kind: 'line_sheet',
      contact: { name: input.name ?? 'Line sheet request', business: input.business ?? '', email: input.email },
      message: 'Requested the trade line sheet',
      entryPoint: 'line_sheet',
      items: [],
      itemCount: 0,
      qtyTotal: 0,
      thumbs: [],
      ...(tracked
        ? { visitorId: input.tracking?.visitorId, sessionId: input.tracking?.sessionId, source: { ...input.tracking?.attribution, channel: channelOf(input.tracking?.attribution) }, consent: { analytics: true } }
        : { source: { channel: 'Not tracked' }, consent: { analytics: false } }),
      score: { rule: 1, level: 'cold', factors: ['Asked for the line sheet'] },
      status: 'new',
      unread: true,
      activity: [{ type: 'created', text: 'Line sheet requested', at: new Date() }],
      email: { confirmation: 'pending', notification: 'pending' },
    },
    ['line_sheet.link', 'enquiry.notification'],
    hash,
  );
}

/* ------------------------------------------------------------------ */
/* Admin                                                                */
/* ------------------------------------------------------------------ */

export interface AdminQuery {
  status?: string | undefined;
  score?: string | undefined;
  productId?: string | undefined;
  q?: string | undefined;
  sort: 'newest' | 'oldest';
  page: number;
  limit: number;
}

function buildFilter(q: Omit<AdminQuery, 'page' | 'limit'>) {
  const filter: Record<string, unknown> = {};
  // Spam stays out of every list unless it is asked for.
  filter.status = q.status ?? { $ne: 'spam' };
  if (q.score) filter['score.level'] = q.score;
  if (q.productId) filter['items.productId'] = new Types.ObjectId(q.productId);
  if (q.q) {
    const re = new RegExp(escapeRegex(q.q), 'i');
    filter.$or = [{ ref: re }, { 'contact.business': re }, { 'contact.name': re }, { 'contact.email': re }, { 'contact.city': re }, { 'items.name': re }];
  }
  return filter;
}

/**
 * The enquiries table. Three queries in total (rows, total, status counts), and
 * every row already carries its item count, units and thumbnails, so nothing
 * is looked up per row.
 */
export async function adminList(q: AdminQuery) {
  const filter = buildFilter(q);
  const [docs, total, counts] = await Promise.all([
    Enquiry.find(filter)
      .select('-items -journey -notes -activity -message -payloadHash')
      .sort({ createdAt: q.sort === 'newest' ? -1 : 1 })
      .skip((q.page - 1) * q.limit)
      .limit(q.limit)
      .lean(),
    Enquiry.countDocuments(filter),
    Enquiry.aggregate<{ _id: string; n: number }>([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
  ]);
  const statusCounts = Object.fromEntries(counts.map((c) => [c._id, c.n]));
  return {
    items: (docs as unknown as EnquiryDoc[]).map(toListDto),
    total,
    statusCounts,
  };
}

export async function adminGet(id: string) {
  const doc = await Enquiry.findByIdAndUpdate(id, { $set: { unread: false } }, { returnDocument: 'after' }).lean();
  if (!doc) throw AppError.notFound('Enquiry not found');
  return toDetailDto(doc as unknown as EnquiryDoc);
}

async function mutate(id: string, update: Record<string, unknown>) {
  const doc = await Enquiry.findByIdAndUpdate(id, update, { returnDocument: 'after' }).lean();
  if (!doc) throw AppError.notFound('Enquiry not found');
  await invalidate(CACHE_TAGS.overview);
  return toDetailDto(doc as unknown as EnquiryDoc);
}

export const updateStatus = (id: string, status: EnquiryStatus) =>
  mutate(id, {
    // confirmedAt drives "confirmed this month", so later edits to the lead never move it.
    $set: { status, unread: false, confirmedAt: status === 'confirmed' ? new Date() : null },
    $push: { activity: { type: 'status', text: `Status changed to ${ENQUIRY_STATUS_LABELS[status]}`, at: new Date() } },
  });

export async function addNote(id: string, text: string, userId: string) {
  const user = await User.findById(userId).select('name').lean();
  return mutate(id, {
    $set: { unread: false },
    $push: {
      notes: { text, authorId: userId, authorName: user?.name ?? 'Admin', at: new Date() },
      activity: { type: 'note', text: 'Note added', at: new Date() },
    },
  });
}

export const setFollowUp = (id: string, followUpAt: Date | null) =>
  mutate(id, {
    $set: { followUpAt },
    $push: { activity: { type: 'follow_up', text: followUpAt ? `Follow-up set for ${followUpAt.toISOString().slice(0, 10)}` : 'Follow-up cleared', at: new Date() } },
  });

/** CSV for the owner. Cells starting with = + - @ are neutralised so a spreadsheet cannot run them. */
export async function exportCsv(q: Omit<AdminQuery, 'page' | 'limit'>): Promise<string> {
  const docs = (await Enquiry.find(buildFilter(q))
    .select('ref createdAt status score contact items qtyTotal source message')
    .sort({ createdAt: q.sort === 'newest' ? -1 : 1 })
    .limit(5000)
    .lean()) as unknown as EnquiryDoc[];
  const head = ['Reference', 'Date', 'Status', 'Lead score', 'Business', 'Name', 'Email', 'Phone', 'City', 'Products', 'Units', 'Source', 'Message'];
  const rows = docs.map((e) =>
    [
      e.ref,
      e.createdAt.toISOString().slice(0, 10),
      ENQUIRY_STATUS_LABELS[e.status as EnquiryStatus] ?? e.status,
      e.score?.level,
      e.contact.business,
      e.contact.name,
      e.contact.email,
      e.contact.phone,
      e.contact.city,
      e.items.map((i) => `${i.name}${i.colour ? ` (${i.colour})` : ''} x${i.qty}`).join('; '),
      e.qtyTotal,
      e.source?.channel,
      e.message,
    ]
      .map(csvCell)
      .join(','),
  );
  logger.info({ rows: rows.length }, 'Enquiries exported');
  return [head.map(csvCell).join(','), ...rows].join('\r\n');
}

