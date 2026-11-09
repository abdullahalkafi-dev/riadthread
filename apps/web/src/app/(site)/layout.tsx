import { Dock } from '@/components/site/Dock';
import { Footer } from '@/components/site/Footer';
import { Header } from '@/components/site/Header';
import { Intro } from '@/components/site/Intro';
import { MenuDrawer } from '@/components/site/MenuDrawer';
import { toNavCategory, mainLinks } from '@/components/site/nav';
import { Overlay } from '@/components/site/Overlay';
import { RevealObserver } from '@/components/site/RevealObserver';
import { Toast } from '@/components/site/Toast';
import { TopBar, type TickerMessage } from '@/components/site/TopBar';
import { TOP_BAR_MESSAGES } from '@/features/home/content';
import { SearchPanel } from '@/features/search/SearchPanel';
import { ConsentBanner } from '@/features/tracking/ConsentBanner';
import { Tracker } from '@/features/tracking/Tracker';
import { getCategories, getCollections, getSite } from '@/lib/site-data';
import { SiteProviders } from '@/store/site/SiteProviders';
import '@/styles/site.css';

/** The public site's frame: notice bar, header, footer and the panels every page shares. */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [site, categories, collections] = await Promise.all([getSite(), getCategories(), getCollections()]);
  const { settings, layout, blocks } = site;

  const navCategories = categories.filter((c) => c.isActive).map(toNavCategory);
  const navCollections = collections.filter((c) => c.isActive).map(({ slug, name }) => ({ slug, name }));
  const links = mainLinks(layout);

  const announcement = blocks.announcement;
  const messages: TickerMessage[] = [
    ...(announcement?.enabled && announcement.message ? [{ text: announcement.message, ...(announcement.href ? { href: announcement.href } : {}) }] : []),
    ...TOP_BAR_MESSAGES.map((text) => ({ text })),
  ];

  return (
    <SiteProviders>
      <noscript>
        <style>{'.reveal{opacity:1;transform:none}#intro{display:none}'}</style>
      </noscript>
      <Intro />
      <a
        href="#main"
        className="sr-only z-[110] rounded-full bg-ink px-4 py-2 text-sand-50 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      <TopBar messages={messages} settings={settings} />
      <Header links={links} categories={navCategories} collections={navCollections} settings={settings} />
      <main id="main">{children}</main>
      <Footer settings={settings} layout={layout} categories={navCategories} collections={navCollections} />

      <Overlay />
      <Dock settings={settings} />
      <Toast />
      <MenuDrawer links={links} categories={navCategories} collections={navCollections} settings={settings} />
      <SearchPanel suggestions={navCategories.slice(0, 4).map((c) => c.name)} />
      <ConsentBanner />
      <Tracker />
      <RevealObserver />
    </SiteProviders>
  );
}
