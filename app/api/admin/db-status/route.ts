import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    // 환경 변수 체크
    const hasValidConfig = !!(
      supabaseUrl &&
      supabaseKey &&
      supabaseUrl.length > 10 &&
      supabaseKey.length > 10 &&
      supabaseUrl.startsWith('http') &&
      !supabaseUrl.includes('placeholder') &&
      !supabaseUrl.includes('your_supabase') &&
      !supabaseUrl.includes('your-project-ref')
    );

    if (!hasValidConfig) {
      return NextResponse.json({
        status: 'disconnected',
        storageType: 'localStorage',
        message: 'Supabase not configured',
        configured: false
      });
    }

    // Supabase 연결 테스트
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });

      if (response.ok || response.status === 200 || response.status === 204) {
        return NextResponse.json({
          status: 'connected',
          storageType: 'supabase',
          message: 'Supabase connected successfully',
          configured: true
        });
      } else {
        return NextResponse.json({
          status: 'error',
          storageType: 'localStorage',
          message: `Supabase connection failed: ${response.status}`,
          configured: true
        });
      }
    } catch (error) {
      return NextResponse.json({
        status: 'error',
        storageType: 'localStorage',
        message: `Supabase connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        configured: true
      });
    }
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      storageType: 'localStorage',
      message: 'Internal server error',
      configured: false
    });
  }
}