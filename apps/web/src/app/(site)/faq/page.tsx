import { TextPage, textPageMetadata } from '@/components/site/TextPage';

// The page is stored under the key "faq-page" so it never clashes with the home page FAQ block.
export const generateMetadata = () => textPageMetadata('faq-page', '/faq');

export default function FaqPage() {
  return <TextPage pageKey="faq-page" />;
}
