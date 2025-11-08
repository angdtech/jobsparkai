-- Enable RLS on cv_content table to ensure users can only access their own CVs
ALTER TABLE public.cv_content ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own CVs" ON public.cv_content;
DROP POLICY IF EXISTS "Users can insert their own CVs" ON public.cv_content;
DROP POLICY IF EXISTS "Users can update their own CVs" ON public.cv_content;
DROP POLICY IF EXISTS "Users can delete their own CVs" ON public.cv_content;
DROP POLICY IF EXISTS "Service role has full access" ON public.cv_content;

-- Policy: Users can only SELECT their own CV content
CREATE POLICY "Users can view their own CVs"
    ON public.cv_content
    FOR SELECT
    TO authenticated
    USING (auth.uid() = auth_user_id);

-- Policy: Users can only INSERT CV content with their own user ID
CREATE POLICY "Users can insert their own CVs"
    ON public.cv_content
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = auth_user_id);

-- Policy: Users can only UPDATE their own CV content
CREATE POLICY "Users can update their own CVs"
    ON public.cv_content
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = auth_user_id)
    WITH CHECK (auth.uid() = auth_user_id);

-- Policy: Users can only DELETE their own CV content
CREATE POLICY "Users can delete their own CVs"
    ON public.cv_content
    FOR DELETE
    TO authenticated
    USING (auth.uid() = auth_user_id);

-- Policy: Service role (backend API with service key) has full access
CREATE POLICY "Service role has full access"
    ON public.cv_content
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Also add RLS to auth_cv_sessions table
ALTER TABLE public.auth_cv_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own sessions" ON public.auth_cv_sessions;
DROP POLICY IF EXISTS "Users can insert their own sessions" ON public.auth_cv_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.auth_cv_sessions;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON public.auth_cv_sessions;
DROP POLICY IF EXISTS "Service role has full access to sessions" ON public.auth_cv_sessions;

-- Policy: Users can only SELECT their own sessions
CREATE POLICY "Users can view their own sessions"
    ON public.auth_cv_sessions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = auth_user_id);

-- Policy: Users can only INSERT sessions with their own user ID
CREATE POLICY "Users can insert their own sessions"
    ON public.auth_cv_sessions
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = auth_user_id);

-- Policy: Users can only UPDATE their own sessions
CREATE POLICY "Users can update their own sessions"
    ON public.auth_cv_sessions
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = auth_user_id)
    WITH CHECK (auth.uid() = auth_user_id);

-- Policy: Users can only DELETE their own sessions
CREATE POLICY "Users can delete their own sessions"
    ON public.auth_cv_sessions
    FOR DELETE
    TO authenticated
    USING (auth.uid() = auth_user_id);

-- Policy: Service role has full access
CREATE POLICY "Service role has full access to sessions"
    ON public.auth_cv_sessions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Create index for faster RLS checks
CREATE INDEX IF NOT EXISTS idx_cv_content_auth_user_id ON public.cv_content(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_auth_cv_sessions_auth_user_id ON public.auth_cv_sessions(auth_user_id);
