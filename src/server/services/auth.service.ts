import bcrypt from 'bcryptjs';
import prisma from '../db';
import { generateAccessToken, generateRefreshToken, TokenPayload } from '../auth/jwt';
import { RegisterInput, LoginInput } from '../validators/auth.validator';
import { AuditService } from './audit.service';

export class AuthService {
  static async register(input: RegisterInput, ipAddress?: string, userAgent?: string) {
    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existingUser) {
      throw new Error('A user with this email already exists.');
    }

    // 2. Hash password
    const passwordHash = await bcrypt.hash(input.password, 10);

    // 3. Create user and role-specific profile in transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: input.email.toLowerCase(),
          passwordHash,
          role: input.role,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone || null,
          status: 'ACTIVE',
        },
      });

      let patientProfileId: string | null = null;
      let doctorProfileId: string | null = null;
      let clinicId: string | null = null;

      if (input.role === 'PATIENT') {
        const patient = await tx.patientProfile.create({
          data: {
            userId: user.id,
            dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
            gender: input.gender || null,
            bloodGroup: input.bloodGroup || null,
            emergencyContactName: input.emergencyContactName || null,
            emergencyContactPhone: input.emergencyContactPhone || null,
            address: input.address || null,
            city: input.city || 'San Francisco',
            latitude: input.latitude || 37.7749,
            longitude: input.longitude || -122.4194,
          },
        });
        patientProfileId = patient.id;
      } else if (input.role === 'DOCTOR') {
        // Find default clinic if not provided
        let targetClinicId = input.clinicId;
        if (!targetClinicId) {
          const firstClinic = await tx.clinic.findFirst();
          targetClinicId = firstClinic?.id || '';
        }
        clinicId = targetClinicId;

        const doctor = await tx.doctorProfile.create({
          data: {
            userId: user.id,
            licenseNumber: input.licenseNumber || `MD-${Math.floor(10000 + Math.random() * 90000)}`,
            bio: input.bio || 'Qualified medical practitioner.',
            consultationFee: input.consultationFee || 50.0,
            clinicId: targetClinicId,
            isAvailable: true,
          },
        });
        doctorProfileId = doctor.id;

        // Attach specialties if specified
        if (input.specialtyIds && input.specialtyIds.length > 0) {
          for (const sId of input.specialtyIds) {
            await tx.doctorSpecialty.create({
              data: {
                doctorId: doctor.id,
                specialtyId: sId,
              },
            });
          }
        }
      } else if (input.role === 'CLINIC_ADMIN') {
        const firstClinic = await tx.clinic.findFirst();
        if (firstClinic) {
          clinicId = firstClinic.id;
          await tx.clinicStaff.create({
            data: {
              clinicId: firstClinic.id,
              userId: user.id,
              role: 'ADMIN',
            },
          });
        }
      }

      return { user, patientProfileId, doctorProfileId, clinicId };
    });

    const tokenPayload: TokenPayload = {
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role as any,
      firstName: result.user.firstName,
      lastName: result.user.lastName,
      clinicId: result.clinicId,
      patientProfileId: result.patientProfileId,
      doctorProfileId: result.doctorProfileId,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken({ userId: result.user.id });

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await prisma.refreshToken.create({
      data: {
        userId: result.user.id,
        token: refreshToken,
        expiresAt,
      },
    });

    await AuditService.log({
      actorId: result.user.id,
      action: 'USER_REGISTER',
      entity: 'User',
      entityId: result.user.id,
      ipAddress,
      userAgent,
      metadata: { role: result.user.role, email: result.user.email },
    });

    return {
      user: tokenPayload,
      accessToken,
      refreshToken,
    };
  }

  static async login(input: LoginInput, ipAddress?: string, userAgent?: string) {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
      include: {
        patientProfile: true,
        doctorProfile: true,
        clinicStaff: true,
      },
    });

    if (!user) {
      throw new Error('Invalid email or password.');
    }

    if (user.status !== 'ACTIVE') {
      throw new Error('This account has been suspended or deactivated.');
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid email or password.');
    }

    const clinicId = user.doctorProfile?.clinicId || user.clinicStaff[0]?.clinicId || null;

    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as any,
      firstName: user.firstName,
      lastName: user.lastName,
      clinicId,
      patientProfileId: user.patientProfile?.id || null,
      doctorProfileId: user.doctorProfile?.id || null,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken({ userId: user.id });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    });

    await AuditService.log({
      actorId: user.id,
      action: 'USER_LOGIN',
      entity: 'User',
      entityId: user.id,
      ipAddress,
      userAgent,
      metadata: { role: user.role, email: user.email },
    });

    return {
      user: tokenPayload,
      accessToken,
      refreshToken,
    };
  }

  static async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: { userId, token: refreshToken },
        data: { revoked: true },
      });
    }

    await AuditService.log({
      actorId: userId,
      action: 'USER_LOGOUT',
      entity: 'User',
      entityId: userId,
    });

    return { success: true };
  }

  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        patientProfile: true,
        doctorProfile: {
          include: {
            clinic: true,
            doctorSpecialties: {
              include: { specialty: true },
            },
          },
        },
        clinicStaff: {
          include: { clinic: true },
        },
      },
    });

    return user;
  }
}

