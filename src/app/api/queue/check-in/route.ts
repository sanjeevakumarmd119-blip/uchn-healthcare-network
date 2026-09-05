import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/server/auth/guards';
import { CheckInQueueSchema } from '@/server/validators/queue.validator';
import { QueueService } from '@/server/services/queue.service';

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;

  try {
    const body = await req.json();
    const validated = CheckInQueueSchema.parse(body);

    const queueEntry = await QueueService.checkInPatient(validated, auth.user.userId);

    return NextResponse.json({
      success: true,
      data: { queueEntry },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Queue Check-in error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to check in patient' },
      { status: 400 }
    );
  }
}

