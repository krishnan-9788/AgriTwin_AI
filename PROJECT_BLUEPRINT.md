# AgriTwin AI: Hackathon Execution Blueprint

## 1. Project Storyline

**The Problem:** Modern farming is increasingly unpredictable due to climate change, soil degradation, and erratic weather patterns. Small-to-medium scale farmers lack access to expensive, enterprise-grade agricultural monitoring systems.

**The Current State:** Farmers rely on intuition, manual field checks, and scattered weather apps. When issues arise (e.g., sudden moisture drop, nutrient depletion), intervention is often reactive, leading to lower crop yields and wasted resources.

**Our Solution:** AgriTwin AI is an affordable, AI-powered Digital Twin for agriculture. It creates a real-time digital replica of a physical farm by aggregating local weather data, soil health metrics, and crop status into a single, beautiful dashboard.

**The "Aha!" Moment:** The moment the user creates a farm, AgriTwin AI instantly generates a fully dynamic Digital Twin Dashboard that uses an AI agent to interpret raw farm data (moisture, pH, weather) into immediate, actionable recommendations ("Water tomorrow morning", "Add nitrogen in 5 days").

**The Final Demo:** A clean, mobile-first dashboard where a user registers a farm and immediately views its live digital twin, complete with real-time weather, spinning soil health metrics, an animated crop growth bar, and an AI-generated checklist of daily farming actions.

---

## 2. Project Overview

- **Project Name:** AgriTwin AI
- **Tagline:** The AI-Powered Digital Twin for Every Farm.
- **Problem Statement:** Farmers lack accessible, real-time insights to proactively manage crop health, soil conditions, and weather risks.
- **Solution Statement:** A mobile-first digital twin platform that aggregates farm data and uses AI to generate actionable daily recommendations.
- **Target Users:** Small-to-medium scale farmers, agronomists, and farm managers.
- **Core Value Proposition:** Enterprise-level farm monitoring and AI insights in an intuitive, accessible mobile app.
- **Primary Use Case:** Checking the daily health of a farm and receiving AI guidance on irrigation and fertilization.
- **Secondary/Future Use Cases:** IoT hardware integration for live soil sensors, drone imagery analysis, and automated irrigation triggers.

### Feature Scope

| Scope | Features |
|-------|----------|
| **Must Have** | User Authentication, Farm Creation, Digital Twin Dashboard, Real-time Weather Integration, Soil Health Widget, Crop Status Widget. |
| **Nice to Have** | Animated UI components, AI-generated observation prompts based on soil/weather data. |
| **Future Scope (DO NOT BUILD)** | Live IoT sensor hardware integration, drone mapping, user roles/permissions, complex analytics, push notifications. |

---

## 3. Features Included

### 1. User Authentication (P1)
- **What it does:** Secure login and registration.
- **Why it matters:** Protects farm data and assigns ownership.
- **User Interaction:** Standard email/password forms.
- **Processing:** Validates credentials, returns JWT.
- **Dependencies:** FastAPI JWT, PostgreSQL.
- **Difficulty:** Low (Standard boilerplate).

### 2. Farm Management (P0)
- **What it does:** Allows users to create and view farms.
- **Why it matters:** The foundation of the digital twin.
- **Input:** Farm name, location, size, soil type, crop, planting date.
- **Processing:** Saves to DB, automatically generates default soil records.
- **Dependencies:** PostgreSQL, FastAPI.
- **Difficulty:** Low.

### 3. Digital Twin Dashboard (P0)
- **What it does:** Aggregates all farm data into a single, premium UI.
- **Why it matters:** The core visual representation of the project.
- **Output:** Farm summary, live weather, soil health metrics, crop status.
- **Dependencies:** React Native, Expo.
- **Difficulty:** Medium (UI heavy).

### 4. Real-time Weather Integration (P1)
- **What it does:** Fetches current weather for the farm's location.
- **Why it matters:** Weather drives AI agricultural decisions.
- **Processing:** FastAPI routes request to OpenWeatherMap API.
- **Dependencies:** OpenWeatherMap API.
- **Difficulty:** Low.

