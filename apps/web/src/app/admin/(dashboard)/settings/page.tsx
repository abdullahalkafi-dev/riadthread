import type { Metadata } from 'next';
import { SettingsScreen } from '@/features/admin/settings/SettingsScreen';

export const metadata: Metadata = { title: 'Settings' };

export default function SettingsPage() {
  return <SettingsScreen />;
}
