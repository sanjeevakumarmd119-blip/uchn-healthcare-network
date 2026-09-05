import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '../db';
import { calculateDistance } from '@/lib/utils';

export interface TriageAnalysis {
  urgencyLevel: 'LOW' | 'MODERATE' | 'URGENT' | 'CRITICAL_EMERGENCY';
  summary: string;
  recommendedSpecialty: string;
  potentialConditions: string[];
  homeCareAdvice: string;
  requiresEmergencySOS: boolean;
  disclaimer: string;
}

export interface SoapNotesInput {
  patientName: string;
  chiefComplaint: string;
  clinicalObservations?: string;
  vitalSigns?: string;
  doctorNotes?: string;
}

export interface SoapNotesResult {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  patientInstructions: string;
}

export interface ParsedPrescriptionItem {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  availableInClinic: boolean;
  stockQuantity?: number;
  clinicName?: string;
  unitPrice?: number;
}

export class AIService {
  private static getGeminiClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === '' || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
      return null;
    }
    return new GoogleGenerativeAI(apiKey);
  }

  /**
   * AI Medical Triage & Symptom Checker with Location and Patient Profile Awareness
   */
  static async analyzeSymptoms(
    symptoms: string,
    userLat: number = 37.7749,
    userLng: number = -122.4194,
    patientContext?: {
      name?: string;
      age?: number;
      gender?: string;
      bloodGroup?: string;
      allergies?: string;
      medicalHistory?: string;
      locationCity?: string;
    }
  ): Promise<{ analysis: TriageAnalysis; recommendedDoctors: any[] }> {
    const textLower = symptoms.toLowerCase();

    // Deterministic Critical Emergency Safety Guardrail
    const isEmergency =
      textLower.includes('chest pain') ||
      textLower.includes('heart attack') ||
      textLower.includes('shortness of breath') ||
      textLower.includes('difficulty breathing') ||
      textLower.includes('cant breathe') ||
      textLower.includes('can\'t breathe') ||
      textLower.includes('stroke') ||
      textLower.includes('numbness in arm') ||
      textLower.includes('face drooping') ||
      textLower.includes('heavy bleeding') ||
      textLower.includes('unconscious') ||
      textLower.includes('overdose') ||
      textLower.includes('severe trauma') ||
      textLower.includes('seizure');

    let analysis: TriageAnalysis;
    const genAI = this.getGeminiClient();

    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const contextStr = [
          patientContext?.age ? `Patient Age: ${patientContext.age}` : '',
          patientContext?.gender ? `Gender: ${patientContext.gender}` : '',
          patientContext?.allergies ? `Known Allergies: ${patientContext.allergies}` : '',
          patientContext?.medicalHistory ? `Medical History: ${patientContext.medicalHistory}` : '',
          patientContext?.locationCity ? `User Location: ${patientContext.locationCity}` : '',
        ]
          .filter(Boolean)
          .join(' | ');

        const prompt = `You are UCHN's certified AI Clinical Triage Assistant.
Analyze the following patient symptoms carefully:
${contextStr ? `[Patient Context: ${contextStr}]\n` : ''}"${symptoms}"

Respond ONLY with a valid JSON object matching this structure:
{
  "urgencyLevel": "LOW" | "MODERATE" | "URGENT" | "CRITICAL_EMERGENCY",
  "summary": "Clear, empathetic clinical evaluation of reported symptoms tailored to any provided patient context",
  "recommendedSpecialty": "General Medicine" | "Cardiology" | "Pediatrics" | "Neurology" | "Orthopedics" | "Dermatology" | "Pulmonology" | "Emergency Medicine" | "Endocrinology" | "ENT (Otolaryngology)",
  "potentialConditions": ["Condition 1", "Condition 2"],
  "homeCareAdvice": "Safe, non-prescriptive supportive care advice (hydration, rest, monitoring, allergy precautions)",
  "requiresEmergencySOS": boolean,
  "disclaimer": "This AI assessment is for informational and triage guidance only and does not replace professional medical diagnosis. If symptoms worsen or become acute, seek immediate emergency care."
}`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          analysis = JSON.parse(responseText);
        }
      } catch (err) {
        console.warn('Gemini API call failed or timed out, using clinical NLP fallback:', err);
        analysis = this.fallbackTriage(symptoms, isEmergency, patientContext);
      }
    } else {
      analysis = this.fallbackTriage(symptoms, isEmergency, patientContext);
    }

    // Force safety override if emergency keywords matched
    if (isEmergency) {
      analysis.urgencyLevel = 'CRITICAL_EMERGENCY';
      analysis.requiresEmergencySOS = true;
    }

    // Fetch nearest matching doctors from Neon PostgreSQL
    let recommendedDoctors: any[] = [];
    try {
      const specialtyQuery = analysis.recommendedSpecialty || 'General Medicine';
      const doctors = await prisma.doctorProfile.findMany({
        where: {
          
          isAvailable: true,
          OR: [
            {
              doctorSpecialties: {
                some: {
                  specialty: {
                    name: { contains: specialtyQuery, mode: 'insensitive' },
                  },
                },
              },
            },
            {
              doctorSpecialties: {
                some: {
                  specialty: {
                    name: { contains: 'General', mode: 'insensitive' },
                  },
                },
              },
            },
          ],
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              avatarUrl: true,
            },
          },
          clinic: true,
          doctorSpecialties: {
            include: { specialty: true },
          },
          appointmentSlots: {
            where: {
              isBooked: false,
              startTime: { gte: new Date() },
            },
            take: 4,
            orderBy: { startTime: 'asc' },
          },
        },
        take: 6,
      });

      recommendedDoctors = doctors
        .map((doc) => ({
          ...doc,
          distanceKm: calculateDistance(
            userLat,
            userLng,
            doc.clinic.latitude,
            doc.clinic.longitude
          ),
        }))
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, 3);
    } catch (e) {
      console.error('Error querying recommended doctors for AI triage:', e);
    }

    return { analysis, recommendedDoctors };
  }

  /**
   * Doctor Clinical SOAP Note Generator
   */
  static async generateSoapNotes(input: SoapNotesInput): Promise<SoapNotesResult> {
    const genAI = this.getGeminiClient();

    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `You are a clinical documentation assistant for a licensed physician.
Patient Name: ${input.patientName}
Chief Complaint: ${input.chiefComplaint}
Clinical Observations: ${input.clinicalObservations || 'Standard outpatient physical examination performed.'}
Vital Signs: ${input.vitalSigns || 'BP: 120/80 mmHg, HR: 74 bpm, SpO2: 98%, Temp: 98.6 F'}
Doctor Initial Notes: ${input.doctorNotes || 'Routine consultation and symptomatic review.'}

Generate a comprehensive, structured clinical SOAP note.
Respond ONLY with a JSON object:
{
  "subjective": "Patient history and chief complaint narrative...",
  "objective": "Vital signs, physical findings, and examination results...",
  "assessment": "Clinical diagnosis, severity, and differential assessment...",
  "plan": "Diagnostic orders, pharmacological therapy, and lifestyle modifications...",
  "patientInstructions": "Clear, empathetic instructions written in plain language for the patient..."
}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
        return JSON.parse(text);
      } catch (err) {
        console.warn('Gemini SOAP note generation failed, using clinical fallback:', err);
      }
    }

    // Fallback SOAP note generator
    return {
      subjective: `Patient ${input.patientName} presents with primary complaint of ${input.chiefComplaint}. Patient reports onset within recent timeframe with associated symptomatic discomfort. No acute red-flag contraindications reported.`,
      objective: `General Appearance: Alert, oriented x3, in no acute distress. Vitals: ${input.vitalSigns || 'BP 120/80 mmHg, Pulse 72 bpm, SpO2 99% on room air'}. ${input.clinicalObservations || 'Systemic examination consistent with localized presentation. Cardiovascular and respiratory sounds normal.'}`,
      assessment: `Primary clinical presentation consistent with acute ${input.chiefComplaint}. Prognosis is good with standard therapeutic regimen and supportive management.`,
      plan: `1. Initiate targeted symptomatic therapy.\n2. Maintain adequate hydration and rest.\n3. Follow up in 7 days if symptoms persist.\n4. Return immediately or trigger UCHN SOS if severe red-flag symptoms arise.`,
      patientInstructions: `Take all prescribed medications with water after meals. Ensure plenty of fluids and rest. If you experience sudden worsening, high fever, or breathlessness, contact your clinic or trigger the Emergency SOS immediately.`,
    };
  }

  /**
   * Prescription Parser & Pharmacy Inventory Matcher
   */
  static async parsePrescription(
    prescriptionText: string,
    clinicId?: string
  ): Promise<{ items: ParsedPrescriptionItem[]; summary: string }> {
    let parsedList: Array<{
      medicineName: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions: string;
    }> = [];

    const genAI = this.getGeminiClient();

    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `You are an AI pharmacy assistant.
Extract all medications from this prescription text:
"${prescriptionText}"

Respond ONLY with a JSON array:
[
  {
    "medicineName": "Name of medicine (e.g. Amoxicillin, Paracetamol, Metformin)",
    "dosage": "Dosage (e.g. 500mg)",
    "frequency": "Frequency (e.g. Twice daily)",
    "duration": "Duration (e.g. 5 days)",
    "instructions": "Instructions (e.g. Take after meals with water)"
  }
]`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          parsedList = JSON.parse(jsonMatch[0]);
        }
      } catch (err) {
        console.warn('Gemini prescription parse failed, using regex fallback:', err);
        parsedList = this.fallbackPrescriptionParser(prescriptionText);
      }
    } else {
      parsedList = this.fallbackPrescriptionParser(prescriptionText);
    }

    // Cross-reference with live database inventory
    const items: ParsedPrescriptionItem[] = [];

    for (const item of parsedList) {
      try {
        const inventoryMatch = await prisma.medicineInventory.findFirst({
          where: {
            ...(clinicId ? { clinicId } : {}),
            status: { in: ['IN_STOCK', 'LOW_STOCK'] },
            medicine: {
              OR: [
                { name: { contains: item.medicineName, mode: 'insensitive' } },
                { genericName: { contains: item.medicineName, mode: 'insensitive' } },
              ],
            },
          },
          include: {
            medicine: true,
            clinic: true,
          },
        });

        items.push({
          medicineName: item.medicineName,
          dosage: item.dosage || 'Standard dose',
          frequency: item.frequency || 'As directed',
          duration: item.duration || 'As prescribed',
          instructions: item.instructions || 'Take with water after meals',
          availableInClinic: !!inventoryMatch,
          stockQuantity: inventoryMatch?.quantity,
          clinicName: inventoryMatch?.clinic.name,
          unitPrice: inventoryMatch?.unitPrice,
        });
      } catch {
        items.push({
          medicineName: item.medicineName,
          dosage: item.dosage || 'Standard dose',
          frequency: item.frequency || 'As directed',
          duration: item.duration || 'As prescribed',
          instructions: item.instructions || 'Take with water after meals',
          availableInClinic: false,
        });
      }
    }

    const availableCount = items.filter((i) => i.availableInClinic).length;
    const summary = `Parsed ${items.length} prescribed medication(s). ${availableCount} of ${items.length} are currently available in nearby clinic inventory for instant reservation.`;

    return { items, summary };
  }

  // --- Clinical Fallback Engines ---

  private static fallbackTriage(
    symptoms: string,
    isEmergency: boolean,
    patientContext?: {
      name?: string;
      age?: number;
      gender?: string;
      bloodGroup?: string;
      allergies?: string;
      medicalHistory?: string;
      locationCity?: string;
    }
  ): TriageAnalysis {
    const text = symptoms.toLowerCase();
    const isPediatric = (patientContext?.age !== undefined && patientContext.age < 18) || text.includes('child') || text.includes('baby') || text.includes('infant');

    if (isEmergency) {
      return {
        urgencyLevel: 'CRITICAL_EMERGENCY',
        summary: `Critical emergency indicators detected${patientContext?.name ? ` for ${patientContext.name}` : ''}. Immediate emergency medical intervention is advised.`,
        recommendedSpecialty: 'Emergency Medicine',
        potentialConditions: ['Acute Cardiac Event', 'Respiratory Distress', 'Severe Trauma'],
        homeCareAdvice:
          'Do NOT exert yourself. Sit upright in a comfortable position and prepare for emergency dispatch immediately.',
        requiresEmergencySOS: true,
        disclaimer:
          'EMERGENCY WARNING: These symptoms warrant immediate clinical intervention. Use the Emergency SOS trigger below or dial local emergency services.',
      };
    }

    if (isPediatric) {
      return {
        urgencyLevel: 'MODERATE',
        summary: `Pediatric health evaluation recommended${patientContext?.age ? ` (Patient age: ${patientContext.age} yrs)` : ''}.`,
        recommendedSpecialty: 'Pediatrics',
        potentialConditions: ['Viral Infection', 'Pediatric Gastroenteritis', 'Upper Respiratory Tract Infection'],
        homeCareAdvice: 'Ensure frequent hydration with small sips of fluids. Monitor body temperature regularly.',
        requiresEmergencySOS: false,
        disclaimer: 'Pediatric cases require prompt clinical evaluation by a licensed pediatrician.',
      };
    }

    if (text.includes('skin') || text.includes('rash') || text.includes('itching') || text.includes('acne')) {
      return {
        urgencyLevel: 'LOW',
        summary: `Dermatological symptoms reported with localized skin irritation or rash.${patientContext?.allergies ? ` Patient has noted allergies: ${patientContext.allergies}.` : ''}`,
        recommendedSpecialty: 'Dermatology',
        potentialConditions: ['Contact Dermatitis', 'Eczema', 'Allergic Reaction'],
        homeCareAdvice: 'Avoid scratching the affected area. Apply a cool compress and gentle hypoallergenic moisturizer.',
        requiresEmergencySOS: false,
        disclaimer: 'This assessment is for triage guidance only. Consult a verified dermatologist for definitive diagnosis.',
      };
    }

    if (text.includes('bone') || text.includes('joint') || text.includes('knee') || text.includes('back pain') || text.includes('sprain') || text.includes('fracture')) {
      return {
        urgencyLevel: text.includes('severe') ? 'URGENT' : 'MODERATE',
        summary: 'Musculoskeletal pain and joint/mobility discomfort reported.',
        recommendedSpecialty: 'Orthopedics',
        potentialConditions: ['Joint Strain / Sprain', 'Osteoarthritis', 'Musculoskeletal Inflammation'],
        homeCareAdvice: 'Follow R.I.C.E protocol (Rest, Ice, Compression, Elevation). Avoid heavy weight-bearing activities.',
        requiresEmergencySOS: false,
        disclaimer: 'This assessment is for triage guidance only. Consult an orthopedic specialist for imaging and physical examination.',
      };
    }

    if (text.includes('headache') || text.includes('migraine') || text.includes('dizziness')) {
      return {
        urgencyLevel: text.includes('severe') ? 'URGENT' : 'MODERATE',
        summary: 'Neurological/cephalic discomfort consistent with migraine or tension headache.',
        recommendedSpecialty: 'Neurology',
        potentialConditions: ['Migraine with/without aura', 'Tension Headache', 'Sinus Pressure'],
        homeCareAdvice: 'Rest in a quiet, dark room. Maintain hydration and apply a cool cloth to the forehead.',
        requiresEmergencySOS: false,
        disclaimer: 'If headache is accompanied by sudden vision loss or neck stiffness, seek emergency care immediately.',
      };
    }

    if (text.includes('cough') || text.includes('breath') || text.includes('lungs') || text.includes('asthma') || text.includes('wheez')) {
      return {
        urgencyLevel: text.includes('severe') ? 'URGENT' : 'MODERATE',
        summary: 'Respiratory symptoms reported affecting airway comfort and ventilation.',
        recommendedSpecialty: 'Pulmonology',
        potentialConditions: ['Acute Bronchitis', 'Upper Respiratory Tract Infection', 'Asthma Flare'],
        homeCareAdvice: 'Inhale warm steam, stay well hydrated with warm fluids, and avoid cold air and irritants.',
        requiresEmergencySOS: false,
        disclaimer: 'If breathing becomes labored or oxygen drops, seek immediate medical care.',
      };
    }

    // Default General Medicine triage
    return {
      urgencyLevel: 'LOW',
      summary: 'General clinical symptoms reported suitable for primary care outpatient review.',
      recommendedSpecialty: 'General Medicine',
      potentialConditions: ['Viral Syndrome', 'Fatigue', 'General Malaise'],
      homeCareAdvice: 'Ensure adequate rest, balanced nutrition, and maintain fluid intake.',
      requiresEmergencySOS: false,
      disclaimer: 'This AI assessment is for guidance only. Consult a primary care physician for complete medical evaluation.',
    };
  }

  private static fallbackPrescriptionParser(text: string) {
    const knownMeds = [
      { name: 'Amoxicillin', dose: '500mg', freq: 'Three times daily', dur: '5 days' },
      { name: 'Paracetamol', dose: '650mg', freq: 'Every 6 hours as needed', dur: '3 days' },
      { name: 'Ibuprofen', dose: '400mg', freq: 'Twice daily after meals', dur: '3 days' },
      { name: 'Metformin', dose: '500mg', freq: 'Twice daily with meals', dur: '30 days' },
      { name: 'Atorvastatin', dose: '20mg', freq: 'Once daily at bedtime', dur: '30 days' },
      { name: 'Azithromycin', dose: '500mg', freq: 'Once daily before food', dur: '3 days' },
      { name: 'Pantoprazole', dose: '40mg', freq: 'Once daily before breakfast', dur: '14 days' },
      { name: 'Cetirizine', dose: '10mg', freq: 'Once daily at night', dur: '7 days' },
    ];

    const matched = knownMeds.filter(
      (m) => text.toLowerCase().includes(m.name.toLowerCase())
    );

    if (matched.length > 0) {
      return matched.map((m) => ({
        medicineName: m.name,
        dosage: m.dose,
        frequency: m.freq,
        duration: m.dur,
        instructions: 'Take as directed with water.',
      }));
    }

    // Fallback split lines
    const lines = text.split('\n').filter((l) => l.trim().length > 3);
    return lines.slice(0, 3).map((l) => ({
      medicineName: l.trim(),
      dosage: 'Standard Dosage',
      frequency: 'Twice daily',
      duration: '5 days',
      instructions: 'Take as directed after meals.',
    }));
  }
}
