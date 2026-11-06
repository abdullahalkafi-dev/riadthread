import mongoose from 'mongoose';

/**
 * Is this file used anywhere public? Uses the raw collections so media does
 * not have to import every other module (which would be circular).
 * Content blocks keep a flat "mediaRefs" array for exactly this question.
 */
export async function isMediaReferenced(id: string): Promise<boolean> {
  const _id = new mongoose.Types.ObjectId(id);
  const db = mongoose.connection;
  const checks = await Promise.all([
    db.collection('products').findOne({ $or: [{ 'media.mediaId': _id }, { 'colours.swatchMediaId': _id }] }, { projection: { _id: 1 } }),
    db.collection('categories').findOne({ imageMediaId: _id }, { projection: { _id: 1 } }),
    db.collection('collections').findOne({ imageMediaId: _id }, { projection: { _id: 1 } }),
    db.collection('contentblocks').findOne({ mediaRefs: _id }, { projection: { _id: 1 } }),
    db.collection('settings').findOne({ 'lineSheet.mediaId': _id }, { projection: { _id: 1 } }),
  ]);
  return checks.some(Boolean);
}
