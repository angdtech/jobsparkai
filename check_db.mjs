import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkTables() {
  console.log('Checking Supabase tables...\n')
  
  const tables = ['profiles', 'auth_cv_sessions', 'cv_ats_analysis', 'cv_content']
  
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1)
    
    if (error) {
      console.log(`❌ ${table}: ${error.message}`)
    } else {
      const count = data ? data.length : 0
      console.log(`✅ ${table}: EXISTS (${count} rows checked)`)
    }
  }
  
  process.exit(0)
}

checkTables().catch(console.error)
