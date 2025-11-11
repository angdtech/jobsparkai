ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS language_preference TEXT DEFAULT 'en-US' 
CHECK (language_preference IN ('en-US', 'en-GB', 'es-ES', 'fr-FR', 'de-DE', 'it-IT', 'pt-BR', 'nl-NL', 'ja-JP', 'zh-CN', 'ar-SA'));
