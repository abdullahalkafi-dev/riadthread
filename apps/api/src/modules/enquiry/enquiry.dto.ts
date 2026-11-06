import type { EnquiryDoc } from './enquiry.model';

export function toListDto(e: EnquiryDoc) {
  return {
    id: String(e._id),
    ref: e.ref,
    kind: e.kind,
    contact: { name: e.contact.name, business: e.contact.business ?? '', city: e.contact.city ?? '', email: e.contact.email, phone: e.contact.phone ?? '' },
    status: e.status,
    unread: e.unread,
    score: { level: e.score?.level ?? 'cold', factors: e.score?.factors ?? [] },
    itemCount: e.itemCount ?? 0,
    qtyTotal: e.qtyTotal ?? 0,
    thumbs: e.thumbs ?? [],
    source: e.source?.channel ?? null,
    followUpAt: e.followUpAt ?? null,
    confirmedAt: e.confirmedAt ?? null,
    emailState: e.email,
    createdAt: e.createdAt,
  };
}

export function toDetailDto(e: EnquiryDoc) {
  return {
    ...toListDto(e),
    message: e.message ?? '',
    contact: { ...toListDto(e).contact, type: e.contact.type ?? '', website: e.contact.website ?? '' },
    preferredContact: e.preferredContact ?? null,
    deliveryBy: e.deliveryBy ?? null,
    estimatedQty: e.estimatedQty ?? null,
    entryPoint: e.entryPoint ?? null,
    pageUrl: e.pageUrl ?? null,
    items: e.items.map((i) => ({
      productId: String(i.productId),
      name: i.name,
      code: i.code,
      slug: i.slug,
      colour: i.colour ?? null,
      sizes: i.sizes ?? [],
      qty: i.qty,
      thumb: i.thumb ?? null,
    })),
    // null means the visitor did not accept tracking: the dashboard shows "journey unavailable".
    journey: e.consent?.analytics && e.journey?.length ? e.journey : null,
    trackingAccepted: !!e.consent?.analytics,
    sourceDetail: e.source ?? null,
    notes: (e.notes ?? []).map((n) => ({ id: String((n as { _id?: unknown })._id), text: n.text, author: n.authorName ?? 'Admin', at: n.at })),
    activity: e.activity ?? [],
  };
}
