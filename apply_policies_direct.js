const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://ettmusfpujpwdnajqqku.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function executeSqlDirect(sql) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ query: sql })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`HTTP ${response.status}: ${body}`);
  }

  return response;
}

async function applyPolicies() {
  const policies = [
    `DROP POLICY IF EXISTS "Service role can manage all sessions" ON public.auth_cv_sessions`,
    `DROP POLICY IF EXISTS "Service role can manage all analyses" ON public.cv_ats_analysis`,
    `DROP POLICY IF EXISTS "Service role can manage all content" ON public.cv_content`,
    
    `CREATE POLICY "Users can view own sessions" ON public.auth_cv_sessions FOR SELECT USING (auth.uid() = auth_user_id)`,
    `CREATE POLICY "Users can insert own sessions" ON public.auth_cv_sessions FOR INSERT WITH CHECK (auth.uid() = auth_user_id)`,
    `CREATE POLICY "Users can update own sessions" ON public.auth_cv_sessions FOR UPDATE USING (auth.uid() = auth_user_id)`,
    `CREATE POLICY "Users can delete own sessions" ON public.auth_cv_sessions FOR DELETE USING (auth.uid() = auth_user_id)`,
    `CREATE POLICY "Service role full access sessions" ON public.auth_cv_sessions FOR ALL TO service_role USING (true) WITH CHECK (true)`,
    
    `CREATE POLICY "Users can view own analysis" ON public.cv_ats_analysis FOR SELECT USING (session_id IN (SELECT session_id FROM public.auth_cv_sessions WHERE auth_user_id = auth.uid()))`,
    `CREATE POLICY "Users can insert own analysis" ON public.cv_ats_analysis FOR INSERT WITH CHECK (session_id IN (SELECT session_id FROM public.auth_cv_sessions WHERE auth_user_id = auth.uid()))`,
    `CREATE POLICY "Service role full access analysis" ON public.cv_ats_analysis FOR ALL TO service_role USING (true) WITH CHECK (true)`,
    
    `CREATE POLICY "Users can view own content" ON public.cv_content FOR SELECT USING (session_id IN (SELECT session_id FROM public.auth_cv_sessions WHERE auth_user_id = auth.uid()))`,
    `CREATE POLICY "Users can insert own content" ON public.cv_content FOR INSERT WITH CHECK (session_id IN (SELECT session_id FROM public.auth_cv_sessions WHERE auth_user_id = auth.uid()))`,
    `CREATE POLICY "Users can update own content" ON public.cv_content FOR UPDATE USING (session_id IN (SELECT session_id FROM public.auth_cv_sessions WHERE auth_user_id = auth.uid()))`,
    `CREATE POLICY "Service role full access content" ON public.cv_content FOR ALL TO service_role USING (true) WITH CHECK (true)`
  ];

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  for (let i = 0; i < policies.length; i++) {
    const policy = policies[i];
    console.log(`\n[${i + 1}/${policies.length}] ${policy.substring(0, 60)}...`);
    
    try {
      const { error } = await supabase.rpc('exec', { query: policy });
      
      if (error) {
        console.error('  ❌ Error:', error.message);
      } else {
        console.log('  ✅ Success');
      }
    } catch (err) {
      console.error('  ❌ Exception:', err.message);
    }
  }

  console.log('\n✅ Done!');
}

applyPolicies().catch(console.error);
