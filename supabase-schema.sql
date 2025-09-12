-- Enable RLS (Row Level Security)
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create profiles table to extend auth.users
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create RLS policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create user_sessions table for tracking active sessions
CREATE TABLE public.user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_address INET,
    user_agent TEXT
);

-- Enable RLS for user_sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own sessions
CREATE POLICY "Users can view own sessions" ON public.user_sessions
    FOR SELECT USING (auth.uid() = user_id);

-- Create CV sessions table
CREATE TABLE public.auth_cv_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name VARCHAR(500),
    file_path VARCHAR(1000),
    file_size INTEGER,
    file_type VARCHAR(100),
    is_paid BOOLEAN DEFAULT FALSE,
    paid_at TIMESTAMP WITH TIME ZONE,
    payment_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for auth_cv_sessions
ALTER TABLE public.auth_cv_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own CV sessions
CREATE POLICY "Users can view own CV sessions" ON public.auth_cv_sessions
    FOR SELECT USING (auth.uid() = auth_user_id);

-- Policy: Users can create their own CV sessions
CREATE POLICY "Users can create own CV sessions" ON public.auth_cv_sessions
    FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

-- Policy: Users can update their own CV sessions
CREATE POLICY "Users can update own CV sessions" ON public.auth_cv_sessions
    FOR UPDATE USING (auth.uid() = auth_user_id);

-- Policy: Users can delete their own CV sessions
CREATE POLICY "Users can delete own CV sessions" ON public.auth_cv_sessions
    FOR DELETE USING (auth.uid() = auth_user_id);

-- Create CV ATS analysis table
CREATE TABLE public.cv_ats_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Enable RLS for cv_ats_analysis
ALTER TABLE public.cv_ats_analysis ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own ATS analyses
CREATE POLICY "Users can view own ATS analyses" ON public.cv_ats_analysis
    FOR SELECT USING (auth.uid() = auth_user_id);

-- Policy: Users can create their own ATS analyses
CREATE POLICY "Users can create own ATS analyses" ON public.cv_ats_analysis
    FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

-- Policy: Users can update their own ATS analyses
CREATE POLICY "Users can update own ATS analyses" ON public.cv_ats_analysis
    FOR UPDATE USING (auth.uid() = auth_user_id);

-- Trigger to automatically update updated_at for CV sessions
CREATE TRIGGER update_auth_cv_sessions_updated_at
    BEFORE UPDATE ON public.auth_cv_sessions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to automatically update updated_at for ATS analyses
CREATE TRIGGER update_cv_ats_analysis_updated_at
    BEFORE UPDATE ON public.cv_ats_analysis
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;
GRANT ALL ON public.user_sessions TO anon, authenticated;
GRANT ALL ON public.auth_cv_sessions TO anon, authenticated;
GRANT ALL ON public.cv_ats_analysis TO anon, authenticated;

-- Create CV content sections table
CREATE TABLE public.cv_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
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

-- Enable RLS for cv_content
ALTER TABLE public.cv_content ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own CV content
CREATE POLICY "Users can view own CV content" ON public.cv_content
    FOR SELECT USING (auth.uid() = auth_user_id);

-- Policy: Users can create their own CV content
CREATE POLICY "Users can create own CV content" ON public.cv_content
    FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

-- Policy: Users can update their own CV content
CREATE POLICY "Users can update own CV content" ON public.cv_content
    FOR UPDATE USING (auth.uid() = auth_user_id);

-- Policy: Users can delete their own CV content
CREATE POLICY "Users can delete own CV content" ON public.cv_content
    FOR DELETE USING (auth.uid() = auth_user_id);

-- Trigger to automatically update updated_at for CV content
CREATE TRIGGER update_cv_content_updated_at
    BEFORE UPDATE ON public.cv_content
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions
GRANT ALL ON public.cv_content TO anon, authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_auth_cv_sessions_user_id ON public.auth_cv_sessions(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_auth_cv_sessions_session_id ON public.auth_cv_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_cv_ats_analysis_session_id ON public.cv_ats_analysis(session_id);
CREATE INDEX IF NOT EXISTS idx_cv_ats_analysis_user_id ON public.cv_ats_analysis(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_cv_content_session_id ON public.cv_content(session_id);
CREATE INDEX IF NOT EXISTS idx_cv_content_user_id ON public.cv_content(auth_user_id);