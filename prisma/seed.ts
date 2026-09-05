import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting UCHN database seed...');

  // 1. Clean existing records in reverse dependency order
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.medicineStockTransaction.deleteMany();
  await prisma.medicineRequest.deleteMany();
  await prisma.medicineInventory.deleteMany();
  await prisma.medicine.deleteMany();
  await prisma.emergencyStatusHistory.deleteMany();
  await prisma.emergencyCase.deleteMany();
  await prisma.waitingQueue.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.appointmentSlot.deleteMany();
  await prisma.clinicStaff.deleteMany();
  await prisma.doctorSpecialty.deleteMany();
  await prisma.specialty.deleteMany();
  await prisma.doctorProfile.deleteMany();
  await prisma.patientProfile.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.clinic.deleteMany();

  const defaultPasswordHash = await bcrypt.hash('Uchn2026!', 10);
  const patientPasswordHash = await bcrypt.hash('Patient123!', 10);
  const doctorPasswordHash = await bcrypt.hash('Doctor123!', 10);
  const adminPasswordHash = await bcrypt.hash('Admin123!', 10);

  // 2. Seed Clinics
  const clinic1 = await prisma.clinic.create({
    data: {
      name: 'Central Metro Health & Trauma Center',
      address: '742 Evergreen Terrace, Medical District',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94103',
      latitude: 37.7749,
      longitude: -122.4194,
      phone: '+1 (415) 555-0100',
      email: 'contact@centralmetrohealth.org',
      emergencyHelpline: '+1 (415) 911-0100',
      operatingHours: '24/7 Emergency & Outpatient 08:00 - 20:00',
      isActive: true,
    },
  });

  const clinic2 = await prisma.clinic.create({
    data: {
      name: 'St. Jude Comprehensive Care Clinic',
      address: '1050 Mission Street, Suite 400',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94103',
      latitude: 37.7833,
      longitude: -122.4167,
      phone: '+1 (415) 555-0200',
      email: 'care@stjudeclinic.org',
      emergencyHelpline: '+1 (415) 911-0200',
      operatingHours: 'Mon-Sat 08:00 - 18:00',
      isActive: true,
    },
  });

  const clinic3 = await prisma.clinic.create({
    data: {
      name: 'Bay Area Urgent & Family Medical',
      address: '2200 Castro Street',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94114',
      latitude: 37.7690,
      longitude: -122.4467,
      phone: '+1 (415) 555-0300',
      email: 'info@bayareaurgentcare.org',
      emergencyHelpline: '+1 (415) 911-0300',
      operatingHours: '07:00 - 22:00 Daily',
      isActive: true,
    },
  });

  console.log('✅ Created 3 clinics');

  // 3. Seed Specialties
  const specialtiesData = [
    { name: 'General Medicine', description: 'Primary healthcare and preventive wellness', icon: 'Stethoscope' },
    { name: 'Cardiology', description: 'Heart, cardiovascular health, and hypertension care', icon: 'HeartPulse' },
    { name: 'Pediatrics', description: 'Infant, child, and adolescent healthcare', icon: 'Baby' },
    { name: 'Dermatology', description: 'Skin, hair, and cosmetic medical conditions', icon: 'Sparkles' },
    { name: 'Neurology', description: 'Brain, spinal cord, and nervous system disorders', icon: 'Brain' },
    { name: 'Orthopedics', description: 'Bone, joint, and musculoskeletal trauma care', icon: 'Activity' },
    { name: 'Pulmonology', description: 'Lungs, asthma, and respiratory diseases', icon: 'Wind' },
    { name: 'Emergency Medicine', description: 'Urgent, acute trauma, and critical resuscitation', icon: 'ShieldAlert' },
    { name: 'Endocrinology', description: 'Thyroid, diabetes, and hormonal metabolic care', icon: 'Dna' },
    { name: 'ENT (Otolaryngology)', description: 'Ear, nose, throat, and sinus specialists', icon: 'Headphones' },
  ];

  const specialtiesMap = new Map<string, string>();
  for (const s of specialtiesData) {
    const created = await prisma.specialty.create({ data: s });
    specialtiesMap.set(s.name, created.id);
  }
  console.log('✅ Created 10 specialties');

  // 4. Seed Clinic Admins
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@uchn.org',
      passwordHash: adminPasswordHash,
      role: 'CLINIC_ADMIN',
      firstName: 'Arthur',
      lastName: 'Pendleton',
      phone: '+1 (415) 555-1000',
      status: 'ACTIVE',
      clinicStaff: {
        create: {
          clinicId: clinic1.id,
          role: 'ADMIN',
        },
      },
    },
  });

  // 5. Seed Doctors
  const doctorsData = [
    {
      email: 'doctor@uchn.org',
      password: doctorPasswordHash,
      firstName: 'Sarah',
      lastName: 'Jenkins',
      phone: '+1 (415) 555-2001',
      license: 'MD-CA-98214',
      bio: 'Board-certified Cardiologist with over 12 years of experience specializing in preventive cardiology, heart failure, and echocardiography.',
      consultationFee: 75.0,
      experience: 12,
      rating: 4.9,
      clinicId: clinic1.id,
      specialties: ['Cardiology', 'General Medicine'],
    },
    {
      email: 'dr.chen@uchn.org',
      password: defaultPasswordHash,
      firstName: 'Robert',
      lastName: 'Chen',
      phone: '+1 (415) 555-2002',
      license: 'MD-CA-77123',
      bio: 'Compassionate Pediatrician dedicated to neonatal care, childhood development, immunization, and adolescent health.',
      consultationFee: 60.0,
      experience: 8,
      rating: 4.8,
      clinicId: clinic1.id,
      specialties: ['Pediatrics', 'General Medicine'],
    },
    {
      email: 'dr.rostova@uchn.org',
      password: defaultPasswordHash,
      firstName: 'Elena',
      lastName: 'Rostova',
      phone: '+1 (415) 555-2003',
      license: 'MD-CA-55421',
      bio: 'Senior Neurologist with clinical focus on migraine management, epilepsy, stroke rehabilitation, and neuro-diagnostics.',
      consultationFee: 90.0,
      experience: 15,
      rating: 4.9,
      clinicId: clinic1.id,
      specialties: ['Neurology'],
    },
    {
      email: 'dr.vance@uchn.org',
      password: defaultPasswordHash,
      firstName: 'Marcus',
      lastName: 'Vance',
      phone: '+1 (415) 555-2004',
      license: 'MD-CA-44319',
      bio: 'Family physician with deep focus on preventive medicine, chronic disease management, and lifestyle medicine.',
      consultationFee: 50.0,
      experience: 6,
      rating: 4.7,
      clinicId: clinic2.id,
      specialties: ['General Medicine'],
    },
    {
      email: 'dr.sharma@uchn.org',
      password: defaultPasswordHash,
      firstName: 'Ananya',
      lastName: 'Sharma',
      phone: '+1 (415) 555-2005',
      license: 'MD-CA-88902',
      bio: 'Clinical Dermatologist specializing in inflammatory skin diseases, allergy testing, and procedural dermatology.',
      consultationFee: 70.0,
      experience: 10,
      rating: 4.9,
      clinicId: clinic2.id,
      specialties: ['Dermatology'],
    },
    {
      email: 'dr.miller@uchn.org',
      password: defaultPasswordHash,
      firstName: 'David',
      lastName: 'Miller',
      phone: '+1 (415) 555-2006',
      license: 'MD-CA-66512',
      bio: 'Orthopedic Surgeon focused on sports medicine, arthroscopy, joint reconstruction, and spinal ergonomics.',
      consultationFee: 85.0,
      experience: 14,
      rating: 4.8,
      clinicId: clinic1.id,
      specialties: ['Orthopedics'],
    },
    {
      email: 'dr.tanaka@uchn.org',
      password: defaultPasswordHash,
      firstName: 'Lisa',
      lastName: 'Tanaka',
      phone: '+1 (415) 555-2007',
      license: 'MD-CA-33215',
      bio: 'Pulmonologist and critical care physician with expertise in asthma, COPD, and sleep-related breathing disorders.',
      consultationFee: 75.0,
      experience: 9,
      rating: 4.7,
      clinicId: clinic3.id,
      specialties: ['Pulmonology'],
    },
    {
      email: 'dr.wilson@uchn.org',
      password: defaultPasswordHash,
      firstName: 'James',
      lastName: 'Wilson',
      phone: '+1 (415) 555-2008',
      license: 'MD-CA-11294',
      bio: 'Emergency medicine specialist with 11 years managing high-acuity polytrauma and rapid resuscitation.',
      consultationFee: 80.0,
      experience: 11,
      rating: 4.9,
      clinicId: clinic3.id,
      specialties: ['Emergency Medicine', 'General Medicine'],
    },
    {
      email: 'dr.watson@uchn.org',
      password: defaultPasswordHash,
      firstName: 'Emily',
      lastName: 'Watson',
      phone: '+1 (415) 555-2009',
      license: 'MD-CA-99831',
      bio: 'Specialist in metabolic health, type 1 & 2 diabetes management, endocrine hypertension, and thyroid disorders.',
      consultationFee: 65.0,
      experience: 7,
      rating: 4.8,
      clinicId: clinic2.id,
      specialties: ['Endocrinology'],
    },
    {
      email: 'dr.torres@uchn.org',
      password: defaultPasswordHash,
      firstName: 'Michael',
      lastName: 'Torres',
      phone: '+1 (415) 555-2010',
      license: 'MD-CA-55198',
      bio: 'Otolaryngologist handling sinus surgery, hearing conservation, allergy sinusitis, and vocal pathology.',
      consultationFee: 60.0,
      experience: 5,
      rating: 4.6,
      clinicId: clinic3.id,
      specialties: ['ENT (Otolaryngology)'],
    },
  ];

  const doctorProfilesList = [];
  for (const doc of doctorsData) {
    const user = await prisma.user.create({
      data: {
        email: doc.email,
        passwordHash: doc.password,
        role: 'DOCTOR',
        firstName: doc.firstName,
        lastName: doc.lastName,
        phone: doc.phone,
        status: 'ACTIVE',
        doctorProfile: {
          create: {
            licenseNumber: doc.license,
            bio: doc.bio,
            consultationFee: doc.consultationFee,
            experienceYears: doc.experience,
            rating: doc.rating,
            clinicId: doc.clinicId,
            isAvailable: true,
          },
        },
      },
      include: {
        doctorProfile: true,
      },
    });

    if (user.doctorProfile) {
      doctorProfilesList.push(user.doctorProfile);
      for (const specName of doc.specialties) {
        const specId = specialtiesMap.get(specName);
        if (specId) {
          await prisma.doctorSpecialty.create({
            data: {
              doctorId: user.doctorProfile.id,
              specialtyId: specId,
            },
          });
        }
      }
    }
  }
  console.log('✅ Created 10 doctors with specialties');

  // 6. Seed Patients (20 patients)
  const patientNames = [
    { first: 'John', last: 'Doe', email: 'patient@uchn.org', pwd: patientPasswordHash, blood: 'O+', gender: 'MALE', age: 34 },
    { first: 'Jane', last: 'Smith', email: 'jane.smith@example.com', pwd: defaultPasswordHash, blood: 'A+', gender: 'FEMALE', age: 29 },
    { first: 'David', last: 'Kim', email: 'david.kim@example.com', pwd: defaultPasswordHash, blood: 'B+', gender: 'MALE', age: 42 },
    { first: 'Maria', last: 'Garcia', email: 'maria.garcia@example.com', pwd: defaultPasswordHash, blood: 'AB+', gender: 'FEMALE', age: 38 },
    { first: 'Robert', last: 'Taylor', email: 'robert.taylor@example.com', pwd: defaultPasswordHash, blood: 'O-', gender: 'MALE', age: 55 },
    { first: 'Emily', last: 'Brown', email: 'emily.brown@example.com', pwd: defaultPasswordHash, blood: 'A-', gender: 'FEMALE', age: 24 },
    { first: 'James', last: 'Wilson', email: 'james.wilson.pt@example.com', pwd: defaultPasswordHash, blood: 'B-', gender: 'MALE', age: 61 },
    { first: 'Sophia', last: 'Martinez', email: 'sophia.martinez@example.com', pwd: defaultPasswordHash, blood: 'O+', gender: 'FEMALE', age: 31 },
    { first: 'William', last: 'Anderson', email: 'william.anderson@example.com', pwd: defaultPasswordHash, blood: 'A+', gender: 'MALE', age: 47 },
    { first: 'Olivia', last: 'Thomas', email: 'olivia.thomas@example.com', pwd: defaultPasswordHash, blood: 'AB-', gender: 'FEMALE', age: 22 },
    { first: 'Alexander', last: 'Jackson', email: 'alex.jackson@example.com', pwd: defaultPasswordHash, blood: 'O+', gender: 'MALE', age: 36 },
    { first: 'Isabella', last: 'White', email: 'isabella.white@example.com', pwd: defaultPasswordHash, blood: 'A+', gender: 'FEMALE', age: 28 },
    { first: 'Lucas', last: 'Harris', email: 'lucas.harris@example.com', pwd: defaultPasswordHash, blood: 'B+', gender: 'MALE', age: 50 },
    { first: 'Mia', last: 'Clark', email: 'mia.clark@example.com', pwd: defaultPasswordHash, blood: 'O-', gender: 'FEMALE', age: 33 },
    { first: 'Henry', last: 'Lewis', email: 'henry.lewis@example.com', pwd: defaultPasswordHash, blood: 'A-', gender: 'MALE', age: 67 },
    { first: 'Ava', last: 'Robinson', email: 'ava.robinson@example.com', pwd: defaultPasswordHash, blood: 'AB+', gender: 'FEMALE', age: 19 },
    { first: 'Ethan', last: 'Walker', email: 'ethan.walker@example.com', pwd: defaultPasswordHash, blood: 'O+', gender: 'MALE', age: 41 },
    { first: 'Charlotte', last: 'Hall', email: 'charlotte.hall@example.com', pwd: defaultPasswordHash, blood: 'A+', gender: 'FEMALE', age: 35 },
    { first: 'Daniel', last: 'Young', email: 'daniel.young@example.com', pwd: defaultPasswordHash, blood: 'B-', gender: 'MALE', age: 58 },
    { first: 'Amelia', last: 'King', email: 'amelia.king@example.com', pwd: defaultPasswordHash, blood: 'O+', gender: 'FEMALE', age: 26 },
  ];

  const patientProfilesList = [];
  for (const p of patientNames) {
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - p.age);

    const user = await prisma.user.create({
      data: {
        email: p.email,
        passwordHash: p.pwd,
        role: 'PATIENT',
        firstName: p.first,
        lastName: p.last,
        phone: `+1 (415) 555-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'ACTIVE',
        patientProfile: {
          create: {
            dateOfBirth: dob,
            gender: p.gender,
            bloodGroup: p.blood,
            emergencyContactName: `${p.last} Family Contact`,
            emergencyContactPhone: '+1 (415) 555-9999',
            medicalHistory: 'No chronic allergies reported. Regular annual health checkups.',
            allergies: p.first === 'John' ? 'Penicillin (mild)' : 'None known',
            address: `${Math.floor(100 + Math.random() * 900)} Market Street`,
            city: 'San Francisco',
            latitude: 37.7749 + (Math.random() - 0.5) * 0.04,
            longitude: -122.4194 + (Math.random() - 0.5) * 0.04,
          },
        },
      },
      include: {
        patientProfile: true,
      },
    });

    if (user.patientProfile) {
      patientProfilesList.push(user.patientProfile);
    }
  }
  console.log('✅ Created 20 patients (including patient@uchn.org)');

  // 7. Seed Appointment Slots & Appointments
  const today = new Date();
  const timeslots = [
    { start: '09:00', end: '09:30' },
    { start: '09:30', end: '10:00' },
    { start: '10:00', end: '10:30' },
    { start: '10:30', end: '11:00' },
    { start: '11:00', end: '11:30' },
    { start: '14:00', end: '14:30' },
    { start: '14:30', end: '15:00' },
    { start: '15:00', end: '15:30' },
    { start: '15:30', end: '16:00' },
    { start: '16:00', end: '16:30' },
  ];

  let aptSeq = 1000;
  for (const doc of doctorProfilesList) {
    // Create slots for today and next 2 days
    for (let dayOffset = 0; dayOffset <= 2; dayOffset++) {
      const slotDate = new Date(today);
      slotDate.setDate(today.getDate() + dayOffset);
      slotDate.setHours(0, 0, 0, 0);

      for (let i = 0; i < timeslots.length; i++) {
        const ts = timeslots[i];
        const [sh, sm] = ts.start.split(':').map(Number);
        const [eh, em] = ts.end.split(':').map(Number);

        const slotStartTime = new Date(slotDate);
        slotStartTime.setHours(sh, sm, 0, 0);
        const slotEndTime = new Date(slotDate);
        slotEndTime.setHours(eh, em, 0, 0);

        const slot = await prisma.appointmentSlot.create({
          data: {
            doctorId: doc.id,
            clinicId: doc.clinicId,
            startTime: slotStartTime,
            endTime: slotEndTime,
            isBooked: false,
            price: doc.consultationFee,
          },
        });

        // Pre-book first 2 slots for today with realistic patients to show in queue/dashboard
        if (dayOffset === 0 && (i === 0 || i === 1) && patientProfilesList.length > 0) {
          const patient = patientProfilesList[(aptSeq) % patientProfilesList.length];
          aptSeq++;

          await prisma.appointmentSlot.update({
            where: { id: slot.id },
            data: { isBooked: true, currentBookings: 1 },
          });

          const appointment = await prisma.appointment.create({
            data: {
              appointmentNumber: `UCHN-APT-${aptSeq}`,
              patientId: patient.id,
              doctorId: doc.id,
              clinicId: doc.clinicId,
              slotId: slot.id,
              appointmentDate: slotDate,
              startTime: ts.start,
              endTime: ts.end,
              status: i === 0 ? 'CHECKED_IN' : 'CONFIRMED',
              reason: 'Routine cardiovascular and blood pressure review',
              notes: 'Patient reports mild fatigue after exertion.',
            },
          });

          // Add checked in appointment to Waiting Queue
          if (i === 0) {
            await prisma.waitingQueue.create({
              data: {
                appointmentId: appointment.id,
                patientId: patient.id,
                clinicId: doc.clinicId,
                doctorId: doc.id,
                queueNumber: 1,
                status: 'WAITING',
                checkInTime: new Date(Date.now() - 12 * 60 * 1000), // checked in 12 mins ago
                estimatedWaitMinutes: 10,
                triagePriority: 'NORMAL',
              },
            });
          }
        }
      }
    }
  }
  console.log('✅ Created appointment slots, active appointments, and waiting queue');

  // 8. Seed Medicines & Inventory (22 medicines)
  const medicinesData = [
    { name: 'Amoxicillin Trihydrate', generic: 'Amoxicillin', category: 'Antibiotics', form: 'Capsule', strength: '500mg', mfr: 'Sandoz Pharma' },
    { name: 'Azithromycin Zithromax', generic: 'Azithromycin', category: 'Antibiotics', form: 'Tablet', strength: '250mg', mfr: 'Pfizer' },
    { name: 'Ciprofloxacin HCL', generic: 'Ciprofloxacin', category: 'Antibiotics', form: 'Tablet', strength: '500mg', mfr: 'Bayer' },
    { name: 'Paracetamol Extra', generic: 'Acetaminophen', category: 'Analgesics', form: 'Tablet', strength: '500mg', mfr: 'GSK' },
    { name: 'Ibuprofen Rapid Relief', generic: 'Ibuprofen', category: 'Analgesics', form: 'Capsule', strength: '400mg', mfr: 'Advil Inc' },
    { name: 'Tramadol HCL', generic: 'Tramadol', category: 'Analgesics', form: 'Tablet', strength: '50mg', mfr: 'Grünenthal' },
    { name: 'Lipitor (Atorvastatin)', generic: 'Atorvastatin Calcium', category: 'Cardiovascular', form: 'Tablet', strength: '20mg', mfr: 'Pfizer' },
    { name: 'Amlodipine Besylate', generic: 'Amlodipine', category: 'Cardiovascular', form: 'Tablet', strength: '5mg', mfr: 'Norvasc' },
    { name: 'Lisinopril Cardio', generic: 'Lisinopril', category: 'Cardiovascular', form: 'Tablet', strength: '10mg', mfr: 'AstraZeneca' },
    { name: 'Metoprolol Succinate', generic: 'Metoprolol', category: 'Cardiovascular', form: 'Tablet', strength: '50mg', mfr: 'Novartis' },
    { name: 'Ventolin HFA Inhaler', generic: 'Albuterol Sulfate', category: 'Respiratory', form: 'Inhaler', strength: '90mcg/actuation', mfr: 'GSK' },
    { name: 'Symbicort Turbuhaler', generic: 'Budesonide / Formoterol', category: 'Respiratory', form: 'Inhaler', strength: '160/4.5mcg', mfr: 'AstraZeneca' },
    { name: 'Glucophage XR', generic: 'Metformin Hydrochloride', category: 'Diabetes', form: 'Tablet', strength: '500mg', mfr: 'Merck Serono' },
    { name: 'Lantus SoloStar Pen', generic: 'Insulin Glargine', category: 'Diabetes', form: 'Injection', strength: '100 units/ml (3ml)', mfr: 'Sanofi' },
    { name: 'Januvia', generic: 'Sitagliptin', category: 'Diabetes', form: 'Tablet', strength: '100mg', mfr: 'MSD' },
    { name: 'Nexium Control', generic: 'Esomeprazole Magnesium', category: 'Gastrointestinal', form: 'Capsule', strength: '40mg', mfr: 'AstraZeneca' },
    { name: 'Ondansetron Rapid', generic: 'Ondansetron', category: 'Gastrointestinal', form: 'Tablet', strength: '4mg', mfr: 'Novartis' },
    { name: 'Zyrtec Relief', generic: 'Cetirizine Hydrochloride', category: 'Antihistamines', form: 'Tablet', strength: '10mg', mfr: 'J&J Healthcare' },
    { name: 'EpiPen Auto-Injector', generic: 'Epinephrine', category: 'Emergency', form: 'Injection', strength: '0.3mg', mfr: 'Viatris' },
    { name: 'Naloxone HCL (Narcan)', generic: 'Naloxone', category: 'Emergency', form: 'Injection', strength: '4mg Nasal Spray', mfr: 'Emergent Bio' },
    { name: 'Nitroglycerin Sublingual', generic: 'Nitroglycerin', category: 'Emergency', form: 'Tablet', strength: '0.4mg', mfr: 'Pfizer' },
    { name: 'Dexamethasone Sodium', generic: 'Dexamethasone', category: 'Emergency', form: 'Injection', strength: '4mg/ml', mfr: 'Fresenius Kabi' },
  ];

  let medCount = 0;
  for (const m of medicinesData) {
    medCount++;
    const med = await prisma.medicine.create({
      data: {
        name: m.name,
        genericName: m.generic,
        category: m.category,
        description: `Clinically approved formulation of ${m.generic} for ${m.category.toLowerCase()} indications.`,
        dosageForm: m.form,
        strength: m.strength,
        manufacturer: m.mfr,
      },
    });

    // Create inventory across clinics with different realistic stock levels:
    // Some IN_STOCK (qty 40-100), some LOW_STOCK (qty 3-8, threshold 10), and some OUT_OF_STOCK (qty 0)
    const clinics = [clinic1, clinic2, clinic3];
    for (let cIdx = 0; cIdx < clinics.length; cIdx++) {
      const clinic = clinics[cIdx];
      let qty = 45;
      let status = 'IN_STOCK';

      if (medCount === 3 && cIdx === 0) {
        // Ciprofloxacin at Clinic 1 is LOW_STOCK
        qty = 4;
        status = 'LOW_STOCK';
      } else if (medCount === 19 && cIdx === 0) {
        // EpiPen at Clinic 1 is LOW_STOCK
        qty = 3;
        status = 'LOW_STOCK';
      } else if (medCount === 6 && cIdx === 1) {
        // Tramadol at Clinic 2 is OUT_OF_STOCK
        qty = 0;
        status = 'OUT_OF_STOCK';
      } else if (medCount === 20 && cIdx === 2) {
        // Narcan at Clinic 3 is LOW_STOCK
        qty = 2;
        status = 'LOW_STOCK';
      }

      const expiry = new Date();
      expiry.setFullYear(expiry.getFullYear() + (medCount % 2 === 0 ? 2 : 1));

      const inv = await prisma.medicineInventory.create({
        data: {
          clinicId: clinic.id,
          medicineId: med.id,
          sku: `SKU-${clinic.id.slice(0, 4).toUpperCase()}-${medCount.toString().padStart(3, '0')}`,
          batchNumber: `BAT-2026-${(100 + medCount * 7 + cIdx).toString()}`,
          quantity: qty,
          minThreshold: 10,
          expiryDate: expiry,
          unitPrice: parseFloat((12.5 + (medCount * 1.5)).toFixed(2)),
          status: status,
        },
      });

      // Log initial stock transaction
      await prisma.medicineStockTransaction.create({
        data: {
          inventoryId: inv.id,
          type: 'RECEIVED',
          quantityChange: qty,
          previousQuantity: 0,
          newQuantity: qty,
          reason: 'Initial batch stocking for clinical pharmacy operations',
          performedById: adminUser.id,
        },
      });
    }
  }
  console.log('✅ Created 22 medicines with inventory across 3 clinics, stock transactions, and low-stock alerts');

  // 8b. Seed Patient Medicine Purchase & Dispense Requests
  const allMeds = await prisma.medicine.findMany({ take: 5 });
  if (patientProfilesList.length >= 3 && allMeds.length >= 4) {
    await prisma.medicineRequest.createMany({
      data: [
        {
          patientId: patientProfilesList[0].id, // John Doe
          medicineId: allMeds[0].id, // Amoxicillin
          clinicId: clinic1.id,
          quantity: 2,
          status: 'DISPENSED',
          deliveryOption: 'PICKUP',
          notes: 'Prescribed for acute upper respiratory infection.',
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        },
        {
          patientId: patientProfilesList[1].id, // Jane Smith
          medicineId: allMeds[3].id, // Paracetamol Extra
          clinicId: clinic1.id,
          quantity: 1,
          status: 'READY_FOR_PICKUP',
          deliveryOption: 'PICKUP',
          notes: 'Post-consultation symptom relief medication.',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
        {
          patientId: patientProfilesList[2].id, // David Kim
          medicineId: allMeds[1].id, // Azithromycin
          clinicId: clinic2.id,
          quantity: 1,
          status: 'PENDING',
          deliveryOption: 'HOME_DELIVERY',
          notes: 'Online prescription reservation.',
          createdAt: new Date(Date.now() - 45 * 60 * 1000),
        },
      ],
    });
    console.log('✅ Created initial patient medicine purchase & dispense records');
  }

  // 9. Seed Emergency Cases
  const emergencyPatient1 = patientProfilesList[0]; // John Doe
  const emergencyPatient2 = patientProfilesList[3]; // Maria Garcia

  const activeEmergency = await prisma.emergencyCase.create({
    data: {
      caseNumber: 'UCHN-EMG-8091',
      patientId: emergencyPatient1.id,
      clinicId: clinic1.id,
      doctorId: doctorProfilesList[0].id,
      latitude: 37.7752,
      longitude: -122.4180,
      address: 'Near Civic Center Plaza, 8th & Market',
      severity: 'CRITICAL',
      emergencyType: 'Acute Chest Pain / Cardiac',
      description: 'Severe sudden substernal chest discomfort radiating to left arm. Shortness of breath.',
      status: 'ASSIGNED',
      ambulanceId: 'AMB-UNIT-104',
      notes: 'Paramedic team assigned. ETA 6 minutes.',
    },
  });

  await prisma.emergencyStatusHistory.create({
    data: {
      emergencyCaseId: activeEmergency.id,
      status: 'PENDING',
      notes: 'Emergency SOS request dispatched by patient.',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
    },
  });

  await prisma.emergencyStatusHistory.create({
    data: {
      emergencyCaseId: activeEmergency.id,
      status: 'ASSIGNED',
      changedById: adminUser.id,
      notes: 'Case assigned to Dr. Sarah Jenkins and Central Metro Trauma response team.',
      timestamp: new Date(Date.now() - 8 * 60 * 1000),
    },
  });

  // Resolved emergency case for history demo
  const resolvedEmergency = await prisma.emergencyCase.create({
    data: {
      caseNumber: 'UCHN-EMG-8088',
      patientId: emergencyPatient2.id,
      clinicId: clinic1.id,
      doctorId: doctorProfilesList[0].id,
      latitude: 37.7810,
      longitude: -122.4140,
      address: '550 Howard Street, San Francisco',
      severity: 'SEVERE',
      emergencyType: 'Asthma Attack / Hypoxia',
      description: 'Acute wheezing and distress. Oxygen saturation 89%.',
      status: 'RESOLVED',
      ambulanceId: 'AMB-UNIT-102',
      notes: 'Nebulized bronchodilator administered. Patient stabilized and transferred to clinic observation.',
    },
  });

  await prisma.emergencyStatusHistory.createMany({
    data: [
      {
        emergencyCaseId: resolvedEmergency.id,
        status: 'PENDING',
        notes: 'Emergency requested.',
        timestamp: new Date(Date.now() - 120 * 60 * 1000),
      },
      {
        emergencyCaseId: resolvedEmergency.id,
        status: 'ASSIGNED',
        changedById: adminUser.id,
        notes: 'Assigned to Dr. Sarah Jenkins.',
        timestamp: new Date(Date.now() - 110 * 60 * 1000),
      },
      {
        emergencyCaseId: resolvedEmergency.id,
        status: 'AMBULANCE_DISPATCHED',
        changedById: adminUser.id,
        notes: 'Ambulance Unit 102 dispatched with oxygen kit.',
        timestamp: new Date(Date.now() - 95 * 60 * 1000),
      },
      {
        emergencyCaseId: resolvedEmergency.id,
        status: 'IN_PROGRESS',
        notes: 'Medics on site, administering treatment.',
        timestamp: new Date(Date.now() - 75 * 60 * 1000),
      },
      {
        emergencyCaseId: resolvedEmergency.id,
        status: 'RESOLVED',
        notes: 'Patient stable, vitals normal.',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
      },
    ],
  });
  console.log('✅ Created emergency cases with complete status history');

  // 10. Seed In-App Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: adminUser.id,
        title: 'Low Stock Alert: Ciprofloxacin HCL',
        message: 'Inventory batch BAT-2026-121 has fallen to 4 units (Threshold: 10). Restocking recommended.',
        type: 'INVENTORY',
        isRead: false,
        link: '/doctor/inventory',
      },
      {
        userId: adminUser.id,
        title: 'Emergency Case Assigned',
        message: 'Emergency Case UCHN-EMG-8091 (Cardiac) assigned to Dr. Sarah Jenkins.',
        type: 'EMERGENCY',
        isRead: false,
        link: '/doctor/emergency',
      },
      {
        userId: emergencyPatient1.userId,
        title: 'Emergency Assistance Assigned',
        message: 'Your emergency assistance request UCHN-EMG-8091 has been assigned to Central Metro Health Center.',
        type: 'EMERGENCY',
        isRead: false,
        link: '/patient/emergency',
      },
      {
        userId: emergencyPatient1.userId,
        title: 'Appointment Confirmed',
        message: 'Your appointment UCHN-APT-1001 with Dr. Sarah Jenkins is scheduled for today.',
        type: 'APPOINTMENT',
        isRead: true,
        link: '/patient/appointments',
      },
    ],
  });
  console.log('✅ Created sample notifications');

  // 11. Seed Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        actorId: adminUser.id,
        action: 'USER_LOGIN',
        entity: 'User',
        entityId: adminUser.id,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        metadata: JSON.stringify({ role: 'CLINIC_ADMIN', clinic: clinic1.name }),
      },
      {
        actorId: adminUser.id,
        action: 'EMERGENCY_STATUS_CHANGED',
        entity: 'EmergencyCase',
        entityId: activeEmergency.id,
        metadata: JSON.stringify({ from: 'PENDING', to: 'ASSIGNED', caseNumber: 'UCHN-EMG-8091' }),
      },
    ],
  });
  console.log('✅ Created audit logs');

  console.log('\n🎉 UCHN Database seeded successfully!');
  console.log('--------------------------------------------------');
  console.log('DEMO ACCOUNTS READY:');
  console.log('1. Patient:      patient@uchn.org      / Patient123!');
  console.log('2. Doctor:       doctor@uchn.org       / Doctor123!');
  console.log('3. Clinic Admin: admin@uchn.org        / Admin123!');
  console.log('--------------------------------------------------\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