### 5. AI Agronomist Recommendations (P1)
- **What it does:** Generates actionable daily tasks based on soil and weather.
- **Why it matters:** Transforms raw data into intelligent insights.
- **Input:** Current weather, soil moisture, crop age.
- **Output:** A checklist of actions (e.g., "Irrigate today").
- **Dependencies:** Simple heuristic logic (or OpenAI API if time permits).
- **Difficulty:** Medium.

---

## 4. End-to-End User Journey

**Scenario: Farmer John checks his daily farm status.**

```text
User (Farmer John)
 ↓
Entry Point: Opens AgriTwin AI App on Mobile
 ↓
Input: Logs in and taps "Create New Farm" -> Enters "Green Acres", "Corn", "Loamy Soil"
 ↓
System Processing: Frontend sends POST /farms to Backend
 ↓
Backend Logic: Validates input, saves to PostgreSQL, triggers POST /soil to seed default data
 ↓
API Call: Fetches live weather for "Green Acres" location via OpenWeatherMap
 ↓
Result: User is redirected to the Digital Twin Dashboard
 ↓
User Action: Views spinning soil metrics, animated crop progress, and reads the AI recommendation: "Water tomorrow morning."
```

---

## 5. System Architecture

To guarantee success within 24 hours, we utilize a simplified, robust architecture:

- **Frontend:** React Native (Expo) - Enables building for both iOS and Android simultaneously with rapid hot-reloading.
- **Backend:** FastAPI (Python) - Extremely fast to write, self-documenting (Swagger), and ideal for lightweight integrations.
- **Database:** PostgreSQL - Reliable, relational data storage.
- **External API:** OpenWeatherMap - For live environmental context.
- **AI/ML Component:** Hardcoded intelligent heuristics for the MVP (or OpenAI API if time permits) to generate agricultural observations.

*Why this architecture?* It strictly limits the stack to one frontend, one backend, and one database. No microservices, no message queues, no complex DevOps.

---

## 6. Architecture Diagram

### System Architecture

```mermaid
flowchart TD
    subgraph Client
        RN[React Native Expo App]
    end

    subgraph Backend Server
        FA[FastAPI]
        Auth[JWT Auth]
        FA <--> Auth
    end

    subgraph External Services
        OWM[OpenWeatherMap API]
        LLM[OpenAI API / AI Agent]
    end

    subgraph Data Layer
        DB[(PostgreSQL)]
    end

    RN -- REST API --> FA
    FA -- SQL / SQLAlchemy --> DB
    FA -- Fetch Weather --> OWM
    FA -- Generate Insights --> LLM
```

### Main Data Flow (Digital Twin Load)

```mermaid
sequenceDiagram
    participant App as Expo App
    participant API as FastAPI
    participant DB as PostgreSQL
    participant Ext as Weather/AI
    
    App->>API: GET /farms/{id}
    API->>DB: Fetch Farm Data
    API->>DB: Fetch Soil Data
    API->>Ext: Fetch Live Weather
    API->>Ext: Generate AI Insight (Optional)
    API-->>App: Return Aggregated JSON
    App->>App: Render Animations & UI
```

---

## 7. Technology Stack

| Component | Technology | Why for a Hackathon? | Alternatives Avoided |
|-----------|------------|----------------------|----------------------|
| **Frontend** | React Native + Expo | Write once, run on iOS/Android/Web. Instant preview on physical devices via QR code. | Swift/Kotlin (Too slow), Flutter (Learning curve). |
| **Styling** | NativeWind (Tailwind) | Rapid UI building without writing custom CSS/StyleSheets. | Standard React Native StyleSheets (Too slow to iterate). |
| **Backend** | FastAPI (Python) | Automatic Swagger docs, Pydantic validation, Python ecosystem. | Node.js/Express (Requires manual validation/docs). |
| **Database** | PostgreSQL + SQLAlchemy | Standard, robust, easy to query. | MongoDB (Unnecessary for highly structured farm data). |
| **Weather** | OpenWeatherMap | Free tier, simple REST API, fast setup. | Complex ag-specific APIs requiring enterprise keys. |

