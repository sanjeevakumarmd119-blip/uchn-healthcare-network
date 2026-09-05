import { NextResponse } from 'next/server';
import prisma from '@/server/db';

export async function GET() {
  try {
    const clinics = await prisma.clinic.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            doctorProfiles: true,
            appointments: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: { clinics },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch clinics' },
      { status: 500 }
    );
  }
}

