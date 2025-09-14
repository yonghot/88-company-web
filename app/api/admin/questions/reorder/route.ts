import { NextRequest, NextResponse } from 'next/server';
import { getDynamicQuestionService } from '@/lib/chat/dynamic-question-service';

function checkAdminAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const adminKey = process.env.ADMIN_SECRET_KEY;

  if (!adminKey) {
    console.warn('ADMIN_SECRET_KEY not configured');
    return false;
  }

  return authHeader === `Bearer ${adminKey}`;
}

export async function POST(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { steps } = body;

    if (!Array.isArray(steps)) {
      return NextResponse.json(
        { success: false, error: 'Steps array is required' },
        { status: 400 }
      );
    }

    const service = getDynamicQuestionService();
    await service.reorderQuestions(steps);

    return NextResponse.json({
      success: true,
      message: 'Questions reordered successfully'
    });
  } catch (error) {
    console.error('Error reordering questions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reorder questions' },
      { status: 500 }
    );
  }
}