*Optimization strategy: Speed → Reliability → Demo Quality → Maintainability*

---

## 8. Repository / Folder Structure

```text
agritwin-ai/
├── frontend/                 # React Native Expo app
│   ├── app/                  # Expo Router screens (tabs, digital-twin)
│   ├── components/           # Reusable UI widgets (WeatherCard, CropStatusCard)
│   ├── services/             # API integration (axios calls)
│   └── types/                # TypeScript interfaces
├── backend/                  # FastAPI server
│   ├── app/
│   │   ├── models/           # SQLAlchemy DB models
│   │   ├── schemas/          # Pydantic validation schemas
│   │   ├── routers/          # API endpoints (farms, soil, weather)
│   │   ├── database.py       # DB connection
│   │   └── main.py           # FastAPI entry point
│   ├── .env                  # Backend secrets
│   └── requirements.txt      # Python dependencies
└── README.md                 # Project documentation
```

---

## 9. Database Design

Keep it relational and minimal.

### `users`
- `id` (PK, Int)
- `email` (String, Unique)
- `hashed_password` (String)

### `farms`
- `id` (PK, Int)
- `user_id` (FK -> users.id)
- `farm_name` (String)
- `location` (String)
- `size` (Float)
- `soil_type` (String)
- `current_crop` (String)

### `soil_data`
- `id` (PK, Int)
- `farm_id` (FK -> farms.id)
- `moisture` (Float)
- `ph` (Float)
- `nitrogen` (String)
- `phosphorus` (String)
- `potassium` (String)

```mermaid
erDiagram
    USERS ||--o{ FARMS : owns
    FARMS ||--o| SOIL_DATA : has
    USERS {
        int id
        string email
    }
    FARMS {
        int id
        int user_id
        string farm_name
        string current_crop
    }
    SOIL_DATA {
        int id
        int farm_id
        float moisture
        float ph
    }
```

---

## 10. API Design

Keep the surface intentionally small.

**Auth APIs**
- `POST /auth/register`
- `POST /auth/login` -> Returns JWT.

**Farm APIs**
- `POST /farms` -> Creates farm and auto-triggers default soil creation.
- `GET /farms` -> Lists user's farms.
- `GET /farms/{id}` -> Gets farm details.

**Soil APIs**
- `POST /soil` -> Seeds soil data.
- `GET /soil/{farm_id}` -> Gets soil data for a farm.

**Weather API**
- `GET /weather?city={location}` -> Returns formatted OpenWeatherMap data.

---

## 11. AI / LLM Architecture

For a 24-hour hackathon, we prioritize determinism.
- **Where it is used:** The "AI Observation" and "Recommended Actions" on the Crop Status and Soil Health cards.
- **Why it is necessary:** To translate raw numbers (76% moisture, pH 6.8) into human-readable actions ("Water tomorrow").
- **Hackathon Approach:** Use a deterministic rules-engine (e.g., `if moisture < 40% -> recommend watering`) disguised as an AI output to guarantee a flawless demo. 
- **Future Scope:** Replace the rules engine with a lightweight OpenAI API call using a structured JSON prompt:

```json
{
  "observation": "String describing crop health",
  "actions": ["Action 1", "Action 2"]
}
```

---

## 12. Core Algorithms / Logic

**Farm Creation Workflow:**
1. **Input:** User submits Farm Form.
2. **Validate:** Pydantic validates inputs on backend.
3. **Store:** Save `Farm` record to DB.
4. **Logic:** Immediately generate a `Soil` record with default dummy values (`moisture: 76`, `ph: 6.8`) mapped to the new `Farm.id`.
5. **Return:** Send success response to frontend; frontend navigates to Dashboard.

---

## 13. Building Plan

**Phase 1 — Skeleton (Hours 0-3)**
- **Objective:** Setup repo, init Expo, init FastAPI, connect to PostgreSQL.
- **Output:** Blank app loading on phone, `/docs` loading in browser.

