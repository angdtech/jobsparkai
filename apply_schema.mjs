import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function applySchema() {
  console.log('📋 Reading schema file...')
  const schema = fs.readFileSync('supabase-schema.sql', 'utf-8')
  
  console.log('🚀 Applying schema to Supabase...')
  console.log('⚠️  This will create tables, triggers, and RLS policies\n')
  
  const { error } = await supabase.rpc('exec_sql', { sql_query: schema })
  
  if (error) {
    console.error('❌ Error applying schema:', error.message)
    console.error('Details:', error)
    process.exit(1)
  }
  
  console.log('✅ Schema applied successfully\!')
  process.exit(0)
}

applySchema().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
