import prisma from '../db';
import { calculateDistanceKm } from '../../lib/geo';

export interface DoctorFilterParams {
  search?: string;
  specialtyId?: string;
  clinicId?: string;
  userLat?: number;
  userLng?: number;
  maxDistanceKm?: number;
}

export class DoctorService {
  static async getSpecialties() {
    return prisma.specialty.findMany({
      orderBy: { name: 'asc' },
    });
  }

  static async getDoctors(params: DoctorFilterParams) {
    const { search, specialtyId, clinicId, userLat, userLng, maxDistanceKm } = params;

    const whereClause: any = {
      isAvailable: true,
      user: {
        status: 'ACTIVE',
      },
    };

    if (clinicId) {
      whereClause.clinicId = clinicId;
    }

    if (specialtyId) {
      whereClause.doctorSpecialties = {
        some: {
          specialtyId: specialtyId,
        },
      };
    }

    if (search) {
      whereClause.OR = [
        { user: { firstName: { contains: search } } },
        { user: { lastName: { contains: search } } },
        { bio: { contains: search } },
        { clinic: { name: { contains: search } } },
      ];
    }

    const doctors = await prisma.doctorProfile.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
        clinic: true,
        doctorSpecialties: {
          include: {
            specialty: true,
          },
        },
      },
      orderBy: {
        rating: 'desc',
      },
    });

    // Compute approximate distance if user coordinates provided
    const doctorsWithDistance = doctors.map((doc) => {
      let distanceKm: number | null = null;
      if (userLat !== undefined && userLng !== undefined && doc.clinic) {
        distanceKm = calculateDistanceKm(userLat, userLng, doc.clinic.latitude, doc.clinic.longitude);
      }
      return {
        ...doc,
        distanceKm: distanceKm !== null ? parseFloat(distanceKm.toFixed(1)) : null,
      };
    });

    if (maxDistanceKm && userLat && userLng) {
      return doctorsWithDistance.filter(
        (d) => d.distanceKm !== null && d.distanceKm <= maxDistanceKm
      );
    }

    return doctorsWithDistance;
  }

  static async getDoctorById(doctorId: string, userLat?: number, userLng?: number) {
    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: doctorId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
        clinic: true,
        doctorSpecialties: {
          include: {
            specialty: true,
          },
        },
      },
    });

    if (!doctor) return null;

    let distanceKm: number | null = null;
    if (userLat !== undefined && userLng !== undefined && doctor.clinic) {
      distanceKm = calculateDistanceKm(userLat, userLng, doctor.clinic.latitude, doctor.clinic.longitude);
    }

    return {
      ...doctor,
      distanceKm: distanceKm !== null ? parseFloat(distanceKm.toFixed(1)) : null,
    };
  }

  static async getDoctorSlots(doctorId: string, dateStr?: string) {
    const where: any = {
      doctorId,
      isBooked: false,
    };

    if (dateStr) {
      const targetDate = new Date(dateStr);
      targetDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(targetDate);
      nextDay.setDate(targetDate.getDate() + 1);

      where.startTime = {
        gte: targetDate,
        lt: nextDay,
      };
    } else {
      // Return slots from today onwards
      const now = new Date();
      where.startTime = { gte: now };
    }

    return prisma.appointmentSlot.findMany({
      where,
      orderBy: { startTime: 'asc' },
    });
  }
}

