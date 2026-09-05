export type UserRole = 'PATIENT' | 'DOCTOR' | 'CLINIC_ADMIN';

export interface UserSession {
  userId: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  clinicId?: string | null;
  patientProfileId?: string | null;
  doctorProfileId?: string | null;
}

export interface Specialty {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
}

export interface Clinic {
  id: string;
  name: string;
  address: string;
  city: string;
  state?: string | null;
  postalCode?: string | null;
  latitude: number;
  longitude: number;
  phone: string;
  email: string;
  emergencyHelpline?: string | null;
  operatingHours?: string | null;
  isActive: boolean;
}

export interface Doctor {
  id: string;
  userId: string;
  licenseNumber: string;
  bio?: string | null;
  consultationFee: number;
  experienceYears: number;
  rating: number;
  clinicId: string;
  isAvailable: boolean;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    avatarUrl?: string | null;
  };
  clinic?: Clinic;
  doctorSpecialties: {
    specialty: Specialty;
  }[];
  distanceKm?: number | null;
}

export interface AppointmentSlot {
  id: string;
  doctorId: string;
  clinicId: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  maxCapacity: number;
  currentBookings: number;
  price: number;
}

export interface Appointment {
  id: string;
  appointmentNumber: string;
  patientId: string;
  doctorId: string;
  clinicId: string;
  slotId?: string | null;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: 'AVAILABLE' | 'HELD' | 'CONFIRMED' | 'CHECKED_IN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  reason?: string | null;
  notes?: string | null;
  isEmergency: boolean;
  createdAt: string;
  patient?: {
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone?: string | null;
    };
  };
  doctor?: Doctor;
  clinic?: Clinic;
  waitingQueueEntry?: WaitingQueueEntry | null;
}

export interface WaitingQueueEntry {
  id: string;
  appointmentId?: string | null;
  patientId: string;
  clinicId: string;
  doctorId: string;
  queueNumber: number;
  status: 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED' | 'CANCELLED';
  checkInTime: string;
  startTime?: string | null;
  endTime?: string | null;
  estimatedWaitMinutes: number;
  triagePriority: 'NORMAL' | 'URGENT' | 'CRITICAL';
  patient?: {
    user: {
      id: string;
      firstName: string;
      lastName: string;
      phone?: string | null;
    };
  };
  doctor?: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
  appointment?: Appointment | null;
  clinic?: Clinic;
}

export type EmergencyStatus = 'PENDING' | 'ASSIGNED' | 'AMBULANCE_DISPATCHED' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED';

export interface EmergencyStatusHistory {
  id: string;
  emergencyCaseId: string;
  status: EmergencyStatus;
  changedById?: string | null;
  changedBy?: {
    firstName: string;
    lastName: string;
    role: string;
  } | null;
  notes?: string | null;
  timestamp: string;
}

export interface EmergencyCase {
  id: string;
  caseNumber: string;
  patientId: string;
  clinicId?: string | null;
  doctorId?: string | null;
  latitude: number;
  longitude: number;
  address?: string | null;
  severity: 'CRITICAL' | 'SEVERE' | 'MODERATE';
  emergencyType: string;
  description?: string | null;
  status: EmergencyStatus;
  ambulanceId?: string | null;
  notes?: string | null;
  createdAt: string;
  patient?: {
    user: {
      id: string;
      firstName: string;
      lastName: string;
      phone?: string | null;
      email: string;
    };
  };
  clinic?: Clinic | null;
  doctor?: {
    user: {
      firstName: string;
      lastName: string;
    };
  } | null;
  statusHistory?: EmergencyStatusHistory[];
}

export interface MedicineInventoryItem {
  id: string;
  clinicId: string;
  medicineId: string;
  sku: string;
  batchNumber: string;
  quantity: number;
  minThreshold: number;
  expiryDate: string;
  unitPrice: number;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'EXPIRED';
  medicine: Medicine;
  clinic?: Clinic;
  transactions?: {
    id: string;
    type: string;
    quantityChange: number;
    previousQuantity: number;
    newQuantity: number;
    reason?: string | null;
    timestamp: string;
    performedBy?: {
      firstName: string;
      lastName: string;
    } | null;
  }[];
}

export interface Medicine {
  id: string;
  name: string;
  genericName: string;
  category: string;
  description?: string | null;
  dosageForm: string;
  strength: string;
  manufacturer?: string | null;
  totalStock?: number;
  isAvailable?: boolean;
  clinics?: {
    inventoryId: string;
    clinicId: string;
    clinicName: string;
    clinicAddress: string;
    quantity: number;
    minThreshold: number;
    unitPrice: number;
    status: string;
    expiryDate: string;
    distanceKm?: number | null;
  }[];
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'APPOINTMENT' | 'EMERGENCY' | 'INVENTORY' | 'QUEUE' | 'SYSTEM';
  isRead: boolean;
  link?: string | null;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  actorId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: string | null;
  timestamp: string;
  actor?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  } | null;
}

