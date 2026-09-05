import { NextRequest, NextResponse } from 'next/server';
import { DoctorService } from '@/server/services/doctor.service';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get('date') || undefined;

    const slots = await DoctorService.getDoctorSlots(params.id, dateStr);

    return NextResponse.json({
      success: true,
      data: { slots },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch appointment slots' },
      { status: 500 }
    );
  }
}
