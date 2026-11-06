import type { SettingsInput } from '@riad/shared';
import { cached, CACHE_TAGS, invalidate } from '../../lib/cache';
import { revalidateWeb } from '../../lib/revalidate';
import { DEFAULT_SETTINGS, Settings } from './settings.model';

type Plain = SettingsInput & { updatedAt?: Date };

async function load(): Promise<Plain> {
  const doc = await Settings.findOne({ key: 'main' }).lean();
  if (!doc) return { ...DEFAULT_SETTINGS };
  return {
    business: { ...DEFAULT_SETTINGS.business, ...doc.business },
    whatsapp: { ...DEFAULT_SETTINGS.whatsapp, ...doc.whatsapp },
    social: { ...DEFAULT_SETTINGS.social, ...doc.social },
    notifications: { ...DEFAULT_SETTINGS.notifications, ...doc.notifications },
    tracking: { ...DEFAULT_SETTINGS.tracking, ...doc.tracking },
    productDefaults: { ...DEFAULT_SETTINGS.productDefaults, ...doc.productDefaults },
    lineSheet: {
      enabled: doc.lineSheet?.enabled ?? false,
      mediaId: doc.lineSheet?.mediaId ? String(doc.lineSheet.mediaId) : null,
    },
    updatedAt: doc.updatedAt,
  } as Plain;
}

/** Cached for an hour; saving settings clears the cache immediately. */
export const getSettings = () => cached(CACHE_TAGS.site, 'settings', 3600, load);

export async function updateSettings(input: SettingsInput) {
  await Settings.findOneAndUpdate({ key: 'main' }, { $set: input }, { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true });
  await invalidate(CACHE_TAGS.site, CACHE_TAGS.catalog);
  void revalidateWeb(['site']);
  return load();
}

/** The subset that is safe to expose to every visitor. */
export function toPublicSettings(s: Plain) {
  return {
    business: s.business,
    whatsapp: s.whatsapp,
    social: s.social,
    tracking: s.tracking,
    productDefaults: s.productDefaults,
    lineSheetEnabled: s.lineSheet.enabled && !!s.lineSheet.mediaId,
  };
}
