import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/server/auth/guards';
import { BookAppointmentSchema } from '@/server/validators/appointment.validator';
import { AppointmentService } from '@/server/services/appointment.service';
import prisma from '@/server/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get('date') || undefined;

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

      const appointments = await AppointmentService.getPatientAppointments(patientId);
      return NextResponse.json({ success: true, data: { appointments } });
    } else if (auth.user.role === 'DOCTOR') {
      let doctorId = auth.user.doctorProfileId;
      if (!doctorId) {
        const profile = await prisma.doctorProfile.findUnique({
          where: { userId: auth.user.userId },
        });
        doctorId = profile?.id || null;
      }

      if (!doctorId) {
        return NextResponse.json(
          { success: false, error: 'Doctor profile not found' },
          { status: 404 }
        );
      }

      const appointments = await AppointmentService.getDoctorAppointments(doctorId, dateStr);
      return NextResponse.json({ success: true, data: { appointments } });
    } else if (auth.user.role === 'CLINIC_ADMIN') {
      const clinicId = auth.user.clinicId;
      if (!clinicId) {
        const staff = await prisma.clinicStaff.findFirst({
          where: { userId: auth.user.userId },
        });
        if (!staff) {
          return NextResponse.json(
            { success: false, error: 'Clinic association not found' },
            { status: 404 }
          );
        }
        const appointments = await AppointmentService.getClinicAppointments(staff.clinicId, dateStr);
        return NextResponse.json({ success: true, data: { appointments } });
      }

      const appointments = await AppointmentService.getClinicAppointments(clinicId, dateStr);
      return NextResponse.json({ success: true, data: { appointments } });
    }

    return NextResponse.json({ success: false, error: 'Unauthorized role' }, { status: 403 });
  } catch (error: any) {
    console.error('Appointments GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req, ['PATIENT']);
  if ('status' in auth) return auth;

  try {
    const body = await req.json();
    const validated = BookAppointmentSchema.parse(body);

    let patientProfileId = auth.user.patientProfileId;
    if (!patientProfileId) {
      const profile = await prisma.patientProfile.findUnique({
        where: { userId: auth.user.userId },
      });
      patientProfileId = profile?.id || null;
    }

    if (!patientProfileId) {
      return NextResponse.json(
        { success: false, error: 'Patient profile not found. Please complete profile setup.' },
        { status: 400 }
      );
    }

    const appointment = await AppointmentService.bookAppointment(
      patientProfileId,
      auth.user.userId,
      validated
    );

    return NextResponse.json({
      success: true,
      data: { appointment },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Book Appointment error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to book appointment' },
      { status: 400 }
    );
  }
}

