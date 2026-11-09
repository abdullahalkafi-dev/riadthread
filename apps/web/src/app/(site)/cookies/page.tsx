import { TextPage, textPageMetadata } from '@/components/site/TextPage';

export const generateMetadata = () => textPageMetadata('cookies', '/cookies');

export default function CookiesPage() {
  return <TextPage pageKey="cookies" />;
}
