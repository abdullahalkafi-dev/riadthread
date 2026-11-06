import { escapeHtml as h } from '../../utils/text';

interface Item {
  name: string;
  code: string;
  colour?: string | null;
  sizes: Array<{ label: string; qty: number }>;
  qty: number;
}

export interface EnquiryMail {
  ref: string;
  business: string;
  name: string;
  email: string;
  phone?: string | null | undefined;
  city?: string | null | undefined;
  type?: string | null | undefined;
  message: string;
  items: Item[];
  qtyTotal: number;
  preferredContact?: string | null | undefined;
  deliveryBy?: string | null | undefined;
  source?: string | null | undefined;
  score?: string | undefined;
  dashboardUrl: string;
}

const shell = (title: string, body: string) => `<!doctype html><html><body style="margin:0;background:#f5efe4;font-family:Arial,Helvetica,sans-serif;color:#2b2119">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fffdf8;border-radius:12px;overflow:hidden">
<tr><td style="background:#18285f;color:#efdfb8;padding:20px 28px;font-size:20px;font-family:Georgia,serif">Riad Threads</td></tr>
<tr><td style="padding:28px"><h1 style="margin:0 0 16px;font-size:22px;font-family:Georgia,serif">${h(title)}</h1>${body}</td></tr>
<tr><td style="padding:16px 28px;background:#ece3d4;font-size:12px;color:#6b5d4f">Riad Threads &middot; wholesale for UK retailers</td></tr>
</table></td></tr></table></body></html>`;

const itemsTable = (items: Item[]) =>
  items.length
    ? `<table width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse;font-size:14px;margin:12px 0">${items
        .map(
          (i) =>
            `<tr style="border-bottom:1px solid #e6dccb"><td><strong>${h(i.name)}</strong><br><span style="color:#6b5d4f">${h(i.code)}${i.colour ? ` &middot; ${h(i.colour)}` : ''}${
              i.sizes.length ? ` &middot; ${i.sizes.map((s) => `${h(s.label)}&times;${s.qty}`).join(', ')}` : ''
            }</span></td><td align="right" style="white-space:nowrap">${i.qty ? `${i.qty} units` : ''}</td></tr>`,
        )
        .join('')}</table>`
    : '';

/** Sent to the retailer. It says the request was received, never that anything was dispatched. */
export function confirmationMail(e: EnquiryMail) {
  const subject = `We have received your enquiry (${e.ref})`;
  const html = shell(
    `Thank you, ${e.name.split(' ')[0] ?? e.name}`,
    `<p style="line-height:1.6">We have received your enquiry and will be in touch shortly with trade prices and delivery details.</p>
     <p style="margin:16px 0 4px;color:#6b5d4f;font-size:13px">Your reference</p>
     <p style="margin:0 0 16px;font-size:20px;font-weight:bold">${h(e.ref)}</p>
     ${itemsTable(e.items)}
     ${e.message ? `<p style="color:#6b5d4f;font-size:13px;margin:16px 0 4px">Your message</p><p style="line-height:1.6;margin:0">${h(e.message)}</p>` : ''}`,
  );
  const text = `Thank you, ${e.name}.\n\nWe have received your enquiry (${e.ref}) and will be in touch shortly.\n\n${e.items
    .map((i) => `- ${i.name} (${i.code})${i.qty ? ` ${i.qty} units` : ''}`)
    .join('\n')}`;
  return { subject, html, text };
}

/** Sent to the owner. */
export function notificationMail(e: EnquiryMail) {
  const subject = `New enquiry ${e.ref} from ${e.business}${e.score ? ` (${e.score})` : ''}`;
  const row = (k: string, v?: string | null) =>
    v ? `<tr><td style="color:#6b5d4f;padding:4px 16px 4px 0">${h(k)}</td><td>${h(v)}</td></tr>` : '';
  const html = shell(
    `New enquiry ${e.ref}`,
    `<table style="font-size:14px">${row('Business', e.business)}${row('Contact', e.name)}${row('Email', e.email)}${row('Phone', e.phone)}${row('City', e.city)}${row('Type', e.type)}${row('Prefers', e.preferredContact)}${row('Deliver by', e.deliveryBy)}${row('Source', e.source)}${row('Lead score', e.score)}</table>
     ${itemsTable(e.items)}
     ${e.qtyTotal ? `<p style="margin:0 0 12px"><strong>${e.qtyTotal} units</strong> in total</p>` : ''}
     ${e.message ? `<p style="line-height:1.6;background:#f5efe4;padding:12px;border-radius:8px">${h(e.message)}</p>` : ''}
     <p><a href="${h(e.dashboardUrl)}" style="display:inline-block;background:#b9603f;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">Open in the dashboard</a></p>`,
  );
  const text = `New enquiry ${e.ref} from ${e.business}\n${e.name} <${e.email}> ${e.phone ?? ''}\n\n${e.items
    .map((i) => `- ${i.name} (${i.code})${i.qty ? ` ${i.qty} units` : ''}`)
    .join('\n')}\n\n${e.message}\n\n${e.dashboardUrl}`;
  return { subject, html, text };
}

export function lineSheetMail(name: string, url: string) {
  const subject = 'Your Riad Threads trade line sheet';
  const html = shell(
    `Hello ${name}`,
    `<p style="line-height:1.6">Here is the trade line sheet you asked for.</p><p><a href="${h(url)}" style="display:inline-block;background:#b9603f;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">Open the line sheet</a></p>`,
  );
  return { subject, html, text: `Hello ${name},\n\nHere is your line sheet: ${url}` };
}
