import DashboardSidebar from '@/components/DashboardSidebar';
import DashboardTopbar from '@/components/DashboardTopbar';

export default function DashboardLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
    }}>
      {/* Sidebar — fixed 240px */}
      <aside style={{
        width: '240px',
        minWidth: '240px',
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        background: '#120A06',
        borderRight: '1px solid #2E1A0E',
        zIndex: 200,
        overflowY: 'auto',
      }}>
        <DashboardSidebar />
      </aside>

      {/* Main content — starts exactly where sidebar ends */}
      <main style={{
        marginLeft: '240px',
        flex: 1,
        minHeight: '100vh',
        background: '#1C0F0A',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Top Bar */}
        <div style={{
          borderBottom: '1px solid #2E1A0E',
          background: '#1C0F0A',
          padding: '20px 32px',
        }}>
          <DashboardTopbar />
        </div>
        
        {/* Page Content */}
        <div style={{
          flex: 1,
          padding: '24px',
          paddingBottom: '24px',
        }}>
          {children}
        </div>
      </main>
    </div>
  );
}