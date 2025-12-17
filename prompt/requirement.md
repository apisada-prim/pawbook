You are a senior full-stack engineer and product designer.

Build a production-ready MVP web application called “PawBook” — 
a vet-verified digital vaccination record system for dogs and cats, 
designed to replace physical pet vaccination booklets.

The system must prioritize medical trust, immutability of records,
and fast real-world clinic workflows.

================================================
CORE PRINCIPLES
================================================
- Pet owners can VIEW records only.
- Veterinarians are the ONLY users who can create medical stamps.
- All medical records must be traceable to a verified vet and clinic.
- Medical records are immutable after creation.
- UX for vets must allow stamping in under 30 seconds.

================================================
USER ROLES
================================================
1. Pet Owner
- Create and manage pet profiles
- View vaccination and parasite treatment history
- Receive reminders
- Export and share read-only records
- Cannot create, edit, or delete medical records

2. Veterinarian (Vet)
- Must be verified before gaining access
- Can create vaccination and parasite treatment stamps
- Can edit their own stamps only within a limited time window
- Cannot delete records

3. Clinic Admin (Optional for MVP)
- Manage vets under the clinic

================================================
AUTHENTICATION & SECURITY
================================================
- Role-based access control (Owner / Vet / Admin)
- Vet accounts require manual verification
- Secure authentication using JWT + HttpOnly cookies
- All sensitive actions must be logged in audit_logs

================================================
CORE STAMPING FLOW (CRITICAL)
================================================
1. Owner selects “Get Vet Stamp” in the app
2. System generates a temporary QR Code (expires in 5 minutes)
3. Vet scans the QR Code using their device
4. Vet sees:
   - Pet profile (name, species, age)
   - Their own name and clinic (auto-filled, non-editable)
5. Vet creates a medical stamp

QR Codes must:
- Be single-use
- Expire automatically
- Be regeneratable

================================================
STAMP TYPES
================================================
1. Vaccination Stamp
2. Parasite Treatment Stamp (monthly / scheduled)

Each stamp must include:
- Pet ID
- Vet ID
- Clinic ID
- Stamp type
- Date given (default: today)
- Next due date (auto-calculated)
- Immutable timestamp

================================================
VACCINE MASTER DATA (IMPORTANT)
================================================
Create a vaccine master table containing:
- Vaccine name
- Species (dog / cat)
- Recommended starting age
- Booster intervals
- Annual / lifetime indicator

Next due dates must be calculated based on:
- Vaccine master data
- Pet age
- Previous vaccine history

Provide soft warnings if:
- Vaccine is given too early
- Vaccine is duplicated within an unsafe interval

================================================
VACCINE STICKER HANDLING
================================================
During vaccination stamping:
- Vet may optionally upload a photo of the real vaccine sticker
- Sticker images serve as medical evidence
- Images cannot be replaced after submission

Optional structured fields:
- Vaccine brand
- Lot number
- Expiry date

Owners can view but never edit sticker data.

================================================
PARASITE TREATMENT LOGIC
================================================
- Support monthly treatments
- Auto-calculate next due date
- Allow reminders and snoozing

================================================
REMINDERS & NOTIFICATIONS
================================================
- Automatic reminders for:
  - Upcoming vaccines
  - Parasite treatments
- Notification channels:
  - Email
  - Push notifications (PWA-ready)
- Allow user opt-in / opt-out
- Support snooze functionality

================================================
DUPLICATE & CONFLICT HANDLING
================================================
- Prevent duplicate stamps of the same type within unsafe intervals
- Warn vets before creating conflicting stamps
- Prevent multiple active QR stamp sessions per pet

================================================
DATA PORTABILITY
================================================
- Allow owners to export records as PDF
- Provide read-only shareable links and QR codes
- Records must display vet and clinic verification

================================================
ERROR & EDGE CASE HANDLING
================================================
- Handle expired QR codes gracefully
- Allow QR regeneration
- Support retry for failed sticker image uploads
- Support draft stamping during network issues

================================================
DATA MODELS (HIGH LEVEL)
================================================
- users
- pets
- clinics
- vets
- vaccine_master
- vaccine_records
- parasite_treatments
- reminders
- audit_logs
- sticker_images

================================================
FRONTEND REQUIREMENTS
================================================
- Next.js + TypeScript + TailwindCSS
- Mobile-first design
- Separate Owner and Vet experiences (same app, role-based UI)
- Vet stamping screens must be minimal and fast

================================================
BACKEND REQUIREMENTS
================================================
- Node.js (NestJS preferred)
- PostgreSQL
- GraphQL APIs
- Secure image upload and storage
- Background jobs for reminders

================================================
SECURITY & TRUST
================================================
- Owners cannot modify medical records
- Medical records are immutable
- All edits require reason and are logged
- Every stamp must be verifiable by vet and clinic

================================================
DELIVERABLES
================================================
1. System architecture overview
2. Database schema
3. API design
4. Vet stamping UX flow
5. Owner viewing UX flow
6. Reminder system logic
7. MVP implementation plan

================================================
ADDITIONAL PRACTICAL REQUIREMENTS (UPDATED)
================================================

1. LEGACY & HISTORICAL DATA
- Feature: "Photo Archive" for old vaccination booklets.
- Owners can upload photos of past records (marked as "Unverified").
- Vets can view and optionally "Verify" these records to formalize history.

2. MULTI-USER OWNERSHIP (FAMILY SHARING)
- Pet profiles support a "Primary Owner" and multiple "Co-owners".
- Co-owners have read/write access (can generate QR for stamps).
- Invite system via email or shareable link.

3. EXPRESS VET ONBOARDING
- Solve the "Chicken and Egg" problem.
- Allow Vets to scan a QR and "Sign Up via Mobile" instantly without waiting for full admin approval.
- Stamps created by these vets are marked "Pending Verification" but are visible immediately.

================================================
DEVOPS & INFRASTRUCTURE REQUIREMENTS
================================================
1. CONTAINERIZATION
- Fully Dockerized environment for local development and production.
- Docker Compose must orchestrate:
  - Database (PostgreSQL)
  - Backend API (NestJS)
  - Frontend (Next.js)

2. AUTOMATION
- Provide a `Makefile` for one-command execution.
- Commands required: start, stop, logs, restart, clean.

3. ENVIRONMENT MANAGEMENT
- Strict separation of .env files for local, test, and production.

Build this as a scalable, production-ready MVP.