import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/server/auth/guards';
import { CreateEmergencySchema } from '@/server/validators/emergency.validator';
import { EmergencyService } from '@/server/services/emergency.service';
import prisma from '@/server/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const auth = requireAuth(req, ['PATIENT']);
  if ('status' in auth) return auth;

  try {
    const body = await req.json();
    const validated = CreateEmergencySchema.parse(body);

    let patientProfileId = auth.user.patientProfileId;
    if (!patientProfileId) {
      const profile = await prisma.patientProfile.findUnique({
        where: { userId: auth.user.userId },
      });
      patientProfileId = profile?.id || null;
    }

    if (!patientProfileId) {
      return NextResponse.json(
        { success: false, error: 'Patient profile not found.' },
        { status: 400 }
      );
    }

    const emergency = await EmergencyService.createEmergency(
      patientProfileId,
      auth.user.userId,
      validated
    );

    return NextResponse.json({
      success: true,
      data: { emergency },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create Emergency API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to dispatch emergency request.' },
      { status: 400 }
    );
  }
}

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;

  try {
    if (auth.user.role === 'PATIENT') {
      let patientProfileId = auth.user.patientProfileId;
      if (!patientProfileId) {
        const profile = await prisma.patientProfile.findUnique({
          where: { userId: auth.user.userId },
        });
        patientProfileId = profile?.id || null;
      }

      if (!patientProfileId) {
        return NextResponse.json(
          { success: false, error: 'Patient profile not found' },
          { status: 404 }
        );
      }

      const emergencies = await EmergencyService.getPatientEmergencies(patientProfileId);
      return NextResponse.json({ success: true, data: { emergencies } });
    } else {
      // Doctor or Clinic Admin
      const clinicId = auth.user.clinicId || undefined;
      const emergencies = await EmergencyService.getActiveEmergencies(clinicId);
      return NextResponse.json({ success: true, data: { emergencies } });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch emergency cases' },
      { status: 500 }
    );
  }
}

