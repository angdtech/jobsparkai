import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔧 Connecting to Supabase...')

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
})

async function createTables() {
  console.log('📋 Reading schema file...')
  const schema = fs.readFileSync('supabase-schema.sql', 'utf-8')
  
  console.log('🚀 Creating tables in Supabase using REST API...\n')
  
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        query: schema
      })
    })
    
    const result = await response.text()
    console.log('Response:', response.status, result)
    
    if (!response.ok) {
      console.error('❌ Failed to execute SQL')
      console.log('\n📝 You need to apply the schema manually:')
      console.log('1. Go to: https://supabase.com/dashboard/project/ettmusfpujpwdnajqqku/sql/new')
      console.log('2. Copy the contents of supabase-schema.sql')
      console.log('3. Paste and click "Run"')
      process.exit(1)
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message)
    console.log('\n📝 Manual schema application required:')
    console.log('1. Go to: https://supabase.com/dashboard/project/ettmusfpujpwdnajqqku/sql/new')
    console.log('2. Copy the contents of supabase-schema.sql')
    console.log('3. Paste and click "Run"')
    process.exit(1)
  }
  
  console.log('\n🔍 Verifying tables...\n')
  
  const tables = ['profiles', 'auth_cv_sessions', 'cv_ats_analysis', 'cv_content']
  
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1)
    
    if (error) {
      console.log(`❌ ${table}: ${error.message}`)
    } else {
      console.log(`✅ ${table}: EXISTS`)
    }
  }
  
  process.exit(0)
}

createTables().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
