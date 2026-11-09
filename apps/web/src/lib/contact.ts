import type { PublicSettings } from '@/types/api';

const digits = (value: string) => value.replace(/\D/g, '');

/**
 * wa.me link for the business WhatsApp number. With a product it uses the
 * template from Settings ("... about {product} ({code})"); without one it sends
 * a general greeting. Returns null when no number is configured, so callers can
 * hide the button instead of linking nowhere.
 */
export function whatsappLink(
  settings: Pick<PublicSettings, 'whatsapp' | 'business'>,
  product?: { name: string; code: string },
): string | null {
  const number = digits(settings.whatsapp.number);
  if (!number) return null;
  const text = product
    ? settings.whatsapp.template.replace('{product}', product.name).replace('{code}', product.code)
    : `Hi ${settings.business.name}, I'd like to ask about your wholesale range`;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

/** tel: link for the phone number, or null when it is empty. */
export function telLink(phone: string): string | null {
  const number = phone.replace(/[^\d+]/g, '');
  return number ? `tel:${number}` : null;
}
