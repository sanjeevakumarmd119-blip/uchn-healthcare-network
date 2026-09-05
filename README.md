<div align="center">

# 🏥 UCHN — Unified Care & Health Network
### *Connected Healthcare. Simplified for Everyone.*

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon_Cloud-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech/)
[![Prisma](https://img.shields.io/badge/Prisma_ORM-5.22-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Socket.IO](https://img.shields.io/badge/Socket.io-Real--Time-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PWA Ready](https://img.shields.io/badge/PWA-Mobile_Installable-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![Vitest](https://img.shields.io/badge/Vitest-Tested-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)

<p align="center">
  A production-ready, full-stack healthcare coordination platform and Progressive Web App (PWA) uniting <b>Patients</b>, <b>Doctors</b>, and <b>Clinics</b> into one cohesive real-time ecosystem.
</p>

[Key Features](#-key-features) •
[Architecture](#-system-architecture) •
[PWA Mobile App](#-mobile-app--pwa) •
[Database Model](#-database-schema--data-model) •
[Quick Start](#-quick-start-guide) •
[Demo Accounts](#-ready-to-use-demo-accounts) •
[Security](#-security--data-integrity)

</div>

---

## 📌 Executive Summary & Problem Statement

Modern healthcare ecosystems often suffer from fragmented communication between outpatient booking, pharmacy stock visibility, live waiting rooms, and emergency trauma routing. 

**UCHN (Unified Care & Health Network)** bridges this gap by providing an end-to-end, real-time operating system that connects patients in need with clinical staff and medical resources instantaneously.

---

## 🌟 Key Features

### 1. 🧑‍⚕️ Patient Care & Discovery Portal
* **📍 Automatic Geolocation & Location Switching**: Automatically senses user coordinates via browser Geolocation API and calculates straight-line & driving distances to nearby healthcare clinics using the **Haversine formula**.
* **🩺 Doctor Discovery & Specialist Booking**:
  * Filter doctors by specialty (Cardiology, Pediatrics, Neurology, Orthopedics, General Medicine).
  * Real-time doctor availability and consultation fee transparency.
  * **Atomic Transaction Slot-Locking**: Prevents double-booking race conditions by executing reservations inside isolated database transactions (`SERIALIZABLE` semantics).
* **💊 Live Pharmacy Medicine Inventory Lookup**:
  * Real-time search for prescription drugs, dosage forms (Tablet, Syrup, Injection), strength, and pricing.
  * **Strict Zero-Inventory Guard**: Verifies available batch inventory before approving reservations.
  * Choice of **Pharmacy Counter Pickup** or **Home Delivery**.
* **⏱️ Live Clinic Waiting Queue Tracker**:
  * Real-time token number, queue status (`WAITING`, `IN_CONSULTATION`, `COMPLETED`), and dynamic estimated wait time calculation.

---

### 2. 🚨 High-Priority 5-Stage Emergency SOS Dispatch
A dedicated emergency engine engineered for critical trauma events:
1. **One-Tap Emergency Trigger**: Pre-submission confirmation to prevent accidental triggers with GPS auto-location.
2. **Automatic Clinic Routing**: Assigns the emergency to the nearest available trauma center.
3. **Audio-Visual Doctor Alerts**: Real-time push notification and audio/visual alarm triggered across all active doctor consoles in the target clinic.
4. **Live 5-Stage Interactive Timeline**:
   $$\text{PENDING} \longrightarrow \text{ASSIGNED} \longrightarrow \text{AMBULANCE\_DISPATCHED} \longrightarrow \text{IN\_PROGRESS} \longrightarrow \text{RESOLVED}$$
5. **Ambulance Tracking Metadata**: Displays paramedic driver name, contact number, ambulance vehicle ID, and ETA.

---

### 3. 👨‍⚕️ Clinical & Operational Console (Doctor & Clinic Admin)
* **📊 Comprehensive Clinical Dashboard**: Key metrics on active queue size, today's appointments, critical emergency alerts, and low medicine inventory alerts.
* **👥 Real-Time Patient Queue Management**: Call the next patient, mark consultations as active, update vitals, and complete consultations with 1 click.
* **📦 Medicine Inventory & Batch Control**:
  * Track batch numbers, expiry dates, SKUs, and stock thresholds.
  * Record stock intake (`RECEIVED`), dispensing (`DISPENSED`), and waste write-offs (`ADJUSTED`) with mandatory audit reason logging.
  * Automatic alerts when stock drops below threshold (`LOW_STOCK`) or reaches zero (`OUT_OF_STOCK`).
* **📜 Immutable Security Audit Logs**: Comprehensive historical log recording actor ID, action type, affected entity, timestamp, and metadata payload.

---

### 4. 📱 Mobile Application (Progressive Web App - PWA)
* **📱 1-Tap Mobile Installation**: Installable directly to the home screen on Android, iPhone/iPad (iOS Safari), Chrome, and Edge without going through app stores.
* **🎨 Custom Healthcare Icon**: Custom medical cross + ECG lifeline pulse emblem with adaptive maskable safe-zones.
* **🧭 Mobile Bottom Navigation Bar**: Native-feeling mobile navigation bar with safe-area notch padding (`pb-safe`) and a central red pulsating **SOS Emergency Action Button**.
* **⚡ Standalone Fullscreen Display**: Runs without browser search bars or chrome, offering a native app experience.
* **🔄 Service Worker (`sw.js`)**: Offline asset caching and network-first dynamic data synchronization.

---

## 🏛️ System Architecture

```
                                    +-----------------------------+
                                    |     Client Layer (PWA)      |
                                    |  Next.js 14 App Router /    |
                                    |  React 18 + Tailwind CSS    |
                                    +--------------+--------------+
                                                   |
                        +--------------------------+--------------------------+
                        | HTTP REST API / JSON                                | WebSockets (Socket.IO)
                        v                                                     v
          +-----------------------------+                       +-----------------------------+
          |    Next.js API Handlers     |                       |    Custom Node.js Server    |
          |  (JWT Auth, Zod Validation, |                       |  (Socket.IO Real-Time Engine|
          |     Domain Services)        |                       |   Room Management & Events) |
          +--------------+--------------+                       +--------------+--------------+
                         |                                                     |
                         +--------------------------+--------------------------+
                                                    |
                                                    v
                                      +---------------------------+
                                      |     Prisma ORM Layer      |
                                      |   Type-Safe Data Access   |
                                      +-------------+-------------+
                                                    |
                                                    v
                                      +---------------------------+
                                      |    PostgreSQL Database    |
                                      |  (Neon Cloud / Relational)|
                                      +---------------------------+
```

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 14 (App Router)** | Server & Client Components, Dynamic Routing, SEO |
| **Language** | **TypeScript 5 (Strict Mode)** | End-to-end type safety across client and server |
| **Styling** | **Tailwind CSS + Lucide Icons** | Custom healthcare theme, responsive layout, micro-animations |
| **Mobile / PWA** | **Web App Manifest + Service Worker** | Standalone installability, offline caching, adaptive icons |
| **Backend API** | **Next.js Route Handlers** | RESTful endpoints with Zod request validation |
| **Real-Time Layer** | **Socket.IO (Node.js Engine)** | Bidirectional low-latency event broadcasting |
| **Database** | **PostgreSQL (Neon Serverless)** | Relational database with ACID transactions |
| **ORM** | **Prisma ORM 5.22** | Type-safe queries, relational schema migrations, seeding |
| **Authentication** | **JWT (Access + Refresh) & Cookies** | Secure HTTP-only cookies, password hashing with bcrypt |
| **Testing** | **Vitest** | Automated integration and unit test suite |

---

## 🗄️ Database Schema & Data Model

UCHN features a normalized relational schema with 16 core entities:

```mermaid
erDiagram
    User ||--o{ PatientProfile : "has"
    User ||--o{ DoctorProfile : "has"
    User ||--o{ ClinicStaff : "belongs_to"
    User ||--o{ Notification : "receives"
    User ||--o{ AuditLog : "triggers"

    Clinic ||--o{ ClinicStaff : "employs"
    Clinic ||--o{ DoctorProfile : "hosts"
    Clinic ||--o{ AppointmentSlot : "offers"
    Clinic ||--o{ Appointment : "manages"
    Clinic ||--o{ EmergencyCase : "handles"
    Clinic ||--o{ WaitingQueueEntry : "serves"
    Clinic ||--o{ MedicineInventory : "stocks"

    DoctorProfile ||--o{ DoctorSpecialty : "specializes"
    DoctorProfile ||--o{ AppointmentSlot : "opens"
    DoctorProfile ||--o{ Appointment : "consults"

    Medicine ||--o{ MedicineInventory : "stocked_as"
    MedicineInventory ||--o{ MedicineStockTransaction : "records"
    MedicineInventory ||--o{ MedicineRequest : "fulfills"

    Appointment ||--o| WaitingQueueEntry : "generates"
    EmergencyCase ||--o{ EmergencyStatusHistory : "tracks"
```

---

## 🔒 Security & Data Integrity

1. **Role-Based Access Control (RBAC)**: Strict server-side route guards enforcing separate permissions for `PATIENT`, `DOCTOR`, and `CLINIC_ADMIN`.
2. **Concurrency & Double-Booking Guard**: Prisma interactive database transactions (`$transaction`) with optimistic slot-locking ensure no two patients can simultaneously claim the same appointment slot.
3. **Zero-Inventory Order Protection**: Inventory transaction checks guarantee that medicine dispensing operations can never push stock below 0.
4. **JWT Dual-Token System**: Short-lived Access Tokens (15 mins) and cryptographically signed Refresh Tokens (7 days) stored in Secure HTTP-only cookies.
5. **Security Audit Logging**: Every critical action (authentication, appointment status transition, ambulance dispatch, stock adjustment) is logged with actor details, timestamps, and metadata.

---

## 👥 Ready-to-Use Demo Accounts

The database comes pre-seeded with realistic healthcare data and 1-click test credentials:

| Role | Email | Password | Assigned Profile |
| :--- | :--- | :--- | :--- |
| **Patient** | `patient@uchn.org` | `Patient123!` | John Doe (Blood Group: O+, San Francisco) |
| **Doctor** | `doctor@uchn.org` | `Doctor123!` | Dr. Sarah Jenkins (Cardiologist, Central Metro Hospital) |
| **Clinic Admin** | `admin@uchn.org` | `Admin123!` | Central Metro Health & Trauma Center Admin |

---

## ⚡ Quick Start Guide

### 1. Prerequisites
* **Node.js**: `v18.18+` or `v20+`
* **npm**: `v9+` or `pnpm`
* **PostgreSQL Database** (e.g. Free [Neon PostgreSQL](https://neon.tech/))

### 2. Clone Repository & Install Dependencies
```bash
git clone https://github.com/sanjeevakumarmd119-blip/uchn-healthcare-network.git
cd uchn-healthcare-network
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the project root:
```env
PORT=3000
NODE_ENV=development

# Database Connection (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@ep-sample-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"

# JWT Secrets
JWT_SECRET="uchn_super_secure_jwt_access_secret_2026_dev_key"
REFRESH_TOKEN_SECRET="uchn_super_secure_refresh_secret_2026_dev_key"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN="7d"

# URLs
NEXT_PUBLIC_API_URL="http://localhost:3000"
NEXT_PUBLIC_SOCKET_URL="http://localhost:3000"
```

### 4. Push Schema & Seed Database
```bash
# Push Prisma schema to Neon PostgreSQL
npm run db:push

# Seed sample clinics, doctors, slots, medicines, and inventory
npm run db:seed
```

### 5. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Running Automated Tests

Run the full automated test suite covering Authentication, Concurrency Locking, Emergency Dispatch Lifecycles, and Inventory Constraints:
```bash
npm test
```

---

## 🚀 Cloud Deployment (Vercel + Neon)

1. Import repository to [Vercel](https://vercel.com/).
2. Add Environment Variables in **Project Settings → Environment Variables**:
   * `DATABASE_URL`: Neon PostgreSQL connection string
   * `JWT_SECRET`: Secure string
   * `REFRESH_TOKEN_SECRET`: Secure string
3. Vercel automatically runs `prisma generate && next build` and deploys the application globally.

---

## 📱 Mobile App Installation Guide

* **Android (Chrome / Edge / Brave)**: Open the deployed website on your mobile browser $\rightarrow$ tap the **"Install UCHN Healthcare"** banner at the bottom.
* **iPhone / iPad (Safari)**: Open the deployed website $\rightarrow$ tap the **Share** button (**⎋**) $\rightarrow$ tap **"Add to Home Screen"** (**⊞**).

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
