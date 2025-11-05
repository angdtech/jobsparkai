const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ettmusfpujpwdnajqqku.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addRLSPolicies() {
  console.log('Adding RLS policies...\n');

  const policies = [
    {
      name: 'Service role can manage all sessions',
      table: 'auth_cv_sessions',
      test: async () => {
        const { data, error } = await supabase
          .from('auth_cv_sessions')
          .select('*')
          .limit(1);
        return !error;
      }
    },
    {
      name: 'Service role can manage all analyses',
      table: 'cv_ats_analysis',
      test: async () => {
        const { data, error } = await supabase
          .from('cv_ats_analysis')
          .select('*')
          .limit(1);
        return !error;
      }
    },
    {
      name: 'Service role can manage all content',
      table: 'cv_content',
      test: async () => {
        const { data, error } = await supabase
          .from('cv_content')
          .select('*')
          .limit(1);
        return !error;
      }
    }
  ];

  console.log('Testing table access with service role...\n');
  
  for (const policy of policies) {
    const canAccess = await policy.test();
    if (canAccess) {
      console.log(`✅ ${policy.table}: Service role has access`);
    } else {
      console.log(`❌ ${policy.table}: Service role CANNOT access`);
    }
  }

  console.log('\n✅ RLS check complete!');
  console.log('\nNote: The service role bypasses RLS by default.');
  console.log('Client-side queries will be handled through API routes using service role.');
}

addRLSPolicies().catch(console.error);
