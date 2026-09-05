import { describe, it, expect } from 'vitest';
import { AIService } from '../src/server/services/ai.service';

describe('AI Health Assistant & Clinical Intelligence Service', () => {
  it('should analyze routine patient symptoms and recommend appropriate clinical specialty', async () => {
    const result = await AIService.analyzeSymptoms('I have a severe migraine with nausea and light sensitivity for 2 days');

    expect(result).toBeDefined();
    expect(result.analysis).toBeDefined();
    expect(result.analysis.urgencyLevel).toBeDefined();
    expect(['LOW', 'MODERATE', 'URGENT', 'CRITICAL_EMERGENCY']).toContain(result.analysis.urgencyLevel);
    expect(result.analysis.summary.length).toBeGreaterThan(10);
    expect(result.analysis.recommendedSpecialty).toBeDefined();
    expect(result.analysis.disclaimer).toBeDefined();
    expect(Array.isArray(result.recommendedDoctors)).toBe(true);
  });

  it('should trigger deterministic emergency guardrails when critical life-threatening symptoms are reported', async () => {
    const result = await AIService.analyzeSymptoms('Patient has severe acute chest pain and numbness in arm and difficulty breathing');

    expect(result).toBeDefined();
    expect(result.analysis.urgencyLevel).toBe('CRITICAL_EMERGENCY');
    expect(result.analysis.requiresEmergencySOS).toBe(true);
  });

  it('should generate structured clinical SOAP documentation for doctors', async () => {
    const soap = await AIService.generateSoapNotes({
      patientName: 'Jane Smith',
      chiefComplaint: 'Acute pharyngitis and fever',
      clinicalObservations: 'Erythematous posterior pharynx, no exudate, cervical lymphadenopathy.',
      vitalSigns: 'BP 118/76, HR 80, Temp 100.4 F',
    });

    expect(soap).toBeDefined();
    expect(soap.subjective).toBeDefined();
    expect(soap.objective).toBeDefined();
    expect(soap.assessment).toBeDefined();
    expect(soap.plan).toBeDefined();
    expect(soap.patientInstructions).toBeDefined();
  });

  it('should parse prescription text and check medicine availability', async () => {
    const result = await AIService.parsePrescription('Rx: Amoxicillin Trihydrate 500mg tid x 5 days, Paracetamol 650mg');

    expect(result).toBeDefined();
    expect(Array.isArray(result.items)).toBe(true);
    expect(result.items.length).toBeGreaterThanOrEqual(1);
    expect(result.items[0].medicineName).toBeDefined();
    expect(result.summary).toBeDefined();
  });

  it('should analyze symptoms with patient context (age, allergies, location)', async () => {
    const result = await AIService.analyzeSymptoms(
      'Child has mild fever and runny nose',
      37.7749,
      -122.4194,
      {
        name: 'Tommy Doe',
        age: 6,
        gender: 'Male',
        allergies: 'Penicillin',
        locationCity: 'San Francisco, CA',
      }
    );

    expect(result).toBeDefined();
    expect(result.analysis.recommendedSpecialty).toBe('Pediatrics');
    expect(result.analysis.requiresEmergencySOS).toBe(false);
  });
});
