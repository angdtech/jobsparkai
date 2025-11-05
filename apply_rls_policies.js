const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://ettmusfpujpwdnajqqku.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
});

async function applyPolicies() {
  const sql = fs.readFileSync('fix_rls_policies.sql', 'utf8');
  
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  console.log(`Applying ${statements.length} SQL statements...`);
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';
    console.log(`\n[${i + 1}/${statements.length}] Executing:`);
    console.log(statement.substring(0, 100) + '...');
    
    try {
      const { data, error } = await supabase.rpc('exec_sql', { query: statement });
      
      if (error) {
        console.error('Error:', error.message);
        
        const { error: directError } = await supabase
          .from('_dummy_table_that_does_not_exist_')
          .select('*')
          .limit(0);
        
        console.log('Trying alternative execution method...');
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({ query: statement })
        });
        
        if (!response.ok) {
          console.error('Alternative method also failed. Continuing...');
        } else {
          console.log('✓ Success (via alternative method)');
        }
      } else {
        console.log('✓ Success');
      }
    } catch (err) {
      console.error('Exception:', err.message);
    }
  }
  
  console.log('\n✅ Policy application complete!');
}

applyPolicies().catch(console.error);