**Phase 2 — Core Functionality (Hours 3-8)**
- **Objective:** Implement Auth, Farm CRUD, and Soil CRUD.
- **Output:** User can register, login, create a farm, and the DB stores it correctly.

**Phase 3 — UI/UX & Digital Twin (Hours 8-14)**
- **Objective:** Build the Hero Screen.
- **Output:** Digital Twin dashboard, WeatherCard, SoilHealthCard, CropStatusCard built with dummy data and animations.

**Phase 4 — Integration (Hours 14-18)**
- **Objective:** Connect the Hero Screen to the live APIs.
- **Output:** Dashboard renders live PostgreSQL data and OpenWeatherMap data.

**Phase 5 — Demo Hardening (Hours 18-24)**
- **Objective:** Fix bugs, write the pitch, rehearse.
- **Output:** A flawless 3-minute demo.

---

## 14. 24-Hour Hackathon Timeline

- **Hour 0–2:** Project setup + Repo + PostgreSQL init.
- **Hour 2–5:** FastAPI backend (Auth, Farm, Soil routers).
- **Hour 5–8:** Frontend Auth & Dashboard skeleton.
- **Hour 8–11:** Frontend UI (Building the complex animated Hero Screen widgets).
- **Hour 11–14:** Full-stack wiring (Connect frontend UI to backend APIs).
- **Hour 14–16:** Weather API Integration & "AI" logic.
- **Hour 16–19:** Edge cases, loading states, error states (Fallback UI).
- **Hour 19–21:** Testing & Bug fixing (The Buffer).
- **Hour 21–24:** Pitch deck creation, demo rehearsal.

---

## 15. Team Task Distribution

*(Assuming a 2-person team)*

**Developer 1 (Backend & Integrations)**
- Set up FastAPI and PostgreSQL.
- Write SQLAlchemy models and Pydantic schemas.
- Implement JWT Auth.
- Implement Farm, Soil, and Weather API routes.

**Developer 2 (Frontend & UI/UX)**
- Set up Expo and NativeWind.
- Build Login, Register, and Dashboard screens.
- Build the highly polished Digital Twin components (Animations, styling).
- Connect frontend Axios services to backend endpoints.

---

## 16. MVP Definition

If we only have 8 hours left, what exactly must work?
1. The user can log in.
2. The user can see a list of farms.
3. The user can click a farm and see the **Digital Twin Dashboard**.
4. The dashboard correctly displays the farm name, live weather, and hardcoded AI recommendations.

Everything else (animations, dynamic soil updates, crop status logic) can be mocked or cut.

---

## 17. Scope-Cutting Rules

**Cut First:**
1. Dynamic AI OpenAI API integration (Use hardcoded rules instead).
2. Advanced animations on the frontend.
3. Edit/Delete Farm functionality (Only Create/Read are strictly necessary for the demo).
4. User profile editing.

**Never Cut:**
1. The Digital Twin Hero Screen (It is the entire value proposition).
2. The initial "Create Farm" flow.
3. The live Weather integration (Proves external connectivity).

---

## 18. Risk Management

| Risk | Probability | Impact | Prevention | Fallback |
|------|-------------|--------|------------|----------|
| **OpenWeatherMap down** | Low | High | Use reliable keys | Hardcode a generic weather payload in the API layer. |
| **Expo Build Fails** | Med | High | Test on physical devices early | Use Expo Web as a backup presentation medium. |
| **PostgreSQL connection drops** | Low | High | Use local DB for dev | Keep a SQLite configuration ready in FastAPI. |
| **Time Shortage** | High | Med | Follow Scope-Cutting rules | Hardcode the Soil and Crop cards to guarantee a visual demo. |

---

## 19. Demo Strategy (3 Minutes)

- **0:00–0:30 (Problem):** "Farmers are flying blind. Let's look at Farmer John. He doesn't know his soil moisture just dropped."
- **0:30–1:00 (Solution):** "Introducing AgriTwin AI. An enterprise digital twin in your pocket."
- **1:00–2:30 (Live Demo):** 
  - Show the login screen.
  - Create a new farm: "Green Acres".
  - Instantly load the Digital Twin Hero Screen.
  - Highlight the spinning animations, live weather fetching, and the AI checklist.
