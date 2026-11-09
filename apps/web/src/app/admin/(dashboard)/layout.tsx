import { AdminShell } from '@/features/admin/shell/AdminShell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
