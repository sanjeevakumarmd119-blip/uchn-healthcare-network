import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/server/auth/guards';
import { StockTransactionSchema } from '@/server/validators/inventory.validator';
import { InventoryService } from '@/server/services/inventory.service';

export async function POST(req: NextRequest) {
  const auth = requireAuth(req, ['DOCTOR', 'CLINIC_ADMIN']);
  if ('status' in auth) return auth;

  try {
    const body = await req.json();
    const validated = StockTransactionSchema.parse(body);

    const result = await InventoryService.recordStockTransaction(
      validated,
      auth.user.userId
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Inventory transaction error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to record stock transaction' },
      { status: 400 }
    );
  }
}

