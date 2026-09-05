import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../src/server/db';
import { AuthService } from '../src/server/services/auth.service';
import { generateAccessToken, verifyAccessToken } from '../src/server/auth/jwt';

describe('Authentication & Role-Based Authorization Service', () => {
  const testEmail = `test.patient.${Date.now()}@example.com`;
  let createdUserId = '';

  afterAll(async () => {
    if (createdUserId) {
      await prisma.user.delete({ where: { id: createdUserId } }).catch(() => {});
    }
  });

  it('should successfully register a new Patient with hashed password and patient profile', async () => {
    const result = await AuthService.register({
      email: testEmail,
      password: 'SecurePassword123!',
      firstName: 'Test',
      lastName: 'User',
      role: 'PATIENT',
      bloodGroup: 'O+',
      city: 'San Francisco',
    });

    expect(result.user).toBeDefined();
    expect(result.user.email).toBe(testEmail);
    expect(result.user.role).toBe('PATIENT');
    expect(result.user.patientProfileId).toBeTruthy();
    expect(result.accessToken).toBeDefined();

    createdUserId = result.user.userId;

    // Verify password is not plain text in DB
    const dbUser = await prisma.user.findUnique({
      where: { id: createdUserId },
    });
    expect(dbUser?.passwordHash).not.toBe('SecurePassword123!');
    expect(dbUser?.passwordHash.startsWith('$2')).toBe(true);
  });

  it('should reject registration if email is duplicate', async () => {
    await expect(
      AuthService.register({
        email: testEmail,
        password: 'AnotherPassword123!',
        firstName: 'Duplicate',
        lastName: 'User',
        role: 'PATIENT',
      })
    ).rejects.toThrow('A user with this email already exists.');
  });

  it('should authenticate user with valid credentials', async () => {
    const result = await AuthService.login({
      email: testEmail,
      password: 'SecurePassword123!',
    });

    expect(result.user.email).toBe(testEmail);
    expect(result.accessToken).toBeDefined();
  });

  it('should reject login with invalid password', async () => {
    await expect(
      AuthService.login({
        email: testEmail,
        password: 'WrongPassword!',
      })
    ).rejects.toThrow('Invalid email or password.');
  });

  it('should correctly generate and verify JWT token payload with user role', () => {
    const token = generateAccessToken({
      userId: 'user-123',
      email: 'test@uchn.org',
      role: 'DOCTOR',
      firstName: 'Dr. Jane',
      lastName: 'Smith',
    });

    const payload = verifyAccessToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.role).toBe('DOCTOR');
    expect(payload?.userId).toBe('user-123');
  });
});

