const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://ettmusfpujpwdnajqqku.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTables() {
  console.log('Creating tables in Supabase...\n');

  const tables = [
    {
      name: 'auth_cv_sessions',
      sql: `
        CREATE TABLE IF NOT EXISTS public.auth_cv_sessions (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          session_id VARCHAR(255) UNIQUE NOT NULL,
          auth_user_id UUID,
          file_name VARCHAR(500),
          file_path VARCHAR(1000),
          file_size INTEGER,
          file_type VARCHAR(100),
          is_paid BOOLEAN DEFAULT FALSE,
          paid_at TIMESTAMP WITH TIME ZONE,
          payment_type VARCHAR(50),
          expires_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
        );
        
        ALTER TABLE public.auth_cv_sessions ENABLE ROW LEVEL SECURITY;
        
        CREATE INDEX IF NOT EXISTS idx_auth_cv_sessions_session_id ON public.auth_cv_sessions(session_id);
        CREATE INDEX IF NOT EXISTS idx_auth_cv_sessions_auth_user_id ON public.auth_cv_sessions(auth_user_id);
      `
    },
    {
      name: 'cv_ats_analysis',
      sql: `
        CREATE TABLE IF NOT EXISTS public.cv_ats_analysis (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          session_id VARCHAR(255) NOT NULL,
          auth_user_id UUID,
          user_id INTEGER,
          overall_score INTEGER DEFAULT 0,
          file_extension VARCHAR(10),
          file_format_score INTEGER DEFAULT 0,
          layout_score INTEGER DEFAULT 0,
          font_score INTEGER DEFAULT 0,
          content_structure_score INTEGER DEFAULT 0,
          rating VARCHAR(50) DEFAULT '',
          rating_color VARCHAR(50) DEFAULT '',
          issues JSONB DEFAULT '[]',
          recommendations JSONB DEFAULT '[]',
          strengths JSONB DEFAULT '[]',
          detailed_analysis JSONB DEFAULT '{}',
          text_length INTEGER DEFAULT 0,
          analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
        );
        
        ALTER TABLE public.cv_ats_analysis ENABLE ROW LEVEL SECURITY;
        
        CREATE INDEX IF NOT EXISTS idx_cv_ats_analysis_session_id ON public.cv_ats_analysis(session_id);
      `
    },
    {
      name: 'cv_content',
      sql: `
        CREATE TABLE IF NOT EXISTS public.cv_content (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          session_id VARCHAR(255) NOT NULL,
          auth_user_id UUID,
          full_name VARCHAR(255),
          email VARCHAR(255),
          phone VARCHAR(50),
          location VARCHAR(255),
          linkedin_url VARCHAR(500),
          website_url VARCHAR(500),
          professional_summary TEXT,
          work_experience JSONB DEFAULT '[]',
          education JSONB DEFAULT '[]',
          skills JSONB DEFAULT '[]',
          certifications JSONB DEFAULT '[]',
          languages JSONB DEFAULT '[]',
          projects JSONB DEFAULT '[]',
          achievements JSONB DEFAULT '[]',
          extracted_from_file VARCHAR(500),
          extraction_method VARCHAR(100) DEFAULT 'openai',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
        );
        
        ALTER TABLE public.cv_content ENABLE ROW LEVEL SECURITY;
        
        CREATE INDEX IF NOT EXISTS idx_cv_content_session_id ON public.cv_content(session_id);
      `
    }
  ];

  for (const table of tables) {
    console.log(`Creating table: ${table.name}`);
    
    const statements = table.sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    for (const statement of statements) {
      const { error } = await supabase.rpc('exec', { query: statement });
      
      if (error && !error.message.includes('already exists')) {
        console.error(`  ❌ Error: ${error.message}`);
      }
    }
    
    console.log(`  ✅ Table ${table.name} created/verified`);
  }

  console.log('\n✅ All tables created successfully!');
  console.log('\nVerifying tables exist...');
  
  for (const table of tables) {
    const { error } = await supabase.from(table.name).select('count', { count: 'exact', head: true });
    if (error) {
      console.log(`  ❌ ${table.name}: ${error.message}`);
    } else {
      console.log(`  ✅ ${table.name}: exists`);
    }
  }
}

createTables().catch(console.error);
