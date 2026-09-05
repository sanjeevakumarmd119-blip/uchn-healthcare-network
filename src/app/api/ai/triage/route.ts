import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/server/services/ai.service';
import { getSessionFromRequest } from '@/server/auth/guards';
import prisma from '@/server/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      symptoms,
      latitude,
      longitude,
      locationCity,
      age: customAge,
      gender: customGender,
      allergies: customAllergies,
      medicalHistory: customMedicalHistory,
    } = body;

    if (!symptoms || typeof symptoms !== 'string' || symptoms.trim().length < 3) {
      return NextResponse.json(
        { error: 'Please provide a detailed description of your symptoms.' },
        { status: 400 }
      );
    }

    // Optional authentication to fetch linked patient profile
    const session = getSessionFromRequest(req);
    let patientContext: {
      name?: string;
      age?: number;
      gender?: string;
      bloodGroup?: string;
      allergies?: string;
      medicalHistory?: string;
      locationCity?: string;
    } = {
      locationCity: locationCity || undefined,
      age: customAge ? parseInt(customAge, 10) : undefined,
      gender: customGender || undefined,
      allergies: customAllergies || undefined,
      medicalHistory: customMedicalHistory || undefined,
    };

    if (session) {
      try {
        const patient = await prisma.patientProfile.findUnique({
          where: { userId: session.userId },
          include: { user: true },
        });

        if (patient) {
          let calculatedAge: number | undefined = undefined;
          if (patient.dateOfBirth) {
            const diff = Date.now() - new Date(patient.dateOfBirth).getTime();
            calculatedAge = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
          }

          patientContext = {
            name: `${patient.user.firstName} ${patient.user.lastName}`,
            age: patientContext.age ?? calculatedAge,
            gender: patientContext.gender ?? patient.gender ?? undefined,
            bloodGroup: patient.bloodGroup ?? undefined,
            allergies: patientContext.allergies ?? patient.allergies ?? undefined,
            medicalHistory: patientContext.medicalHistory ?? patient.medicalHistory ?? undefined,
            locationCity: patientContext.locationCity || `${patient.city || 'San Francisco'}`,
          };
        }
      } catch (dbErr) {
        console.warn('Could not load patient profile for AI triage context:', dbErr);
      }
    }

    const result = await AIService.analyzeSymptoms(
      symptoms.trim(),
      latitude ? parseFloat(latitude) : undefined,
      longitude ? parseFloat(longitude) : undefined,
      patientContext
    );

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        patientContext,
      },
    });
  } catch (error: any) {
    console.error('AI Triage API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process AI triage assessment' },
      { status: 500 }
    );
  }
}
