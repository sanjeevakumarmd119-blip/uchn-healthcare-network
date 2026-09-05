import { NextResponse } from 'next/server';
import { DoctorService } from '@/server/services/doctor.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const specialties = await DoctorService.getSpecialties();
    return NextResponse.json({
      success: true,
      data: { specialties },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch specialties' },
      { status: 500 }
    );
  }
}
