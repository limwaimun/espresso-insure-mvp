const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log('=== Checking Supabase Data ===');
  
  try {
    // Check clients inserted in last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .gt('created_at', oneHourAgo);
    
    if (clientsError) {
      console.error('Error checking clients:', clientsError.message);
    } else {
      console.log(`1. Clients inserted in last hour: ${clients?.length || 0}`);
    }
    
    // Check policies inserted in last hour
    const { data: policies, error: policiesError } = await supabase
      .from('policies')
      .select('*', { count: 'exact', head: true })
      .gt('created_at', oneHourAgo);
    
    if (policiesError) {
      console.error('Error checking policies:', policiesError.message);
    } else {
      console.log(`2. Policies inserted in last hour: ${policies?.length || 0}`);
    }
    
    // Check policy columns by fetching a sample
    const { data: samplePolicy, error: sampleError } = await supabase
      .from('policies')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error('Error checking policy columns:', sampleError.message);
    } else if (samplePolicy && samplePolicy.length > 0) {
      const policy = samplePolicy[0];
      console.log('3. Policy columns check:');
      console.log(`   - policy_number: ${'policy_number' in policy ? 'EXISTS' : 'MISSING'}`);
      console.log(`   - sum_assured: ${'sum_assured' in policy ? 'EXISTS' : 'MISSING'}`);
      console.log(`   - premium_frequency: ${'premium_frequency' in policy ? 'EXISTS' : 'MISSING'}`);
      console.log(`   - start_date: ${'start_date' in policy ? 'EXISTS' : 'MISSING'}`);
      
      // Show sample values if they exist
      if ('policy_number' in policy) console.log(`     Sample policy_number: ${policy.policy_number}`);
      if ('sum_assured' in policy) console.log(`     Sample sum_assured: ${policy.sum_assured}`);
      if ('premium_frequency' in policy) console.log(`     Sample premium_frequency: ${policy.premium_frequency}`);
      if ('start_date' in policy) console.log(`     Sample start_date: ${policy.start_date}`);
    } else {
      console.log('3. No policies found to check columns');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
}

checkData();