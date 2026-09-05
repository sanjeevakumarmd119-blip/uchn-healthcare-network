import prisma from '../db';

export interface LogAuditParams {
  actorId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, any>;
}

export class AuditService {
  static async log(params: LogAuditParams) {
    try {
      return await prisma.auditLog.create({
        data: {
          actorId: params.actorId || null,
          action: params.action,
          entity: params.entity,
          entityId: params.entityId || null,
          ipAddress: params.ipAddress || null,
          userAgent: params.userAgent || null,
          metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        },
      });
    } catch (error) {
      console.error('Failed to write audit log:', error);
      return null;
    }
  }

  static async getLogs(limit = 50, offset = 0) {
    return prisma.auditLog.findMany({
      take: limit,
      skip: offset,
      orderBy: { timestamp: 'desc' },
      include: {
        actor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });
  }
}

