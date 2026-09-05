import { NextRequest, NextResponse } from 'next/server';
import { DoctorService } from '@/server/services/doctor.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const specialtyId = searchParams.get('specialtyId') || undefined;
    const clinicId = searchParams.get('clinicId') || undefined;
    const userLat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : undefined;
    const userLng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : undefined;
    const maxDistanceKm = searchParams.get('maxDistance') ? parseFloat(searchParams.get('maxDistance')!) : undefined;

    const doctors = await DoctorService.getDoctors({
      search,
      specialtyId,
      clinicId,
      userLat,
      userLng,
      maxDistanceKm,
    });

    return NextResponse.json({
      success: true,
      data: { doctors },
    });
  } catch (error: any) {
    console.error('Doctors API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch doctors' },
      { status: 500 }
    );
  }
}

