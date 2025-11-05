const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ettmusfpujpwdnajqqku.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTables() {
  const tables = ['auth_cv_sessions', 'cv_ats_analysis', 'cv_content'];
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
      if (error) {
        console.log(`Table ${table}: NOT EXISTS (${error.message})`);
      } else {
        console.log(`Table ${table}: EXISTS (${count} rows)`);
      }
    } catch (e) {
      console.log(`Table ${table}: ERROR - ${e.message}`);
    }
  }
}

checkTables();
