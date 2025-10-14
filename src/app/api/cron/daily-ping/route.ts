import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request (for security)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Simple ping to keep database active
    const { data, error } = await supabase
      .from('cv_sessions')
      .select('count')
      .limit(1);
    
    if (error) {
      throw error;
    }

    console.log(`Daily ping successful at ${new Date().toISOString()}`);
    
    return NextResponse.json({
      success: true,
      message: 'Database ping successful',
      timestamp: new Date().toISOString(),
      supabase: {
        connected: true,
        url: supabaseUrl
      }
    });
  } catch (error) {
    console.error('Daily ping failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}