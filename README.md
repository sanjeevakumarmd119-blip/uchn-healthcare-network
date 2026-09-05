# UCHN — Unified Care & Health Network

> **Connected healthcare. Simplified for everyone.**

UCHN is a full-stack healthcare coordination platform connecting **Patients**, **Doctors**, and **Clinics**. Built with Next.js, React, TypeScript, Tailwind CSS, Prisma ORM, PostgreSQL database schema, and Socket.IO real-time event synchronization.

---

## 🚀 Key Features

### 1. Primary Patient Journey
- **Automatic Geolocation Detection**: Detects user coordinates with browser Geolocation API and provides manual city fallback selection.
- **Role Selection Gate**: "Who are you?" — Patient vs Doctor / Clinic.
- **Three Central Care Pillars**:
  1. **DOCTOR**: Search specialists by condition/specialty, calculate GPS distance (Haversine formula), inspect doctor ratings and credentials, and book consultation slots with atomic transactional concurrency locking (preventing double booking).
  2. **MEDICINE**: Live pharmacy inventory lookup with real-time stock counts across nearby clinics. Features a strict zero-inventory order guard and reservation for pharmacy pickup or home delivery.
  3. **EMERGENCY**: Visually prominent, high-priority emergency dispatch trigger with pre-submission confirmation. Automatically routes emergency cases to the nearest trauma center, pushes real-time socket alerts to doctor consoles, and provides patients with a live 5-stage interactive tracking timeline (`PENDING` → `ASSIGNED` → `AMBULANCE_DISPATCHED` → `IN_PROGRESS` → `RESOLVED`).

### 2. Clinical & Operational Console (Doctor & Clinic Admin)
- **Live Patient Waiting Queue**: Manage consultations, triage priorities (`NORMAL`, `URGENT`, `CRITICAL`), check-in times, and elapsed wait times in real-time.
- **High-Priority Emergency Console**: Audio/visual alerts for incoming trauma cases, one-click unit dispatch with custom ambulance numbers, on-site status toggles, and incident resolution tracking.
- **Medicine Stock & Inventory Control**: Manage batch numbers, SKUs, expiration dates, unit prices, and thresholds. Record atomic stock operations (`RECEIVED`, `DISPENSED`, `ADJUSTED`) with mandatory reason logging and automatic Low Stock alerts.
- **Security & Operational Audit Logs**: Immutable trace of all state changes, logins, emergency dispatches, and inventory transactions.
- **In-App Notification Center**: Real-time notifications with unread badges and one-click action links.

### 3. Real-Time Engine (Socket.IO)
- Real-time updates without manual page refreshes:
  - Patient emergency timeline progression
  - Instant doctor console alert on emergency SOS
  - Live patient waiting queue position changes
  - Appointment booking confirmations and slot status locks
  - Inventory threshold alerts

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript 5+ (Strict Mode)
- **Styling**: Tailwind CSS with custom healthcare palette (Navy, Healthcare Blue, Emerald, Amber, Emergency Red)
- **Database & ORM**: PostgreSQL Relational Database + Prisma ORM 5.22
- **Real-Time Engine**: Socket.IO (Custom Node.js Server in `server.ts`)
- **Authentication**: JWT Access (15m) + Refresh Tokens (7d), bcrypt password hashing, HTTP-only secure cookies, and RBAC guards
- **Validation**: Zod Schema Validation
- **Testing**: Vitest Unit & Integration Test Suite

---

## 📋 Ready Demo Accounts

Seed data provides instant 1-click test credentials on the login screen:

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Patient** | `patient@uchn.org` | `Patient123!` | John Doe (Blood Group O+, San Francisco) |
| **Doctor** | `doctor@uchn.org` | `Doctor123!` | Dr. Sarah Jenkins (Cardiologist, Central Metro Hospital) |
| **Clinic Admin** | `admin@uchn.org` | `Admin123!` | Central Metro Health & Trauma Center Admin |

---

## ⚡ Quick Start Guide

