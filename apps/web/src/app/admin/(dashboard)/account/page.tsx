import type { Metadata } from 'next';
import { AccountScreen } from '@/features/admin/account/AccountScreen';

export const metadata: Metadata = { title: 'Account' };

export default function AccountPage() {
  return <AccountScreen />;
}
