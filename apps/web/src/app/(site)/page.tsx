import type { Metadata } from 'next';
import { Fragment, type ReactNode } from 'react';
import { BrandFilm } from '@/features/home/sections/BrandFilm';
import { Craft } from '@/features/home/sections/Craft';
import { EnquirySection } from '@/features/home/sections/EnquirySection';
import { Faq } from '@/features/home/sections/Faq';
import { Heritage } from '@/features/home/sections/Heritage';
import { HeroCarousel, type HeroSlideView } from '@/features/home/sections/HeroCarousel';
import { LineSheetBand } from '@/features/home/sections/LineSheetBand';
import { Lookbook } from '@/features/home/sections/Lookbook';
import { RamadanBand } from '@/features/home/sections/RamadanBand';
import { ShopByCategory } from '@/features/home/sections/ShopByCategory';
import { Showcase } from '@/features/home/sections/Showcase';
import { Steps } from '@/features/home/sections/Steps';
import { Supply } from '@/features/home/sections/Supply';
import { TrustBar } from '@/features/home/sections/TrustBar';
import { serverEnv } from '@/lib/env';
import { getCategories, getCollections, getProducts, getSite } from '@/lib/site-data';
import type { Media, SitePayload } from '@/types/api';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getSite();
  const title = `${settings.business.name} | Moroccan wholesale for UK retailers`;
  const description =
    'Heritage-inspired, modern-designed Moroccan wear. Djellabas, gandoras, jabadors and prayer essentials for UK retailers: trade only, UK stock, 48h dispatch.';
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: '/' },
    openGraph: { title, description, url: '/', type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

const DEFAULT_SLIDE = {
  title: 'Moroccan craft, ready for your shelves',
  subtitle: 'Premium djellabas, gandoras and prayer essentials, wholesale for UK retailers.',
};

function heroSlides(site: SitePayload): HeroSlideView[] {
  const slides = site.blocks.hero?.slides ?? [];
  const source = slides.length > 0 ? slides : [{ ...DEFAULT_SLIDE, mediaId: null, cta: undefined }];
  return source.map((s) => ({
    title: s.title,
    subtitle: s.subtitle,
    image: s.mediaId ? (site.media[s.mediaId] ?? null) : null,
    href: s.cta?.href || '/collections',
    ctaText: s.cta?.text || 'Browse the collection',
  }));
}

/** Organization and WebSite structured data, so search engines can show the brand and a search box. */
function structuredData(site: SitePayload) {
  const { business, social } = site.settings;
  const url = serverEnv.siteUrl;
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: business.name,
      url,
      logo: `${url}/brand/logo.png`,
      ...(business.email ? { email: business.email } : {}),
      ...(business.phone ? { telephone: business.phone } : {}),
      sameAs: [social.instagram, social.facebook, social.tiktok].filter(Boolean),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: business.name,
      url,
      potentialAction: { '@type': 'SearchAction', target: `${url}/collections?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
    },
  ];
}

export default async function HomePage() {
  const [site, categories, collections, catalogue] = await Promise.all([
    getSite(),
    getCategories(),
    getCollections(),
    getProducts({ sort: 'order', limit: 24 }),
  ]);
  const { blocks, media, settings, layout } = site;
  const mediaById = (id: string | null | undefined): Media | null => (id ? (media[id] ?? null) : null);

  const homeCategories = categories.filter((c) => c.isActive && c.showOnHome);
  const sections: Record<string, ReactNode> = {
    hero: <HeroCarousel slides={heroSlides(site)} />,
    trust: blocks.trust && <TrustBar items={blocks.trust.items} />,
    shopByCategory: <ShopByCategory categories={homeCategories.length > 0 ? homeCategories : categories.filter((c) => c.isActive)} />,
    brandFilm: <BrandFilm data={blocks.brandFilm} video={mediaById(blocks.brandFilm?.mediaId)} poster={mediaById(blocks.brandFilm?.posterMediaId)} />,
    showcase: <Showcase products={catalogue.items} total={catalogue.total} collections={collections} />,
    heritage: <Heritage data={blocks.heritage} image={mediaById(blocks.heritage?.mediaId)} ribbon={catalogue.items} />,
    craft: <Craft data={blocks.craft} products={catalogue.items} />,
    lookbook: blocks.lookbook && (
      <Lookbook data={blocks.lookbook} images={blocks.lookbook.mediaIds.map(mediaById).filter((m): m is Media => m !== null)} />
    ),
    steps: blocks.steps && <Steps data={blocks.steps} settings={settings} />,
    supply: blocks.supply && <Supply data={blocks.supply} />,
    faq: blocks.faq && <Faq data={blocks.faq} settings={settings} />,
    lineSheet: <LineSheetBand />,
    enquiry: <EnquirySection settings={settings} />,
  };

  // The Ramadan band sits under the trust bar, or under the hero when the trust bar is hidden.
  const ramadanAfter = layout.includes('trust') ? 'trust' : 'hero';

  return (
    <>
      {structuredData(site).map((data, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />
      ))}
      {layout.map((key) => (
        <Fragment key={key}>
          {sections[key]}
          {key === ramadanAfter && blocks.ramadan && <RamadanBand data={blocks.ramadan} />}
        </Fragment>
      ))}
    </>
  );
}
