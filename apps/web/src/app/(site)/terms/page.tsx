import { TextPage, textPageMetadata } from '@/components/site/TextPage';

export const generateMetadata = () => textPageMetadata('terms', '/terms');

export default function TermsPage() {
  return <TextPage pageKey="terms" />;
}
