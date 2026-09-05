import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/server/auth/guards';
import { QueueService } from '@/server/services/queue.service';
import prisma from '@/server/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;

  try {
    const { searchParams } = new URL(req.url);

    if (auth.user.role === 'PATIENT') {
      let patientId = auth.user.patientProfileId;
      if (!patientId) {
        const profile = await prisma.patientProfile.findUnique({
          where: { userId: auth.user.userId },
        });
        patientId = profile?.id || null;
      }

      if (!patientId) {
        return NextResponse.json(
          { success: false, error: 'Patient profile not found' },
          { status: 404 }
        );
      }

      const currentQueue = await QueueService.getPatientQueueStatus(patientId);
      return NextResponse.json({
        success: true,
        data: { queueEntry: currentQueue },
      });
    } else {
      // Doctor or Clinic Admin
      let clinicId = searchParams.get('clinicId') || auth.user.clinicId;
      const doctorId = searchParams.get('doctorId') || (auth.user.role === 'DOCTOR' ? auth.user.doctorProfileId || undefined : undefined);

      if (!clinicId) {
        const firstClinic = await prisma.clinic.findFirst();
        clinicId = firstClinic?.id || '';
      }

      const queue = await QueueService.getClinicQueue(clinicId, doctorId);
      return NextResponse.json({
        success: true,
        data: { queue },
      });
    }
  } catch (error: any) {
    console.error('Queue GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch queue' },
      { status: 500 }
    );
  }
}

