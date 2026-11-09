import { TextPage, textPageMetadata } from '@/components/site/TextPage';

export const generateMetadata = () => textPageMetadata('about', '/about');

export default function AboutPage() {
  return <TextPage pageKey="about" />;
}
