import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/server/auth/guards';
import { UpdateEmergencyStatusSchema } from '@/server/validators/emergency.validator';
import { EmergencyService } from '@/server/services/emergency.service';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;

  try {
    const emergency = await EmergencyService.getEmergencyById(params.id);
    if (!emergency) {
      return NextResponse.json(
        { success: false, error: 'Emergency case not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { emergency },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch emergency case' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth(req, ['DOCTOR', 'CLINIC_ADMIN', 'PATIENT']);
  if ('status' in auth) return auth;

  try {
    const body = await req.json();
    const validated = UpdateEmergencyStatusSchema.parse(body);

    if (auth.user.role === 'PATIENT' && validated.status !== 'CANCELLED') {
      return NextResponse.json(
        { success: false, error: 'Patients can only cancel active emergency requests.' },
        { status: 403 }
      );
    }

    const updated = await EmergencyService.updateEmergencyStatus(
      params.id,
      validated,
      auth.user.userId
    );

    return NextResponse.json({
      success: true,
      data: { emergency: updated },
    });
  } catch (error: any) {
    console.error('Update emergency status error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update emergency status' },
      { status: 400 }
    );
  }
}
