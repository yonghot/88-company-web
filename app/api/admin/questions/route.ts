import { NextRequest, NextResponse } from 'next/server';
import { getDynamicQuestionService } from '@/lib/chat/dynamic-question-service';
import { ChatQuestion } from '@/lib/chat/dynamic-types';
import { cookies } from 'next/headers';

async function checkAdminAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('admin-auth');
  const adminPassword = process.env.ADMIN_PASSWORD || '159753';

  return authCookie?.value === adminPassword;
}

export async function GET(request: NextRequest) {
  try {
    const service = getDynamicQuestionService();
    const questions = await service.loadQuestions();
    const flow = await service.loadFlow();

    const questionsArray = Array.from(questions.values()).sort(
      (a, b) => a.order_index - b.order_index
    );

    return NextResponse.json({
      success: true,
      data: {
        questions: questionsArray,
        flow: flow
      }
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
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
    const service = getDynamicQuestionService();

    const newQuestion: ChatQuestion = {
      ...body,
      is_active: body.is_active ?? true
    };

    const saved = await service.saveQuestion(newQuestion);

    return NextResponse.json({
      success: true,
      data: saved
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create question' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  if (!(await checkAdminAuth())) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { step, ...updates } = body;

    if (!step) {
      return NextResponse.json(
        { success: false, error: 'Step is required' },
        { status: 400 }
      );
    }

    const service = getDynamicQuestionService();
    const updated = await service.updateQuestion(step, updates);

    return NextResponse.json({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update question' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await checkAdminAuth())) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const step = searchParams.get('step');

    if (!step) {
      return NextResponse.json(
        { success: false, error: 'Step is required' },
        { status: 400 }
      );
    }

    const service = getDynamicQuestionService();
    await service.deleteQuestion(step);

    return NextResponse.json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete question' },
      { status: 500 }
    );
  }
}