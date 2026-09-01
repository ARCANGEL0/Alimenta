import AppSidebar from '@/src/components/layout/AppSidebar';
import AppTopbar from '@/src/components/layout/AppTopbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppTopbar />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
