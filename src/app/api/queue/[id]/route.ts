import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/server/auth/guards';
import { UpdateQueueStatusSchema } from '@/server/validators/queue.validator';
import { QueueService } from '@/server/services/queue.service';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth(req, ['DOCTOR', 'CLINIC_ADMIN']);
  if ('status' in auth) return auth;

  try {
    const body = await req.json();
    const validated = UpdateQueueStatusSchema.parse({
      ...body,
      queueId: params.id,
    });

    const updated = await QueueService.updateQueueStatus(validated, auth.user.userId);

    return NextResponse.json({
      success: true,
      data: { queueEntry: updated },
    });
  } catch (error: any) {
    console.error('Queue update error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update queue entry' },
      { status: 400 }
    );
  }
}
