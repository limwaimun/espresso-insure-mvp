import { createClient } from '@/lib/supabase/server';

export default async function ConversationsPage() {
  const supabase = await createClient();

  const { data: conversations } = await supabase
    .from('conversations')
    .select('*, clients(name)')
    .order('last_message_at', { ascending: false });

  const total = conversations?.length || 0;
  const active = conversations?.filter(c => c.status === 'active').length || 0;
  const completed = conversations?.filter(c => c.status === 'completed').length || 0;
  const gaps = conversations?.reduce((sum, conv) => sum + (conv.gaps_identified || 0), 0) || 0;

  return (
    <div style={{ padding: '24px 28px', background: '#F7F4F0', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 22, fontWeight: 500, color: '#1A1410', margin: 0 }}>Conversations</h1>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Total', value: total },
          { label: 'Active', value: active, warn: active > 0 },
          { label: 'Completed', value: completed, green: true },
          { label: 'Gaps identified', value: gaps, danger: gaps > 0 },
        ].map(k => (
          <div key={k.label} style={{ background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#1A1410', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 24, fontWeight: 500, color: k.danger ? '#A32D2D' : k.green ? '#0F6E56' : k.warn ? '#854F0B' : '#1A1410', lineHeight: 1 }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Conversations list */}
      <div style={{ background: '#FFFFFF', border: '0.5px solid #E8E2DA', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '0.5px solid #E8E2DA' }}>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500, color: '#1A1410' }}>All conversations</span>
        </div>

        {!conversations || conversations.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, color: '#1A1410', fontWeight: 500, marginBottom: 8 }}>No conversations yet</div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#5F5A57', lineHeight: 1.6, maxWidth: 380, margin: '0 auto' }}>
              When clients message you on WhatsApp, conversations will appear here.
            </div>
          </div>
        ) : (
          conversations.map((conversation) => (
            <div
              key={conversation.id}
              style={{ padding: '14px 16px', borderBottom: '0.5px solid #E8E2DA', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
            >
              {/* Avatar */}
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                background: '#FEF3E2', border: '1px solid #FAC775',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#854F0B', fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600, flexShrink: 0,
              }}>
                {conversation.clients?.name?.charAt(0) || 'C'}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                  <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500, color: '#1A1410' }}>
                    {conversation.clients?.name || 'Client'}
                  </span>
                  <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#9B9088', flexShrink: 0 }}>
                    {conversation.last_message_at ? formatTimeAgo(conversation.last_message_at) : ''}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#5F5A57', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>
                    {conversation.last_message || 'No message yet'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    {conversation.gaps_identified && conversation.gaps_identified > 0 && (
                      <span style={{ background: '#FDECEA', color: '#A32D2D', fontSize: 10, fontWeight: 500, padding: '2px 7px', borderRadius: 100 }}>
                        {conversation.gaps_identified} gap{conversation.gaps_identified > 1 ? 's' : ''}
                      </span>
                    )}
                    <span style={{
                      background: conversation.status === 'active' ? '#E6F4F0' : '#F3F1EE',
                      color: conversation.status === 'active' ? '#0F6E56' : '#5F5A57',
                      fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 100,
                    }}>
                      {conversation.status || 'unknown'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;

  return date.toLocaleDateString('en-SG', { month: 'short', day: 'numeric' });
}
