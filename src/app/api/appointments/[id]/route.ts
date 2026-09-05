import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/server/auth/guards';
import { UpdateAppointmentStatusSchema } from '@/server/validators/appointment.validator';
import { AppointmentService } from '@/server/services/appointment.service';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;

  try {
    const body = await req.json();
    const validated = UpdateAppointmentStatusSchema.parse(body);

    const updated = await AppointmentService.updateAppointmentStatus(
      params.id,
      validated,
      auth.user.userId
    );

    return NextResponse.json({
      success: true,
      data: { appointment: updated },
    });
  } catch (error: any) {
    console.error('Update appointment status error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update appointment' },
      { status: 400 }
    );
  }
}
