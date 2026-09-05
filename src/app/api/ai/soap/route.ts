import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/server/services/ai.service';
import { requireAuth } from '@/server/auth/guards';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req, ['DOCTOR', 'CLINIC_ADMIN']);
    if (auth instanceof NextResponse) return auth;

    const body = await req.json();
    const { patientName, chiefComplaint, clinicalObservations, vitalSigns, doctorNotes } = body;

    if (!patientName || !chiefComplaint) {
      return NextResponse.json(
        { error: 'Patient name and chief complaint are required.' },
        { status: 400 }
      );
    }

    const soapNotes = await AIService.generateSoapNotes({
      patientName,
      chiefComplaint,
      clinicalObservations,
      vitalSigns,
      doctorNotes,
    });

    return NextResponse.json({
      success: true,
      data: { soapNotes },
    });
  } catch (error: any) {
    console.error('AI SOAP Notes API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate clinical SOAP notes' },
      { status: 500 }
    );
  }
}
