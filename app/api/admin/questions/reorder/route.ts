import { NextRequest, NextResponse } from 'next/server';
import { getDynamicQuestionService } from '@/lib/chat/dynamic-question-service';
import { cookies } from 'next/headers';

async function checkAdminAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('admin-auth');
  const adminPassword = process.env.ADMIN_PASSWORD || '159753';

  return authCookie?.value === adminPassword;
}

export async function POST(request: NextRequest) {
  if (!(await checkAdminAuth())) {
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
    // Keep critical error logging for debugging
    console.error('Error reordering questions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to reorder questions';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}