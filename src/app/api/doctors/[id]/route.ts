import { NextRequest, NextResponse } from 'next/server';
import { DoctorService } from '@/server/services/doctor.service';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const userLat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : undefined;
    const userLng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : undefined;

    const doctor = await DoctorService.getDoctorById(params.id, userLat, userLng);

    if (!doctor) {
      return NextResponse.json(
        { success: false, error: 'Doctor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { doctor },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch doctor profile' },
      { status: 500 }
    );
  }
}

