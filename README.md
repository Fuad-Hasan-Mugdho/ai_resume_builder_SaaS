# ResumeAI Pro

A Dockerized CV builder based on
`AI_Resume_Builder_SaaS_complete_Product_Requirements_Document.pdf`.

Users can create and save CVs, preview them live, pay ৳20 for a specific CV,
and download the approved CV as an A4 PDF. Payment verification is manual, so
no payment gateway credentials are required.

## Technology

- Frontend: Next.js 15, TypeScript, Tailwind CSS
- Backend: NestJS, Prisma, PostgreSQL
- Authentication: JWT
- Database browser: CloudBeaver
- Runtime: Docker Compose

## Quick Start

Requirements: Docker, Docker Compose, and Make.

From the project root, run:

```bash
make up
```

This builds and starts PostgreSQL, the backend, the frontend, and CloudBeaver.

### Service URLs

- Frontend: `http://localhost:3001`
- Backend API: `http://localhost:4000/api`
- Backend health: `http://localhost:4000/api/health`
- CloudBeaver: `http://localhost:8978`
- PostgreSQL: `localhost:5433`

### Useful Commands

```bash
make up       # Build and start every service
make down     # Stop services without deleting database data
make restart  # Restart every service
make status   # Show service status
make logs     # Follow logs from all services
```

`make down` does not remove Docker volumes. Do not add `-v` unless you
intentionally want to delete PostgreSQL and CloudBeaver data.

## Default Admin

- Login: `http://localhost:3001/auth/login`
- Email: `admin@resumeai.local`
- Password: `ResumeAI-Admin-2026`
- Admin page: `http://localhost:3001/admin`

Change `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `JWT_SECRET` in
`docker-compose.yml` before deploying publicly.

An admin is redirected directly to the payment approval page after login. The
admin UI is intentionally limited to reviewing bKash/Nagad payment requests.

## Per-CV Payment Flow

The configured merchant number is `01551806306`.

1. The user registers or logs in.
2. The user creates and saves a CV.
3. From Dashboard, the user clicks `Pay ৳20` for that specific CV.
4. The user sends exactly ৳20 through bKash or Nagad.
5. The user submits the sender mobile number and Transaction ID.
6. The payment appears as `PENDING APPROVAL` for that CV.
7. The admin verifies the transaction manually and approves or rejects it.
8. An approved payment enables watermark-free PDF downloads for that CV for
   seven days.
9. The user can download that approved CV multiple times during the seven-day
   access period.

Each payment is linked to one CV. A payment for one CV cannot authorize another
CV. Duplicate transaction IDs are rejected.

The website never asks for a bKash/Nagad PIN or OTP.

## User Features

- Registration, login, logout, and protected user pages
- User dashboard with saved CV list
- Step-by-step CV builder
- Live A4 preview
- Debounced auto-save for saved CVs
- English and Bangla CV content
- Experience, education, skills, projects, certifications, and awards
- Section ordering and basic design customization
- Per-CV payment status and Transaction ID on Dashboard
- Watermark on new, unpaid, pending, rejected, or expired CVs
- No watermark on an active approved CV
- A4 browser print-to-PDF with correct header and pagination

## Admin Features

- Admin-only route protection
- Automatic payment request loading
- CV title, user, sender number, amount, and Transaction ID visibility
- Payment approval and rejection with rejection reason

## Important API Routes

### Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Resumes

- `GET /api/resumes`
- `POST /api/resumes`
- `PUT /api/resumes/:id`
- `DELETE /api/resumes/:id`
- `POST /api/resumes/:id/export-authorize`

### Manual Payments

- `POST /api/payments/manual`
- `GET /api/payments/manual/status`
- `GET /api/admin/manual-payments`
- `PATCH /api/admin/manual-payments/:id`

## Optional Smoke Test

The smoke test is not required for normal startup or every frontend change. Run
it after significant authentication, database, resume, or payment-flow changes:

```bash
./scripts/smoke-test.sh
```

It verifies registration, resume creation, per-CV payment submission, admin
approval, repeated PDF authorization during active access, and core API health.

## Local Development Without Docker

### Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npm run start:dev
```

### Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Docker is the recommended workflow because it automatically synchronizes the
Prisma schema and provides PostgreSQL with the expected configuration.

## Project Structure

- `frontend/`: Next.js application
- `backend/`: NestJS API and Prisma schema
- `scripts/`: optional smoke tests
- `docker-compose.yml`: service definitions
- `Makefile`: project lifecycle commands
- `AI_Resume_Builder_SaaS_complete_Product_Requirements_Document.pdf`: source PRD
