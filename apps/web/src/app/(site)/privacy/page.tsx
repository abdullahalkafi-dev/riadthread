import { TextPage, textPageMetadata } from '@/components/site/TextPage';

export const generateMetadata = () => textPageMetadata('privacy', '/privacy');

export default function PrivacyPage() {
  return <TextPage pageKey="privacy" />;
}
