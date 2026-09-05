import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/server/auth/guards';
import { CreateInventoryItemSchema } from '@/server/validators/inventory.validator';
import { InventoryService } from '@/server/services/inventory.service';
import prisma from '@/server/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req, ['DOCTOR', 'CLINIC_ADMIN']);
  if ('status' in auth) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;

    let clinicId = searchParams.get('clinicId') || auth.user.clinicId;

    if (!clinicId) {
      const firstClinic = await prisma.clinic.findFirst();
      clinicId = firstClinic?.id || '';
    }

    const inventory = await InventoryService.getClinicInventory(clinicId, status, search);

    return NextResponse.json({
      success: true,
      data: { inventory },
    });
  } catch (error: any) {
    console.error('Inventory GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req, ['CLINIC_ADMIN']);
  if ('status' in auth) return auth;

  try {
    const body = await req.json();
    const validated = CreateInventoryItemSchema.parse(body);

    const item = await InventoryService.createInventoryItem(validated, auth.user.userId);

    return NextResponse.json({
      success: true,
      data: { item },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Inventory POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to add inventory item' },
      { status: 400 }
    );
  }
}

