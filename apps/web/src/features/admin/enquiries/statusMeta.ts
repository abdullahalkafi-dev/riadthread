import { ENQUIRY_STATUS_LABELS, type EnquiryStatus } from '@riad/shared';

/** Pipeline stages in the order a lead moves through them (spam is handled separately). */
export const PIPELINE: EnquiryStatus[] = ['new', 'contacted', 'discussion', 'quote', 'confirmed', 'lost'];

/** Colour of each stage in the funnel and board headers. */
export const STATUS_COLOUR: Record<EnquiryStatus, string> = {
  new: '#b9603f',
  contacted: '#3557d6',
  discussion: '#b08d47',
  quote: '#1f7a72',
  confirmed: '#0f6b3a',
  lost: '#9a8b78',
  spam: '#a3321f',
};

export const statusLabel = (status: EnquiryStatus) => ENQUIRY_STATUS_LABELS[status];

/** Link to the enquiries page with a given panel open. */
export const enquiryHref = (id: string) => `/admin/enquiries?open=${id}`;
