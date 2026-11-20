# EduSetu 🎓 — Smart Education & Tutor Marketplace Platform

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![Node.js](https://img.shields.io/badge/Node.js-v20+-339933?logo=node.js&logoColor=white)]()
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)]()
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)]()
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4.1-38B2AC?logo=tailwind-css&logoColor=white)]()
[![DeepEval](https://img.shields.io/badge/DeepEval-Safety_Guardrails-purple.svg)]()
[![Tests](https://img.shields.io/badge/tests-36%20passed-success.svg)]()

> **Bridging Students, Teachers, Parents, and Administrators through organized academic management, algorithmic tutor discovery, conversational AI study mentorship, and production-grade safety guardrails.**

---

## 📌 Project Overview

**EduSetu** (meaning *"Bridge for Education"*) is an enterprise-grade full-stack EdTech platform designed to solve fragmented school operations and connect learners with vetted educators.

Traditional school communication and private tutoring often suffer from fragmented WhatsApp groups, missed circulars, unverified credentials, and non-transparent progress tracking. **EduSetu** provides a unified, secure, and modern digital ecosystem with:

1. **Academic ERP Management**: Attendance tracking, homework assignments, report cards, class rosters, and real-time parent-teacher messaging.
2. **Algorithmic Tutor Discovery & Booking**: Multi-criteria spatial filtering (locality & city), credential verification, and a 100-point weighted recommendation engine.
3. **AI Academic Mentor with Memory & Caching**: Two-tier caching (< 1ms LRU + MySQL persistence), configurable conceptual depth (⚡ Quick Help vs. 🎓 Deep Dive masterclass), and interactive practice mode.
4. **Enterprise Safety & DeepEval Guardrails**: Real-time inline sanitization (< 5ms) blocking vulgarity/abuse (English + Hinglish), prompt injection/jailbreak defense, PII masking, crisis self-harm intervention (Tele-MANAS & Childline 1098), and automated DeepEval CI/CD benchmarks.

---

## 👥 Stakeholders & Role-Based Access

| Role | Description | Key Responsibilities |
| :--- | :--- | :--- |
| 🧑‍🎓 **Student** | Primary learner | View timetable, track homework, solve doubts with AI Mentor, practice topic questions, discover tutors, and attend live sessions. |
| 👩‍🏫 **Teacher / Tutor** | Classroom & private educator | Manage class rosters, mark attendance, assign & grade homework, publish exam marks, manage public tutor profile, set availability, and conduct sessions. |
| 👨‍👩‍👧 **Parent** | Student guardian | Monitor child attendance in real-time, inspect report cards, direct chat with faculty, and request/book verified tutors for linked wards. |
| 🏫 **School / Institution** | Institutional account managed by an administrator | Maintain institutional profile and manage institution-level data. School accounts are provisioned by an administrator, not through public self-registration. |
| 🛡️ **Administrator** | School governance & governance | Central control over accounts, faculty placements, age verification, class/section/subject catalogs, and system audit logs. |

---

## 🧠 AI Study Assistant & Performance Diagnostics

The student portal features an intelligent academic assistant engineered for deep pedagogical outcomes:
- **Two-Tier Caching Memory (`aiCacheService.js`)**: In-memory LRU cache combined with persistent MySQL caching (`AIQuestionCache`). Serves frequent academic queries in **< 1ms**, reducing token usage by over 70%.
- **Multi-Turn Conversational Memory**: Sessions retain previous exchanges via `conversationId`, allowing natural follow-up clarifications.
- **Dual Depth Learning Modes**:
  - ⚡ **Quick Help**: Concise, high-yield answers in simple English or Hindi for quick homework doubts.
  - 🎓 **Deep Dive**: 4-tier conceptual masterclass including physical intuition, rigorous mathematical derivations, step-by-step exemplars, and common exam pitfalls to avoid.
- **Interactive Practice Generator**: Creates targeted revision questions with progressive **💡 Show Hint** and **👁️ Show Solution** toggles.
- **Academic Performance Diagnostic**: Analyzes cumulative GPA, attendance health, and subject competencies with high-proficiency strengths and targeted intervention areas.

---

## 🛡️ Enterprise Safety, Security & Guardrails Architecture

EduSetu incorporates defense-in-depth security to protect students and preserve an age-appropriate learning space:

```
[Student Input]
      │
      ▼
┌────────────────────────────────────────────────────────┐
│   Real-Time Input Guardrail Engine (< 5ms Latency)     │
├────────────────────────────────────────────────────────┤
│  1. Toxicity & Abuse Shield (English + Hindi/Hinglish) │
│  2. Prompt Injection & Adversarial Jailbreak Defusal   │
│  3. PII Masking (Indian Phone, Aadhaar, Credit Cards)  │
│  4. Self-Harm & Violence Crisis Intercept (14416/1098) │
│  5. Edu-Lock (Deflects off-topic adult content)        │
└──────────────────────────┬─────────────────────────────┘
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
      [Policy Violated]            [Safe & Valid]
             │                           │
    [Safe Redirection &          [LLM Provider Engine]
     Audit Log in DB]                    │
                                         ▼
                               [Output Guardrail Check]
                                         │
                                         ▼
                                  [Clean Response]
```

- **Safety Audit Logging (`AISafetyLog.js`)**: All flagged incidents are stored in MySQL for administrative and parental audit.
- **DeepEval Red-Teaming Suite (`server/evals/test_safety_deepeval.py`)**: Uses DeepEval to benchmark and verify 100% defense against toxicity, jailbreaks, and zero false positives on curriculum queries.

---

## 🎯 Tutor Discovery & Algorithmic Recommendation Engine

EduSetu utilizes a dual-engine architecture for discovering and recommending tutors:
1. **Dynamic Spatial & Constraint Search**:
   - Multi-tier geographic matching: Locality/Area &rarr; City &rarr; Hybrid/Online mode fallback.
   - Relational joins across `TutorProfile`, `TutorSubject`, and `TutorAvailability`.
   - Numeric pruning: Hourly rate intervals, experience minimums, and review rating floors.
2. **Weighted Multi-Factor Recommendation Scoring (`tutorRecommendationScoring.js`)**:
   $$\text{Score}(T) = W_{\text{subject}} (30) + W_{\text{grade}} (20) + W_{\text{budget}} (20) + W_{\text{lang}} (10) + W_{\text{slot}} (10) + W_{\text{verif}} (5) + W_{\text{rating}} (5)$$
   Ranks tutors up to 100 points and provides transparent matching justifications.
3. **Child Safeguard & Age Verification**:
   - Enforces student age eligibility verification before dispatching tutor requests. Underage learners require parental confirmation.

---

## 🏗️ System Architecture & Tech Stack

```
EduSetu Platform
├── client/                     # Frontend (React 19, Vite 8, TailwindCSS 4, Lucide Icons)
│   ├── src/pages/              # StudentAI, FindTutors, AdminDashboard, etc.
│   ├── src/components/         # Reusable UI widgets & dashboards
│   └── src/services/           # Axios API services (cookie + CSRF aware)
└── server/                     # Backend (Node.js, Express, Sequelize ORM, Socket.IO)
    ├── src/config/             # Database connection & environment validation
    ├── src/controllers/        # Business logic controllers
    ├── src/middleware/         # Session auth, roles, AI quotas, rate limiting
    ├── src/models/             # Relational MySQL models (Sequelize)
    ├── src/routes/             # Express REST route handlers
    ├── src/services/           # AI Provider, Caching, Safety Guardrails, Email
    ├── src/utils/              # Cookie/CSRF helpers, recommendation scoring
    ├── migrations/             # Versioned production SQL migrations
    └── evals/                  # Python DeepEval safety & red-teaming benchmarks
```

- **Frontend**: React 19, Vite 8, Tailwind CSS 4, Lucide React, Socket.IO Client
- **Backend**: Node.js 20+, Express, Sequelize ORM, MySQL 8.0, Socket.IO, Helmet, Morgan
- **AI & Guardrails**: OpenAI-compatible provider, DeepEval, custom two-tier cache service
- **Authentication**: HttpOnly session cookies with double-submit CSRF; Bearer JWT for trusted API clients
- **Testing**: Node.js Native Test Runner (`node:test`), DeepEval (Python 3.13)

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.x or higher
- **MySQL Server**: v8.0 running locally or in the cloud
- **Python**: v3.10+ (for running DeepEval benchmarks)

### 1. Clone & Setup Environment

```bash
git clone https://github.com/EduSetu-Devs/Edusetu_platform.git
cd Edusetu_platform
```

#### Backend Setup:
```bash
cd server
cp .env.example .env
# Edit .env with MySQL credentials, JWT_SECRET, and AI provider settings.
# For real OTP email delivery, set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM.
npm install
```

#### Frontend Setup:
```bash
cd ../client
cp .env.example .env
npm install
```

### 2. Start Development Servers

You can use the bundled batch script on Windows:
```cmd
run.bat
```
Or start manually:
```bash
# Terminal 1: Backend (Port 5000)
cd server
npm run dev

# Terminal 2: Frontend (Port 5173)
cd client
npm run dev
```

Visit **`http://localhost:5173`** to access the application. Public registration is limited to **student**, **teacher**, and **parent** accounts, and every new account must verify a 6-digit email OTP. In development, when SMTP is not configured, OTPs are printed to the server console and returned only as `devOtp`.

---

## 🧪 Automated Testing & Verification

EduSetu includes comprehensive test suites across units, integration, live APIs, and AI safety:

```bash
# Run full server test suite (36 tests)
cd server
npm test

# Run real-time AI Safety & Security Guardrail tests
npm run test:safety

# Run Python DeepEval Red-Teaming Benchmarks
npm run test:deepeval

# Validate production environment variables and CORS origins
npm run check:prod

# Rotate/deactivate legacy demo credentials (requires explicit confirmation)
npm run rotate-demo-credentials

# Run full Live End-to-End API Audit
node ../test_live_all.js
```

---

## 🐳 Docker Containerization & Deployment

EduSetu is fully containerized with multi-stage production Dockerfiles and Docker Compose orchestration:

```
┌────────────────────────────────────────────────────────┐
│                   Docker Compose Mesh                  │
├───────────────────┬──────────────────┬─────────────────┤
│  Frontend Client  │  Backend Server  │  MySQL Database │
│  (React + Nginx)  │  (Node.js 20)    │  (MySQL 8.0)    │
│  Port 80          │  localhost:5000  │  localhost:3306 │
└───────────────────┴──────────────────┴─────────────────┘
```

Compose has **no default passwords or signing secrets**. Create `.env.docker` from `.env.docker.example`, replace every value, then launch:

```bash
# Generate strong secrets
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# Build and launch all services in detached mode
docker compose --env-file .env.docker up -d --build

# View real-time container logs
docker compose --env-file .env.docker logs -f

# Check container health status
docker compose --env-file .env.docker ps

# Stop the application
docker compose --env-file .env.docker down
```

The public web app is served by Nginx on port 80. The API and MySQL ports bind to localhost only and must sit behind a TLS-terminating reverse proxy or load balancer. Nginx already proxies `/api/` and `/socket.io/` to the backend, keeping the browser on a single origin so HttpOnly session cookies work correctly.

### Accessing the Containerized App:
- **Web App (Nginx):** `https://your-domain.example`
- **Backend API (internal):** `http://localhost:5000`
- **Health Check:** `https://your-domain.example/api/health`

---

## 🔐 Production Readiness

Before exposing EduSetu to real students:

1. Copy `server/.env.example` to `server/.env` (or `.env.docker.example` to `.env.docker` for Compose) and set unique values for `JWT_SECRET`, `OTP_HASH_SECRET`, and `ADMIN_VERIFICATION_PASSWORD`.
2. Configure `CLIENT_URL` / `CORS_ORIGIN` to the exact HTTPS origin, set `AUTH_COOKIE_SECURE=true`, and keep `AUTH_COOKIE_SAMESITE=lax` for same-site deployments.
3. Configure transactional SMTP with SPF, DKIM, and DMARC. Production startup fails if SMTP is missing, and verification emails fail closed.
4. Run `npm run check:prod` in the release environment. The server refuses to start with insecure or placeholder secrets.
5. Apply `server/migrations/20261101-production-hardening.sql` to add consent columns, AI usage counters, and hot-path indexes. Set `DB_SYNC=true` only for an initial bootstrap; normal production deploys rely on migrations.
6. Run `CONFIRM_DEMO_ROTATION=ROTATE npm run rotate-demo-credentials` against any database that still contains demo accounts.
7. Keep `ALLOW_UNVERIFIED_REGISTRATION=false` and `SEED_INDIAN_TUTORS=false` in production.
8. Review `SECURITY.md`, `docs/PRODUCTION_LAUNCH_CHECKLIST.md`, `docs/INCIDENT_RESPONSE.md`, and `docs/LEGAL_AND_COMPLIANCE.md`.

**Browser authentication:** the SPA no longer stores JWTs in `localStorage`. Login sets an HttpOnly, SameSite session cookie plus a readable CSRF cookie. The client sends the CSRF token on state-changing requests. Bearer JWT remains available only for trusted non-browser API clients when `AUTH_EXPOSE_TOKEN=true`.

**AI safety and cost controls:** AI inputs and outputs pass through guardrails, calls have timeouts and token caps, and per-user/global daily quotas apply when a paid provider is enabled. AI output is advisory and must be reviewed by teachers, parents, or students.

**Legal documents:** the bundled Terms and Privacy pages are drafts and must be reviewed by qualified Indian counsel before a public commercial launch.

---

## 👥 Contributors & Development Team

EduSetu was designed and engineered as a collaborative group initiative:

| Team Member | Role & Key Contributions | Profile |
| :--- | :--- | :--- |
| **Arjit Katiyar** | Full-Stack System Architecture, AI Study Assistant & Two-Tier Cache, Real-time Guardrails & Red-Teaming, Docker Setup | [@Arjit005](https://github.com/Arjit005) |
| **Vedant Sharma** | Frontend UI/UX, Interactive Learning Components, Responsive Client Workflows | Team Contributor |
| **Chandan Yadav** | Relational Database Design, Sequelize Schema & Data Migrations, API Endpoints | Team Contributor |
| **Vishal Mauray** | Quality Assurance, Tutor Marketplace Logic, Integration Testing & Validation | Team Contributor |

---

## 📄 License

This project is licensed under the **ISC License**. Developed with ❤️ by **Arjit Katiyar, Vedant Sharma, Chandan Yadav & Vishal Maurya**.
