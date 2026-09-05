import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../src/server/db';
import { EmergencyService } from '../src/server/services/emergency.service';

describe('Emergency Service & Multi-Stage Lifecycle', () => {
  let patient: any;
  let clinic: any;
  let createdEmergencyId = '';

  beforeAll(async () => {
    patient = await prisma.patientProfile.findFirst({
      include: { user: true },
    });
    clinic = await prisma.clinic.findFirst();
  });

  afterAll(async () => {
    if (createdEmergencyId) {
      await prisma.emergencyStatusHistory.deleteMany({
        where: { emergencyCaseId: createdEmergencyId },
      });
      await prisma.emergencyCase.delete({
        where: { id: createdEmergencyId },
      }).catch(() => {});
    }
  });

  it('should create an EmergencyCase in PENDING status and log initial status history', async () => {
    const emg = await EmergencyService.createEmergency(
      patient.id,
      patient.user.id,
      {
        latitude: 37.7749,
        longitude: -122.4194,
        address: '8th & Market Street',
        severity: 'CRITICAL',
        emergencyType: 'Acute Cardiac Event',
        description: 'Severe chest discomfort and dizziness',
      }
    );

    expect(emg).toBeDefined();
    expect(emg.caseNumber.startsWith('UCHN-EMG-')).toBe(true);
    expect(emg.status).toBe('PENDING');
    expect(emg.clinicId).toBeTruthy();

    createdEmergencyId = emg.id;

    // Verify history record created
    const history = await prisma.emergencyStatusHistory.findMany({
      where: { emergencyCaseId: emg.id },
    });
    expect(history.length).toBe(1);
    expect(history[0].status).toBe('PENDING');
  });

  it('should transition emergency status through ASSIGNED -> AMBULANCE_DISPATCHED -> RESOLVED with audit records', async () => {
    // 1. Assign
    const assigned = await EmergencyService.updateEmergencyStatus(
      createdEmergencyId,
      { status: 'ASSIGNED', notes: 'Assigned to Trauma Unit 1' },
      patient.user.id
    );
    expect(assigned.status).toBe('ASSIGNED');

    // 2. Dispatch Ambulance
    const dispatched = await EmergencyService.updateEmergencyStatus(
      createdEmergencyId,
      {
        status: 'AMBULANCE_DISPATCHED',
        ambulanceId: 'AMB-TEST-99',
        notes: 'Ambulance en route',
      },
      patient.user.id
    );
    expect(dispatched.status).toBe('AMBULANCE_DISPATCHED');
    expect(dispatched.ambulanceId).toBe('AMB-TEST-99');

    // 3. Resolve
    const resolved = await EmergencyService.updateEmergencyStatus(
      createdEmergencyId,
      { status: 'RESOLVED', notes: 'Patient safely stabilized' },
      patient.user.id
    );
    expect(resolved.status).toBe('RESOLVED');

    // Verify all history transitions are stored in database
    const allHistory = await prisma.emergencyStatusHistory.findMany({
      where: { emergencyCaseId: createdEmergencyId },
      orderBy: { timestamp: 'asc' },
    });
    expect(allHistory.length).toBe(4);
    expect(allHistory.map((h) => h.status)).toEqual([
      'PENDING',
      'ASSIGNED',
      'AMBULANCE_DISPATCHED',
      'RESOLVED',
    ]);
  });
});

