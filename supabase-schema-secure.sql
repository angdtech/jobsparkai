-- Create CV sessions table
CREATE TABLE public.auth_cv_sessions (
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

-- Enable RLS
ALTER TABLE public.auth_cv_sessions ENABLE ROW LEVEL SECURITY;

-- Allow service role (API routes) to manage all sessions
CREATE POLICY "Service role can manage all sessions" ON public.auth_cv_sessions
    FOR ALL USING (true);

-- Create CV ATS analysis table
CREATE TABLE public.cv_ats_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    auth_user_id UUID,
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.cv_ats_analysis ENABLE ROW LEVEL SECURITY;

-- Allow service role (API routes) to manage all analyses
CREATE POLICY "Service role can manage all analyses" ON public.cv_ats_analysis
    FOR ALL USING (true);

-- Create CV content sections table
CREATE TABLE public.cv_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    auth_user_id UUID,
    
    -- Personal Information
    full_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    location VARCHAR(255),
    linkedin_url VARCHAR(500),
    website_url VARCHAR(500),
    
    -- Professional Summary
    professional_summary TEXT,
    
    -- Work Experience (JSON array)
    work_experience JSONB DEFAULT '[]',
    
    -- Education (JSON array)
    education JSONB DEFAULT '[]',
    
    -- Skills (JSON array)
    skills JSONB DEFAULT '[]',
    
    -- Additional sections
    certifications JSONB DEFAULT '[]',
    languages JSONB DEFAULT '[]',
    projects JSONB DEFAULT '[]',
    achievements JSONB DEFAULT '[]',
    
    -- Metadata
    extracted_from_file VARCHAR(500),
    extraction_method VARCHAR(100) DEFAULT 'openai',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.cv_content ENABLE ROW LEVEL SECURITY;

-- Allow service role (API routes) to manage all content
CREATE POLICY "Service role can manage all content" ON public.cv_content
    FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_auth_cv_sessions_session_id ON public.auth_cv_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_cv_ats_analysis_session_id ON public.cv_ats_analysis(session_id);
CREATE INDEX IF NOT EXISTS idx_cv_content_session_id ON public.cv_content(session_id);
