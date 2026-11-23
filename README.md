# HealthPulse – AI-Assisted Smart Healthcare & Doctor TeleConsultation Portal

[![Java](https://img.shields.io/badge/Java-21-orange.svg)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-purple.svg)](https://vitejs.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-blue.svg)](https://www.mysql.com/)
[![Groq AI](https://img.shields.io/badge/AI%20Inference-Groq%20Cloud-red.svg)](https://groq.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**HealthPulse** is an enterprise-grade full-stack telemedicine and clinical triage platform designed to streamline doctor discovery, patient appointment scheduling, automated slot collision management, and pre-consultation symptom intake powered by Groq Cloud's ultra-low latency AI engine.

---

## 1. Project Title & Description

**HealthPulse: AI-Assisted Smart Healthcare & Doctor TeleConsultation Portal** connects patients with verified medical specialists across diverse disciplines (Cardiology, Dermatology, Orthopedics, Pediatrics, General Medicine). It combines an interactive React Single Page Application (SPA) with a high-performance Spring Boot 3.5 backend, relational persistence via Hibernate 6 ORM on MySQL 8.0, and an automated clinical symptom preparation engine powered by the Groq LPU inference API.

---

## 2. Problem Statement

Traditional outpatient clinic workflows suffer from critical operational challenges:
- **Prolonged Queue Delays & Manual Booking:** Administrative overhead and paper records lead to patient wait times and scheduling errors.
- **Double-Booking & Slot Conflicts:** Without transactional concurrency control, overlapping bookings cause practitioner burnout and patient dissatisfaction.
- **Unstructured Patient Intake:** Doctors often spend the first 5–10 minutes of a consultation gathering baseline symptoms rather than focusing on diagnosis and care.
- **Lack of Objective Triage:** Routine and urgent clinical conditions enter identical queues without structured severity indicators.
- **Scattered Clinical Documentation:** Prescriptions and consultation histories are frequently lost or uncoordinated across outpatient visits.

---

## 3. Project Objectives

- Provide a decoupled, modular **Single Page Application** using React 18, Vite 5, and component-scoped CSS.
- Enforce client-side input validation using **JavaScript Regular Expressions** for patient names, emails, and 10-digit Indian mobile numbers (`/^[6-9]\d{9}$/`).
- Build an enterprise **Spring Boot 3.5 REST API** architecture with layered controller, service, repository, and security abstractions.
- Automate relational persistence and schema management using **Spring Data JPA & Hibernate 6 ORM** with MySQL 8.0.
- Eliminate appointment collisions using an atomic **29-minute slot conflict detection** algorithm (`HTTP 409 Conflict`).
- Provide non-diagnostic **AI Clinical Intake Summaries** via Groq Cloud API (`openai/gpt-oss-120b`) to prepare physicians prior to teleconsultation encounters.
- Secure user identities and mutations through **BCrypt password hashing**, HTTP session management, and **Double-Submit CSRF cookie** tokens.
- Offer dedicated clinical workflows for authenticated doctors to manage consultation queues and issue structured digital prescriptions.

---

## 4. Key Features

- **Doctor Directory & Filtering:** Browse verified specialists, view clinical qualifications, years of experience, availability schedules, and transparent consultation fees. Real-time filtering by discipline (Cardiology, Dermatology, Orthopedics, etc.).
- **Interactive Booking Modal:** Patient-friendly scheduling with dynamic date/time slot selection and real-time JavaScript Regex input validation.
- **Atomic Slot Conflict Prevention:** Backend detects overlapping bookings within a 29-minute window for the same physician, immediately rejecting collisions with `HTTP 409 Conflict` and suggesting available alternate times.
- **Groq AI Clinical Intake Engine:** Patients describe symptoms in freeform natural language. Groq's LPU model generates a structured pre-consultation briefing containing chief complaints, triage category, estimated severity rating (1–10), red-flag screening, and doctor inquiry checklists.
- **Role-Based Access Control (RBAC):** Distinct roles (`ROLE_PATIENT`, `ROLE_DOCTOR`, `ROLE_ADMIN`) governing authorization for booking, consultation updates, and clinical prescriptions.
- **Doctor Clinical Console:** Management dashboard for physicians to review daily patient queues, inspect AI clinical briefing notes inline, update consultation status (`CONFIRMED`, `COMPLETED`, `CANCELLED`), and record clinical findings.
- **Digital Prescriptions:** Linked clinical prescription generation with medication details, dosage frequency, treatment duration, and patient instructions.
- **Enterprise Security:** BCrypt password encryption, HttpOnly session cookies, CSRF protection via Spring Security's `CookieCsrfTokenRepository`, and centralized RFC-7807 global exception handling.

---

## 5. Technology Stack

### Frontend
- **Framework:** React.js 18.3.1
- **Build Tool / Bundler:** Vite 5.4.8 (with Dev Proxy on port `5173`)
- **Languages:** JavaScript (ES6+), HTML5, CSS3
- **Validation:** JavaScript Regular Expressions (Regex)
- **State Management:** React Declarative Hooks (`useState`, `useEffect`, `useContext`)
- **HTTP Client:** Native browser `fetch` wrapper (`services/api.js`) with CSRF handling

### Backend
- **Language / Runtime:** Java 21 (LTS)
- **Framework:** Spring Boot 3.5.16
- **Web Layer:** Spring MVC RESTful APIs
- **Security:** Spring Security 6.4 (BCrypt, CSRF Double-Submit Cookie, Session Management)
- **Data Persistence & ORM:** Spring Data JPA / Hibernate 6.6.53.Final
- **JSON Processing:** Jackson Databind 2.17
- **Build System:** Apache Maven 3.9+

### Database
- **Primary Relational Engine:** MySQL 8.0 (Port `3306`)
- **Offline Fallback / Testing:** H2 In-Memory Database (`application-dev.properties`)

### AI Integration
- **Platform:** Groq Cloud API (LPU Inference Engine)
- **Model:** `openai/gpt-oss-120b` (or `llama-3.3-70b-versatile`)
- **Protocol:** RESTful HTTPS JSON payload with temperature control and system prompting

---

## 6. System Architecture

The application adopts a decoupled, multi-tiered enterprise architecture:

```
[ Client Browser: React 18 Single Page Application ]
                       │
                       │  HTTP / JSON + XSRF-TOKEN (Port 5173)
                       ▼
            [ Vite Reverse Proxy ]
                       │
                       │  Forwarded to Target (Port 8080)
                       ▼
     [ Spring Boot 3.5 REST Controllers ]
           ├── AuthController (/api/auth)
           ├── DoctorController (/api/doctors)
           ├── AppointmentController (/api/appointments)
           ├── AiController (/api/ai)
           ├── ConsultationController (/api/consultations)
           └── PrescriptionController (/api/prescriptions)
                       │
                       ▼
            [ Service & Security Layer ]
           ├── AuthService (BCrypt, Session Context)
           ├── AppointmentService (29-min Conflict Logic, @Transactional)
           ├── GroqAiService (REST Client, Prompt Engineering)
           └── SecurityConfig (RBAC, CSRF Cookie Repository)
                       │
           ┌───────────┴───────────┐
           ▼                       ▼
[ Groq Cloud LPU API ]    [ Spring Data JPA / Hibernate 6 ]
(Inference: gpt-oss-120b)          │
                                   ▼
                         [ MySQL 8.0 Database ]
```

---

## 7. Frontend & Backend Structure

```text
Health_Portal/
├── backend/
│   ├── pom.xml                               # Maven project configuration & dependencies
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/healthcare/teleconsult/
│   │   │   │   ├── TeleconsultApplication.java
│   │   │   │   ├── config/                   # SecurityConfig, CorsConfig, DataInitializer
│   │   │   │   ├── controller/               # REST Controllers (Auth, Doctor, Appointment, AI, etc.)
│   │   │   │   ├── dto/                      # Data Transfer Objects (Requests, Responses)
│   │   │   │   ├── entity/                   # JPA Entity Models (User, Doctor, Appointment, etc.)
│   │   │   │   ├── exception/                # GlobalExceptionHandler, Custom Exceptions
│   │   │   │   ├── repository/               # Spring Data JPA Repositories
│   │   │   │   └── service/                  # Business Logic & Groq AI Service
│   │   │   └── resources/
│   │   │       ├── application.properties    # Common application settings
│   │   │       ├── application-mysql.properties # MySQL production configuration
│   │   │       └── application-dev.properties   # H2 zero-config development profile
│   │   └── test/                             # 27 Automated Integration & Workflow Tests
│   └── .env.example                          # Backend local environment template
├── frontend/
│   ├── index.html                            # Single page HTML entry point
│   ├── package.json                          # React dependencies & scripts
│   ├── vite.config.js                        # Vite bundler & API reverse proxy configuration
│   ├── src/
│   │   ├── main.jsx                          # React DOM mount point
│   │   ├── App.jsx                           # Root layout, router view, and error boundary
│   │   ├── AppointmentForm.jsx               # Booking modal with client regex validation
│   │   ├── DoctorsPage.jsx                   # Doctor directory & specialization filter
│   │   ├── AppointmentsPage.jsx              # Appointment management & doctor consultation notes
│   │   ├── SymptomIntakePage.jsx             # AI pre-consultation symptom intake portal
│   │   ├── DoctorCard.jsx                    # Reusable doctor profile card
│   │   ├── components/                       # Shared components (Navbar, Toast, Footer)
│   │   ├── context/                          # AuthContext (user session state)
│   │   ├── features/auth/                    # AuthModal (Login & Registration with regex validation)
│   │   ├── services/api.js                   # Centralized HTTP client with CSRF token extraction
│   │   └── styles.css                        # Application theme & styling
│   └── .env.example                          # Frontend environment template
├── .env.example                              # Root environment template
├── .gitignore                                # Comprehensive Git exclusions
├── start-all.bat                             # One-click launcher for backend & frontend (CMD)
├── start-all.ps1                             # One-click launcher (PowerShell)
├── start-backend.bat                         # Backend startup script (CMD)
├── start-backend.ps1                         # Backend startup script (PowerShell)
├── start-frontend.bat                        # Frontend startup script (CMD)
├── start-frontend.ps1                        # Frontend startup script (PowerShell)
└── README.md                                 # Complete project documentation
```

---

## 8. Database Overview

Relational tables are automatically provisioned and updated by Hibernate ORM (`spring.jpa.hibernate.ddl-auto=update`):

| Table | Primary Key | Key Columns | Description |
| :--- | :--- | :--- | :--- |
| `users` | `id` (BIGINT) | `email` (UNIQUE), `password_hash`, `full_name`, `role`, `phone` | User credentials, roles (`ROLE_PATIENT`, `ROLE_DOCTOR`), and profiles. |
| `doctors` | `id` (BIGINT) | `user_id` (FK, UNIQUE), `specialization`, `qualification`, `experience_years`, `consultation_fee`, `available` | Clinical attributes, consultation fees, and weekly schedule windows. |
| `appointments` | `id` (BIGINT) | `doctor_id` (FK), `patient_id` (FK), `appointment_date_time`, `status`, `patient_phone` | Scheduled consultation slots with compound index on `(doctor_id, appointment_date_time)`. |
| `consultations` | `id` (BIGINT) | `appointment_id` (FK, UNIQUE), `doctor_id` (FK), `patient_id` (FK), `diagnosis`, `consultation_notes`, `status` | Completed or active doctor-patient clinical encounters. |
| `prescriptions` | `id` (BIGINT) | `consultation_id` (FK), `medicine_name`, `dosage`, `duration`, `instructions` | Prescribed medications and dosing instructions. |
| `ai_preconsultation_notes` | `id` (BIGINT) | `appointment_id` (FK), `triage_category`, `severity_score`, `red_flags`, `recommended_questions` | Structured pre-consultation briefings generated via Groq AI. |

---

## 9. API Overview

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register a new patient or doctor with BCrypt encryption. |
| `POST` | `/api/auth/login` | Public | Authenticate credentials and establish HTTP session. |
| `POST` | `/api/auth/logout` | Authenticated | Terminate user session and clear security context. |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current user profile and role. |
| `GET` | `/api/csrf` | Public | Retrieve CSRF cookie (`XSRF-TOKEN`) for mutating requests. |
| `GET` | `/api/doctors` | Public | List verified doctors with specialty, fee, and availability. |
| `GET` | `/api/doctors/{id}` | Public | Retrieve individual doctor clinical details. |
| `POST` | `/api/appointments` | Public / Patient | Book a teleconsultation slot (validates 29-min non-overlap). |
| `GET` | `/api/appointments` | Authenticated | Retrieve appointments (filtered by doctor or authenticated patient). |
| `PATCH` | `/api/appointments/{id}/status` | Authenticated | Update appointment status (`CONFIRMED`, `COMPLETED`, `CANCELLED`). |
| `POST` | `/api/ai/preview-triage` | Public / Patient | Execute Groq LLM inference to analyze symptoms into structured intake. |
| `POST` | `/api/consultations` | Patient / Doctor | Initiate or book formal consultation encounter. |
| `POST` | `/api/prescriptions` | Doctor / Admin | Issue digital prescription linked to consultation. |

---

## 10. AI Integration Using Groq

The clinical intake assistant uses Groq Cloud's Language Processing Unit (LPU) architecture to process patient symptoms with sub-second latency:

- **Model:** `openai/gpt-oss-120b` (OpenAI-compatible chat completion endpoint).
- **System Prompting:** Enforces strict JSON output formatting and explicitly forbids definitive diagnoses:
  ```json
  {
    "triageCategory": "Cardiovascular Evaluation",
    "severityScore": 4,
    "severityLevel": "MODERATE",
    "redFlags": "Negative for acute distress, radiating arm pain, or syncope.",
    "recommendedDoctorQuestions": [
      "How long do palpitation episodes persist?",
      "Does discomfort correlate with physical exertion or meals?",
      "Review current blood pressure medication dosage."
    ],
    "briefingSummary": "45-year-old presenting with 4-day history of exertional tightness and dizziness."
  }
  ```
- **Fallback Resilience:** If the Groq API key is not configured, the service falls back gracefully to a heuristic triage parser, ensuring zero downtime.

---

## 11. Installation Prerequisites

- **Java Development Kit (JDK):** Version 21 or higher. Verify with:
  ```bash
  java -version
  ```
- **Node.js & npm:** Node 18+ (Node 20 recommended). Verify with:
  ```bash
  node -v
  npm -v
  ```
- **Apache Maven:** Version 3.9+. Verify with:
  ```bash
  mvn -v
  ```
- **MySQL Database Server:** Version 8.0+. Running locally on port `3306`.
- **Groq API Key:** (Optional for live LLM inference) Obtain free from [Groq Console](https://console.groq.com/keys).

---

## 12. Database Configuration

1. Log into your MySQL console:
   ```sql
   mysql -u root -p
   ```
2. Create the database and dedicated user:
   ```sql
   CREATE DATABASE IF NOT EXISTS health_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER IF NOT EXISTS 'health_portal_app'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON health_portal.* TO 'health_portal_app'@'localhost';
   FLUSH PRIVILEGES;
   ```
3. Hibernate will automatically create all tables, indexes, and foreign keys upon first application startup (`ddl-auto=update`). Initial seed data (sample doctors and demo accounts) will be provisioned automatically via `DataInitializer.java`.

---

## 13. Environment Variable Configuration

Create a `.env` file in the project root by copying `.env.example`:

```bash
cp .env.example .env
```

Configure your local parameters:

```env
# Database Settings
DB_URL=jdbc:mysql://127.0.0.1:3306/health_portal?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
DB_USER=health_portal_app
DB_PASSWORD=your_password_here

# Groq Cloud AI Engine
GROQ_API_KEY=gsk_your_actual_groq_api_key
GROQ_MODEL=openai/gpt-oss-120b

# Server Port
SERVER_PORT=8080
```

---

## 14. Backend Setup Instructions

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Build the project and run the automated test suite:
   ```bash
   mvn clean test
   ```
3. Start the Spring Boot application using the MySQL profile:
   ```bash
   mvn spring-boot:run "-Dspring-boot.run.profiles=mysql"
   ```
   *(For quick offline development without MySQL, omit the profile to use the in-memory H2 database).*
4. The backend service will start on `http://localhost:8080`.

---

## 15. Frontend Setup Instructions

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Access the frontend application in your browser at `http://localhost:5173`. The Vite proxy will route `/api/*` calls to `http://127.0.0.1:8080`.

---

## 16. How to Run the Project (One-Click Launchers)

For rapid local execution on Windows:

- **Launch Both Backend & Frontend:**
  Double-click `start-all.bat` (or run `.\start-all.ps1` in PowerShell).
- **Launch Backend Only:**
  Run `start-backend.bat` (or `.\start-backend.ps1`).
- **Launch Frontend Only:**
  Run `start-frontend.bat` (or `.\start-frontend.ps1`).

---

## 17. Screenshots Section

| Screen | Description | Preview |
| :--- | :--- | :--- |
| **Doctor Directory** | Search verified specialists by medical discipline, view consultation fees, and inspect availability. | ![Doctor Directory Placeholder](docs/screenshots/doctor-directory.png) |
| **Booking Modal** | Schedule appointments with live client-side JavaScript Regex phone and email validation. | ![Booking Modal Placeholder](docs/screenshots/booking-modal.png) |
| **Conflict Detection** | Slot collision prevention alert (`HTTP 409 Conflict`) with suggested alternate times. | ![Conflict Detection Placeholder](docs/screenshots/slot-conflict.png) |
| **AI Symptom Intake** | Groq-powered clinical intake structuring patient symptoms into triage severity briefings. | ![AI Symptom Intake Placeholder](docs/screenshots/ai-intake.png) |
| **Doctor Console** | Clinical dashboard for managing outpatient queues, reviewing AI notes, and issuing prescriptions. | ![Doctor Console Placeholder](docs/screenshots/doctor-console.png) |

---

## 18. Future Enhancements

The following roadmap items represent planned capabilities not yet in the active codebase:
- **Integrated WebRTC Video Calls:** Direct browser-to-browser peer-to-peer encrypted video calling during teleconsultation sessions.
- **Payment Gateway Integration:** Online payment collection via Razorpay or Stripe prior to appointment confirmation.
- **Automated WhatsApp / SMS Reminders:** Twilio integration for teleconsultation reminders and digital prescription links.
- **FHIR / HL7 Interoperability:** Electronic Health Record (EHR) export adhering to standard Fast Healthcare Interoperability Resources.
- **Multi-Lingual Patient Intake:** Regional language symptom translation (Hindi, Telugu, Tamil) powered by multi-lingual LLM prompts.

---

## License

This project is licensed under the [MIT License](LICENSE).
