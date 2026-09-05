import { NextRequest, NextResponse } from 'next/server';
import { MedicineService } from '@/server/services/medicine.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const category = searchParams.get('category') || undefined;
    const clinicId = searchParams.get('clinicId') || undefined;
    const userLat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : undefined;
    const userLng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : undefined;

    const medicines = await MedicineService.searchMedicines({
      search,
      category,
      clinicId,
      userLat,
      userLng,
    });

    const categories = await MedicineService.getCategories();

    return NextResponse.json({
      success: true,
      data: { medicines, categories },
    });
  } catch (error: any) {
    console.error('Medicines GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to search medicines' },
      { status: 500 }
    );
  }
}

