import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/server/auth/guards';
import { RequestMedicineSchema } from '@/server/validators/medicine.validator';
import { MedicineService } from '@/server/services/medicine.service';
import prisma from '@/server/db';

export async function POST(req: NextRequest) {
  const auth = requireAuth(req, ['PATIENT']);
  if ('status' in auth) return auth;

  try {
    const body = await req.json();
    const validated = RequestMedicineSchema.parse(body);

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

    const request = await MedicineService.requestMedicine(
      patientProfileId,
      auth.user.userId,
      validated
    );

    return NextResponse.json({
      success: true,
      data: { request },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Request Medicine error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit medicine request.' },
      { status: 400 }
    );
  }
}

export async function GET(req: NextRequest) {
  const auth = requireAuth(req, ['PATIENT']);
  if ('status' in auth) return auth;

  try {
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

    const requests = await MedicineService.getPatientRequests(patientProfileId);

    return NextResponse.json({
      success: true,
      data: { requests },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch medicine requests' },
      { status: 500 }
    );
  }
}

