import Image from 'next/image';
import Link from 'next/link';
import { FOOTER_TEXT, OPENING_HOURS } from '@/features/home/content';
import { telLink, whatsappLink } from '@/lib/contact';
import type { PublicSettings, Taxonomy } from '@/types/api';
import { FacebookIcon, InstagramIcon, TikTokIcon, WhatsAppIcon } from './icons';
import { categoryHref, collectionHref, type NavCategory } from './nav';

interface Props {
  settings: PublicSettings;
  layout: string[];
  categories: NavCategory[];
  collections: Pick<Taxonomy, 'slug' | 'name'>[];
}

const social = 'grid h-10 w-10 place-items-center rounded-full ring-1 ring-sand-50/20 hover:bg-sand-50/10';
const heading = 'mb-4 text-[11px] uppercase tracking-[.25em] text-brass-300';

export function Footer({ settings, layout, categories, collections }: Props) {
  const { business, social: links } = settings;
  const whatsapp = whatsappLink(settings);
  const tel = telLink(business.phone);

  return (
    <footer className="relative overflow-hidden bg-majorelle-900 text-sand-200">
      <div className="zellige-strip" />
      <div className="star-bg absolute inset-0 top-[14px] opacity-[.04]" />
      <div className="relative mx-auto max-w-[1400px] px-4 pb-8 pt-16 sm:px-6 lg:px-10">
        <div className="grid gap-10 text-sm sm:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Image src="/brand/logo-light.png" alt={business.name} width={144} height={144} className="-ml-3 h-36 w-36" />
            <p className="mt-3 max-w-xs leading-relaxed text-sand-300">{FOOTER_TEXT}</p>
            <div className="mt-6 flex gap-2">
              {links.instagram && (
                <a href={links.instagram} target="_blank" rel="noopener noreferrer" className={social} aria-label="Instagram">
                  <InstagramIcon />
                </a>
              )}
              {links.facebook && (
                <a href={links.facebook} target="_blank" rel="noopener noreferrer" className={social} aria-label="Facebook">
                  <FacebookIcon />
                </a>
              )}
              {links.tiktok && (
                <a href={links.tiktok} target="_blank" rel="noopener noreferrer" className={social} aria-label="TikTok">
                  <TikTokIcon />
                </a>
              )}
              {whatsapp && (
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={social} aria-label="WhatsApp">
                  <WhatsAppIcon size={17} />
                </a>
              )}
            </div>
          </div>

          <nav aria-label="Collection" className="lg:col-span-2">
            <p className={heading}>Collection</p>
            <ul className="space-y-2.5">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link href={categoryHref(c.slug)} className="hover:text-sand-50">
                    {c.name}
                  </Link>
                </li>
              ))}
              {collections.map((c) => (
                <li key={c.slug}>
                  <Link href={collectionHref(c.slug)} className="hover:text-sand-50">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Trade" className="lg:col-span-2">
            <p className={heading}>Trade</p>
            <ul className="space-y-2.5">
              {layout.includes('steps') && (
                <li>
                  <Link href="/#process" className="hover:text-sand-50">
                    How it works
                  </Link>
                </li>
              )}
              {layout.includes('lineSheet') && (
                <li>
                  <Link href="/#linesheet" className="hover:text-sand-50">
                    Line sheet
                  </Link>
                </li>
              )}
              {layout.includes('lookbook') && (
                <li>
                  <Link href="/#lookbook" className="hover:text-sand-50">
                    Lookbook
                  </Link>
                </li>
              )}
              <li>
                <Link href="/about" className="hover:text-sand-50">
                  Our story
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-sand-50">
                  FAQ
                </Link>
              </li>
            </ul>
          </nav>

          <div className="lg:col-span-4">
            <p className={heading}>Contact</p>
            <ul className="space-y-2.5">
              {business.email && (
                <li>
                  <a href={`mailto:${business.email}`} className="hover:text-sand-50">
                    {business.email}
                  </a>
                </li>
              )}
              {business.phone && (
                <li>
                  {tel ? (
                    <a href={tel} className="hover:text-sand-50">
                      {business.phone}
                    </a>
                  ) : (
                    business.phone
                  )}
                  {whatsapp && ' · WhatsApp'}
                </li>
              )}
              {business.address && <li>{business.address}</li>}
              <li>{OPENING_HOURS}</li>
            </ul>
            <Link href="/enquiry" className="btn-brass mt-6 inline-flex rounded-full px-6 py-3 text-[14px]">
              Send a trade enquiry
            </Link>
          </div>
        </div>

        <p className="mt-16 font-display text-[18vw] leading-[.8] tracking-tight text-sand-50/95 lg:text-[13rem]" aria-hidden="true">
          {business.name}
        </p>
        <div className="mt-6 flex flex-col justify-between gap-2 text-xs text-sand-400 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {business.name} Ltd. Trade only.
          </p>
          <p className="flex gap-4">
            <Link href="/privacy" className="hover:text-sand-50">
              Privacy
            </Link>
            <Link href="/cookies" className="hover:text-sand-50">
              Cookies
            </Link>
            <Link href="/terms" className="hover:text-sand-50">
              Terms
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
