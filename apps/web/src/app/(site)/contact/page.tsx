import Link from 'next/link';
import { TextPage, textPageMetadata } from '@/components/site/TextPage';
import { OPENING_HOURS } from '@/features/home/content';
import { telLink, whatsappLink } from '@/lib/contact';
import { getSite } from '@/lib/site-data';

export const generateMetadata = () => textPageMetadata('contact', '/contact');

/** The contact page: the text from the dashboard, then the business details from Settings. */
export default async function ContactPage() {
  const { settings } = await getSite();
  const { email, phone, address } = settings.business;
  const whatsapp = whatsappLink(settings);
  const tel = telLink(phone);

  const rows: Array<{ label: string; value: string; href?: string | null }> = [
    { label: 'Email', value: email, href: email ? `mailto:${email}` : null },
    { label: 'Phone', value: phone, href: tel },
    { label: 'Address', value: address },
    { label: 'Opening hours', value: OPENING_HOURS },
  ].filter((r) => r.value);

  return (
    <TextPage pageKey="contact">
      <dl className="mt-10 grid gap-px overflow-hidden rounded-2xl bg-sand-300 ring-1 ring-sand-300 sm:grid-cols-2">
        {rows.map((r) => (
          <div key={r.label} className="bg-sand-50 p-5">
            <dt className="text-[11px] uppercase tracking-[.18em] text-ink-soft">{r.label}</dt>
            <dd className="mt-1">
              {r.href ? (
                <a href={r.href} className="text-terracotta-600 underline underline-offset-4">
                  {r.value}
                </a>
              ) : (
                r.value
              )}
            </dd>
          </div>
        ))}
      </dl>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/enquiry" className="btn-terra rounded-full px-7 py-4 text-[15px]">
          Send a trade enquiry
        </Link>
        {whatsapp && (
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="btn-line rounded-full px-7 py-4 text-[15px]">
            Message us on WhatsApp
          </a>
        )}
      </div>
    </TextPage>
  );
}
