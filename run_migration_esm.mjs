import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://zcqejeroailcmbltpzix.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjcWVqZXJvYWlsY21ibHRweml4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTM4OTMyMCwiZXhwIjoyMDkwOTY1MzIwfQ.Mr5k89HuuOUOXn4sI-wsZHjJPwBObdGUBcNRASpHlgw';

const supabase = createClient(supabaseUrl, serviceKey);
const sql = readFileSync('/tmp/brain_v4_migration.sql', 'utf8');

console.log(`SQL length: ${sql.length} chars`);

// Try GraphQL mutation for SQL
try {
  const gqlResponse = await fetch(`${supabaseUrl}/graphql/v1`, {
    method: 'POST',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `mutation { execute(sql: ${JSON.stringify(sql)}) }`
    })
  });
  console.log('GraphQL status:', gqlResponse.status);
  const gqlBody = await gqlResponse.text();
  console.log('Body:', gqlBody.substring(0, 500));
} catch (e) {
  console.log('GraphQL failed:', e.message);
}
