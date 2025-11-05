const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ettmusfpujpwdnajqqku.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRLSPolicies() {
  const tables = ['auth_cv_sessions', 'cv_ats_analysis', 'cv_content'];
  
  for (const table of tables) {
    console.log(`\n=== Checking RLS for ${table} ===`);
    
    const { data: policies, error } = await supabase
      .rpc('exec_sql', {
        query: `
          SELECT 
            tablename, 
            policyname, 
            permissive,
            roles,
            cmd,
            qual,
            with_check
          FROM pg_policies 
          WHERE tablename = '${table}';
        `
      });
    
    if (error) {
      console.log('Error fetching policies (trying alternate method):', error.message);
      
      const { data: tableInfo, error: tableError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (tableError) {
        console.log(`Table ${table}: Error - ${tableError.message}`);
        console.log('Error details:', tableError);
      } else {
        console.log(`Table ${table}: Accessible (but cannot read policies via RPC)`);
      }
    } else {
      console.log('Policies:', policies);
    }
  }
}

checkRLSPolicies();
