const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ettmusfpujpwdnajqqku.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Service key present:', !!supabaseServiceKey);

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
});

async function disableRLS() {
  console.log('\n⚠️  DISABLING RLS for development...\n');
  console.log('Note: You should enable proper RLS policies in production via Supabase dashboard.\n');

  const tables = ['auth_cv_sessions', 'cv_ats_analysis', 'cv_content'];

  for (const table of tables) {
    console.log(`Testing ${table}...`);
    
    const { data: before, error: beforeError } = await supabase
      .from(table)
      .select('count', { count: 'exact', head: true });
    
    if (beforeError) {
      console.log(`  ❌ Cannot access: ${beforeError.message}`);
      console.log(`  📝 Need to disable RLS via Supabase SQL Editor:`);
      console.log(`     ALTER TABLE public.${table} DISABLE ROW LEVEL SECURITY;`);
    } else {
      console.log(`  ✅ Can access with service role`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('MANUAL STEP REQUIRED:');
  console.log('='.repeat(70));
  console.log('\n1. Go to: https://supabase.com/dashboard/project/ettmusfpujpwdnajqqku/editor');
  console.log('2. Run these SQL commands:\n');
  console.log('ALTER TABLE public.auth_cv_sessions DISABLE ROW LEVEL SECURITY;');
  console.log('ALTER TABLE public.cv_ats_analysis DISABLE ROW LEVEL SECURITY;');
  console.log('ALTER TABLE public.cv_content DISABLE ROW LEVEL SECURITY;\n');
  console.log('='.repeat(70) + '\n');
}

disableRLS().catch(console.error);
