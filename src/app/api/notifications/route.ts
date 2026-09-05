import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/server/auth/guards';
import { NotificationService } from '@/server/services/notification.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;

  try {
    const notifications = await NotificationService.getUserNotifications(auth.user.userId);

    return NextResponse.json({
      success: true,
      data: { notifications },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;

  try {
    await NotificationService.markAllAsRead(auth.user.userId);

    return NextResponse.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to mark notifications read' },
      { status: 500 }
    );
  }
}

