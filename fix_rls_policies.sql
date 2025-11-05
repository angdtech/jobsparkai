-- Drop existing policies
DROP POLICY IF EXISTS "Service role can manage all sessions" ON public.auth_cv_sessions;
DROP POLICY IF EXISTS "Service role can manage all analyses" ON public.cv_ats_analysis;
DROP POLICY IF EXISTS "Service role can manage all content" ON public.cv_content;

-- Auth CV Sessions Policies
-- Allow authenticated users to read their own sessions
CREATE POLICY "Users can view own sessions" ON public.auth_cv_sessions
    FOR SELECT USING (auth.uid() = auth_user_id);

-- Allow authenticated users to insert their own sessions
CREATE POLICY "Users can insert own sessions" ON public.auth_cv_sessions
    FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

-- Allow authenticated users to update their own sessions
CREATE POLICY "Users can update own sessions" ON public.auth_cv_sessions
    FOR UPDATE USING (auth.uid() = auth_user_id);

-- Allow authenticated users to delete their own sessions
CREATE POLICY "Users can delete own sessions" ON public.auth_cv_sessions
    FOR DELETE USING (auth.uid() = auth_user_id);

-- Allow service role to do anything (for API routes)
CREATE POLICY "Service role full access sessions" ON public.auth_cv_sessions
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- CV ATS Analysis Policies
-- Allow users to view analysis for their sessions
CREATE POLICY "Users can view own analysis" ON public.cv_ats_analysis
    FOR SELECT USING (
        session_id IN (
            SELECT session_id FROM public.auth_cv_sessions 
            WHERE auth_user_id = auth.uid()
        )
    );

-- Allow users to insert analysis for their sessions
CREATE POLICY "Users can insert own analysis" ON public.cv_ats_analysis
    FOR INSERT WITH CHECK (
        session_id IN (
            SELECT session_id FROM public.auth_cv_sessions 
            WHERE auth_user_id = auth.uid()
        )
    );

-- Allow service role full access
CREATE POLICY "Service role full access analysis" ON public.cv_ats_analysis
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- CV Content Policies
-- Allow users to view content for their sessions
CREATE POLICY "Users can view own content" ON public.cv_content
    FOR SELECT USING (
        session_id IN (
            SELECT session_id FROM public.auth_cv_sessions 
            WHERE auth_user_id = auth.uid()
        )
    );

-- Allow users to insert content for their sessions
CREATE POLICY "Users can insert own content" ON public.cv_content
    FOR INSERT WITH CHECK (
        session_id IN (
            SELECT session_id FROM public.auth_cv_sessions 
            WHERE auth_user_id = auth.uid()
        )
    );

-- Allow users to update content for their sessions
CREATE POLICY "Users can update own content" ON public.cv_content
    FOR UPDATE USING (
        session_id IN (
            SELECT session_id FROM public.auth_cv_sessions 
            WHERE auth_user_id = auth.uid()
        )
    );

-- Allow service role full access
CREATE POLICY "Service role full access content" ON public.cv_content
    FOR ALL TO service_role USING (true) WITH CHECK (true);
