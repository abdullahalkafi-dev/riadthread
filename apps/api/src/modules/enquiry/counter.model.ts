import { model, Schema, type ClientSession } from 'mongoose';

const counterSchema = new Schema({ _id: { type: String, required: true }, seq: { type: Number, default: 0 } });
const Counter = model('Counter', counterSchema);

/**
 * Next reference such as RT-2611-0042 (year, month, then a per-month counter).
 * The increment is atomic, so two enquiries can never share a number.
 */
export async function nextEnquiryRef(session?: ClientSession, now = new Date()): Promise<string> {
  const yymm = `${String(now.getUTCFullYear()).slice(2)}${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const counter = await Counter.findOneAndUpdate(
    { _id: `enquiry-${yymm}` },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after', ...(session ? { session } : {}) },
  );
  return `RT-${yymm}-${String(counter!.seq).padStart(4, '0')}`;
}
