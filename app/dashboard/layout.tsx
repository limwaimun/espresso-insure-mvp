import DashboardSidebar from '@/components/DashboardSidebar';
import DashboardTopbar from '@/components/DashboardTopbar';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Redirect to login if not authenticated
  if (!user) {
    redirect('/login');
  }
  
  // Fetch user profile
  let profile: { name: string; plan: string } | null = null;
  try {
    const { data } = await supabase
      .from('profiles')
      .select('name, plan')
      .eq('id', user.id)
      .single();
    profile = data;
  } catch (error) {
    // Profile might not exist yet
    console.error('Profile fetch error:', error);
  }
  
  // Fetch real counts for sidebar badges
  const [conversationsCount, alertsCount, claimsCount] = await Promise.all([
    supabase.from('conversations').select('*', { count: 'exact', head: true }),
    supabase.from('alerts').select('*', { count: 'exact', head: true }).eq('resolved', false),
    supabase.from('alerts').select('*', { count: 'exact', head: true }).eq('type', 'claim'),
  ]);
  
  // Calculate renewals due in next 90 days (matching dashboard logic)
  const ninetyDaysFromNow = new Date();
  ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);
  
  const { data: allPoliciesForRenewals } = await supabase
    .from('policies')
    .select('renewal_date')
    .eq('ifa_id', user.id);
  
  const renewalsCount = {
    count: allPoliciesForRenewals?.filter((p: any) => {
      if (!p.renewal_date) return false;
      const renewalDate = new Date(p.renewal_date);
      const today = new Date();
      return renewalDate >= today && renewalDate <= ninetyDaysFromNow;
    }).length || 0
  };

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
        <DashboardSidebar 
          profile={profile || undefined} 
          counts={{
            conversations: conversationsCount.count || 0,
            alerts: alertsCount.count || 0,
            renewals: renewalsCount.count || 0,
            claims: claimsCount.count || 0,
          }}
        />
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
          <DashboardTopbar profile={profile} />
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