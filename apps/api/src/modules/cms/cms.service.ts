import { Types } from 'mongoose';
import { CONTENT_BLOCK_KEYS, blockData, isBlockKey, isPageKey } from '@riad/shared';
import { cached, CACHE_TAGS, invalidate } from '../../lib/cache';
import { revalidateWeb } from '../../lib/revalidate';
import { cleanHtml } from '../../lib/sanitizeHtml';
import { AppError } from '../../utils/AppError';
import { loadMedia } from '../media/media.service';
import { getSettings, toPublicSettings } from '../settings/settings.service';
import { BLOCK_DEFAULTS, DEFAULT_LAYOUT, PAGE_DEFAULTS } from './cms.defaults';
import { ContentBlock } from './cms.model';

/** Collects every media id mentioned in a block ("mediaId", "posterMediaId", "mediaIds"). */
export function extractMediaIds(value: unknown, out = new Set<string>()): string[] {
  if (Array.isArray(value)) value.forEach((v) => extractMediaIds(v, out));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (/mediaid/i.test(k)) {
        for (const id of Array.isArray(v) ? v : [v]) if (typeof id === 'string' && /^[a-f\d]{24}$/i.test(id)) out.add(id);
      } else extractMediaIds(v, out);
    }
  }
  return [...out];
}

function assertBlock(key: string): asserts key is (typeof CONTENT_BLOCK_KEYS)[number] {
  if (!isBlockKey(key)) throw AppError.notFound(`Unknown content block "${key}"`);
}

/** Every block, with the stored value or the default. One query. */
export async function listBlocks() {
  const stored = await ContentBlock.find({ type: 'block' }).lean();
  const byKey = new Map(stored.map((b) => [b.key, b]));
  return CONTENT_BLOCK_KEYS.map((key) => {
    const doc = byKey.get(key);
    return { key, visible: doc?.visible ?? true, data: (doc?.data ?? BLOCK_DEFAULTS[key] ?? {}) as Record<string, unknown>, updatedAt: doc?.updatedAt ?? null };
  });
}

export async function saveBlock(key: string, input: { visible?: boolean | undefined; data: Record<string, unknown> }, userId: string) {
  assertBlock(key);
  const parsed = blockData[key].safeParse(input.data);
  if (!parsed.success) {
    throw AppError.badRequest(
      'Please check the highlighted fields',
      parsed.error.issues.map((i) => ({ path: ['data', ...i.path].join('.'), message: i.message })),
    );
  }
  const mediaRefs = extractMediaIds(parsed.data).map((id) => new Types.ObjectId(id));
  await ContentBlock.findOneAndUpdate(
    { type: 'block', key },
    { $set: { data: parsed.data, mediaRefs, updatedBy: userId, ...(input.visible !== undefined ? { visible: input.visible } : {}) } },
    { upsert: true, returnDocument: 'after' },
  );
  await afterChange();
  return (await listBlocks()).find((b) => b.key === key)!;
}

export async function getLayout(): Promise<Array<{ key: string; visible: boolean }>> {
  const doc = await ContentBlock.findOne({ type: 'layout', key: 'home' }).lean();
  const stored = (doc?.data as { sections?: Array<{ key: string; visible: boolean }> } | undefined)?.sections;
  if (!stored?.length) return DEFAULT_LAYOUT.map((s) => ({ ...s }));
  // Sections added in a later release are appended rather than silently missing.
  const known = new Set(stored.map((s) => s.key));
  return [...stored, ...DEFAULT_LAYOUT.filter((s) => !known.has(s.key))];
}

export async function saveLayout(sections: Array<{ key: string; visible: boolean }>, userId: string) {
  const valid = new Set<string>(DEFAULT_LAYOUT.map((s) => s.key));
  if (sections.some((s) => !valid.has(s.key))) throw AppError.badRequest('Unknown homepage section');
  await ContentBlock.findOneAndUpdate(
    { type: 'layout', key: 'home' },
    { $set: { data: { sections }, updatedBy: userId } },
    { upsert: true },
  );
  await afterChange();
  return getLayout();
}

export async function getPage(key: string) {
  if (!isPageKey(key)) throw AppError.notFound('Page not found');
  const doc = await ContentBlock.findOne({ type: 'page', key }).lean();
  const d = (doc?.data ?? {}) as Partial<{ title: string; bodyHtml: string; seoTitle: string; seoDescription: string }>;
  const def = PAGE_DEFAULTS[key]!;
  return {
    key,
    title: d.title ?? def.title,
    bodyHtml: d.bodyHtml ?? def.bodyHtml,
    seoTitle: d.seoTitle ?? '',
    seoDescription: d.seoDescription ?? '',
    updatedAt: doc?.updatedAt ?? null,
  };
}

export async function savePage(
  key: string,
  input: { title: string; bodyHtml: string; seoTitle: string; seoDescription: string },
  userId: string,
) {
  if (!isPageKey(key)) throw AppError.notFound('Page not found');
  const data = { ...input, bodyHtml: cleanHtml(input.bodyHtml) };
  await ContentBlock.findOneAndUpdate({ type: 'page', key }, { $set: { data, updatedBy: userId } }, { upsert: true });
  await invalidate(CACHE_TAGS.site);
  void revalidateWeb(['site', `page:${key}`]);
  return getPage(key);
}

async function afterChange() {
  await invalidate(CACHE_TAGS.site);
  void revalidateWeb(['site']);
}

/**
 * Everything the public site needs for the homepage and shell, in a handful of
 * queries regardless of how many sections exist: blocks (1), layout (1),
 * settings (1) and media (1), then cached.
 */
export const getSitePayload = () =>
  cached(CACHE_TAGS.site, 'payload', 3600, async () => {
    const [settings, blocks, layout] = await Promise.all([getSettings(), listBlocks(), getLayout()]);
    const visible = blocks.filter((b) => b.visible);
    const media = await loadMedia([
      ...visible.flatMap((b) => extractMediaIds(b.data)),
      settings.lineSheet.enabled ? settings.lineSheet.mediaId : null,
    ]);

    const lineSheet = settings.lineSheet.mediaId ? media.get(settings.lineSheet.mediaId) : undefined;
    return {
      settings: { ...toPublicSettings(settings), lineSheetUrl: settings.lineSheet.enabled ? (lineSheet?.url ?? null) : null },
      layout: layout.filter((s) => s.visible && (s.key !== 'lineSheet' || settings.lineSheet.enabled)).map((s) => s.key),
      blocks: Object.fromEntries(visible.map((b) => [b.key, b.data])),
      media: Object.fromEntries(media),
    };
  });