### 1. Prerequisites
- Node.js (v18.x or v20.x+)
- npm or pnpm

### 2. Installation
```bash
# Clone repository or navigate to root
cd "Social intership project"

# Install dependencies
npm install
```

### 3. Environment Variables
Create `.env` file in the root directory:
```env
PORT=3000
NODE_ENV=development

# Database Connection (SQLite for zero-config local dev, or PostgreSQL for production)
DATABASE_URL="file:./dev.db"
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/uchn?schema=public"

# Auth Secrets
JWT_SECRET="uchn_super_secure_jwt_access_secret_2026_dev_key"
REFRESH_TOKEN_SECRET="uchn_super_secure_refresh_secret_2026_dev_key"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN="7d"

# Public URLs
NEXT_PUBLIC_API_URL="http://localhost:3000"
NEXT_PUBLIC_SOCKET_URL="http://localhost:3000"
```

### 4. Database Setup & Seeding
```bash
# Push schema to database
npm run db:push

# Populate database with rich realistic seed data (clinics, doctors, slots, medicines, emergencies)
npm run db:seed
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Running Automated Tests

Run the full Vitest suite covering Auth, Concurrency Locking, Emergency Lifecycles, and Inventory Constraints:
```bash
npm test
```

---

## 🏗️ Production Build

```bash
# Build production bundle
npm run build

# Start production server
npm start
```

---

## 📂 Project Architecture

```
uchn-unified-care-health-network/
├── prisma/
│   ├── schema.prisma            # Relational database schema (16+ entities, indexes, unique constraints)
│   └── seed.ts                  # Comprehensive database seeder
├── src/
│   ├── server/                  # Backend layer
│   │   ├── db.ts                # Prisma client singleton
│   │   ├── socket.ts            # Socket.IO event broadcaster & rooms
│   │   ├── auth/                # JWT sign/verify, cookies, RBAC guards
│   │   ├── services/            # Domain business logic (Auth, Appointment, Emergency, Inventory, Queue, Doctor, Medicine, Audit)
│   │   └── validators/          # Zod validation schemas
│   ├── app/                     # Next.js App Router
│   │   ├── layout.tsx           # Global Providers & Navigation
│   │   ├── page.tsx             # Minimal Landing Page & Role Selection
│   │   ├── (auth)/              # Login (with 1-click demo buttons), Register, Forgot Password
│   │   ├── patient/             # Patient Portal (Doctor discovery, Medicine stock, Emergency tracker, Queue, Appointments)
│   │   ├── doctor/              # Clinical Console (Overview, Queue, Emergency queue, Inventory, Appointments, Audit logs)
│   │   └── api/                 # REST API Route Handlers
│   ├── components/              # UI & Layout components
│   │   ├── ui/                  # Button, Card, Badge, Modal, Input, Select, Skeleton, Alert, Toast
│   │   └── common/              # Navbar, Sidebar, LocationPickerModal, NotificationBell
│   ├── context/                 # AuthContext, LocationContext, SocketContext
│   ├── lib/                     # Geo Haversine distance, date & status formatting utils
│   └── types/                   # Shared TypeScript interfaces
├── tests/                       # Vitest automated test suite
├── server.ts                    # Custom Node.js HTTP + Socket.IO server
└── README.md
```

---

## 🔒 Security & Reliability Implementations
- **Strict Role-Based Authorization**: Protected route guards ensure patients cannot access clinical administration or medicine stock alterations.
- **Double Booking Prevention**: Appointment slot reservation runs within Prisma interactive database transactions. Slots are locked atomically, strictly preventing race condition double bookings.
- **Zero-Inventory Order Guard**: Medicine requests verify available batch inventory before accepting orders, preventing negative stock.
- **Live Real-time State Synchronization**: Socket.IO rooms push instant updates to doctors and patients across emergency, queue, and inventory events.
- **Audit Logging**: Sensitive and critical state changes are persisted with timestamp, actor, entity, and metadata payload.

