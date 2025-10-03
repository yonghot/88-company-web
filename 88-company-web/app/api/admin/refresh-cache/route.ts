import { NextRequest, NextResponse } from 'next/server';
import { staticQuestionService } from '@/lib/chat/static-question-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '159753';

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[API] Refreshing question cache...');
    const questions = await staticQuestionService.refreshQuestions();

    return NextResponse.json({
      success: true,
      message: 'Cache refreshed successfully',
      questionCount: questions.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[API] Failed to refresh cache:', error);
    return NextResponse.json(
      { error: 'Failed to refresh cache' },
      { status: 500 }
    );
  }
}
