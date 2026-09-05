import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/server/auth/guards';
import { EmergencyService } from '@/server/services/emergency.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req, ['DOCTOR', 'CLINIC_ADMIN']);
  if ('status' in auth) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const clinicId = searchParams.get('clinicId') || auth.user.clinicId || undefined;

    const emergencies = await EmergencyService.getActiveEmergencies(clinicId);

    return NextResponse.json({
      success: true,
      data: { emergencies },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch active emergencies' },
      { status: 500 }
    );
  }
}