- **2:30–3:00 (Impact):** "By centralizing this data, we saved Farmer John 20% on water usage today. Built on React Native and FastAPI, this scales to thousands of farms instantly."

---

## 20. Judge-Focused Differentiation

- **User Experience:** We aren't showing a boring dashboard of tables. We are showing an animated, beautiful, consumer-grade mobile application.
- **Real-world Usefulness:** Agriculture desperately needs affordable tech; this solves a real problem.
- **Speed to Value:** It takes exactly 10 seconds for a user to create a farm and receive AI recommendations. No hardware setup required to get started.

---

## 21. Testing Strategy

- **API Tests:** Test `POST /farms` via Swagger UI to ensure DB relationships (Soil) generate correctly.
- **UI Tests:** Ensure the `Digital Twin` screen loads flawlessly even if a farm has no soil data (using the "No Soil Data Available" fallback).
- **Demo-day Checks:** Clear the database, run the exact demo flow start-to-finish 3 times on the presentation device.

---

## 22. Deployment Plan

*Simplest possible hackathon deployment:*
- **Backend:** Render.com or Heroku (Free tier, fast deployment).
- **Database:** Supabase or Neon (Free managed PostgreSQL).
- **Frontend:** Run locally via Expo Go on a physical phone connected to the presentation screen via QuickTime/ScreenMirroring. (No App Store deployment required).

---

## 23. Environment Variables

Create a `.env.example` in the backend root:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/safeos

# Authentication
SECRET_KEY=your_super_secret_jwt_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Third-Party APIs
WEATHER_API_KEY=your_openweathermap_api_key_here
```

---

## 24. README Structure

```markdown
# AgriTwin AI 🌾

## Problem
Modern farming is unpredictable. Farmers lack real-time digital insights.

## Solution
An AI-powered Digital Twin that aggregates weather and soil data to generate actionable recommendations.

## Architecture
- **Frontend**: React Native, Expo, NativeWind
- **Backend**: FastAPI, PostgreSQL

## Running Locally
1. `cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload`
2. `cd frontend && npm install && npx expo start`

## Environment Variables
See `.env.example`

## Team
- Developer 1
- Developer 2
```

---

## 25. Final Deliverables Checklist

- [ ] Core feature works (Create Farm -> View Twin)
- [ ] Demo flow rehearsed and flawless
- [ ] UI is usable and beautiful (Animations work)
- [ ] Error handling exists (Loading spinners, fallback screens)
- [ ] Repository is clean and pushed to GitHub
- [ ] README exists with setup instructions
- [ ] No secrets committed to source control
- [ ] Pitch prepared and Architecture slide ready

---

## 26. BUILD THIS FIRST (Execution Checklist)

**DO NOT DEVIATE FROM THIS ORDER:**

1. **Initialize Repositories:** Create `frontend` (Expo) and `backend` (FastAPI) folders.
2. **Database:** Spin up local PostgreSQL, define `User`, `Farm`, `Soil` models.
3. **Core APIs:** Write Auth APIs and Farm CRUD APIs in FastAPI.
4. **Connect Frontend:** Build Login screen and connect it to backend Auth.
5. **Dashboard Skeleton:** Build basic frontend routing (Tabs -> Dashboard).
6. **Farm Creation Flow:** Build frontend `create-farm.tsx` and wire to API. Ensure it successfully creates default soil data.
7. **Hero Screen UI:** Build `digital-twin.tsx` with dummy components (`WeatherCard`, `SoilHealthCard`, `CropStatusCard`).
8. **Live Integrations:** Swap out dummy data in Hero Screen for live backend API calls (Weather + Soil).
9. **Animations & Polish:** Add NativeWind styling, gradients, and `Animated` progress bars.
10. **Rehearse Demo:** Clear DB, run the 3-minute script, fix any crashes.
