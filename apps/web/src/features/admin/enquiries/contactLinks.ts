/** Digits only, with a UK mobile like 07700 900142 turned into 447700900142 for wa.me. */
export function whatsappNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.startsWith('0')) return `44${digits.slice(1)}`;
  return digits;
}

export const whatsappLink = (phone: string, name: string, ref: string) =>
  `https://wa.me/${whatsappNumber(phone)}?text=${encodeURIComponent(`Hi ${name.split(' ')[0] ?? name}, this is Riad Threads about your enquiry ${ref}.`)}`;

export const telLink = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;
