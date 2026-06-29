# Vista IQ

> A full-stack AI-powered interview preparation platform built with FastAPI, React, and Google Gemini.

---
## 🌐 Live Demo

Frontend: Coming Soon

Backend API: Coming Soon

API Docs: Coming Soon

## 🚀 What it does

- Mock interviews with AI-driven feedback
- Resume analysis and optimization for job applications
- In-browser coding challenges with evaluation
- Personalized roadmap generation
- Job matching and company-specific preparation
- Resume PDF generation from optimized content

---

## 🌟 Features

- AI Interview Practice: simulated interviews with audio/text feedback
- Resume Upload & Analysis: parse, review, and score resumes
- Coding Challenges: practice problems with in-browser editor support
- Roadmap Generation: personalized study plans for interview readiness
- Auth & User Management: secure login, registration, and JWT token flow
- MongoDB Storage: store users, resumes, and session data
- AI Job Matching Engine: recommends suitable job roles, company fit percentage, salary estimation and skill gap       analysis using AI

---

## 🛠 Tech Stack

**Backend**
- Python 3.11+
- FastAPI
- MongoDB + Beanie ODM
- JWT authentication
- Google Gemini AI integration
- ReportLab for PDF generation

**Frontend**
- React + Vite
- Tailwind CSS
- Monaco Editor
- Lucide Icons
- Chart.js

---

## ⚙️ Local Setup

### Prerequisites
- Node.js 18+
- Python 3.11+
- MongoDB (local or Atlas)
- Google Gemini API key

### 1. Clone repository

```bash
git clone https://github.com/shersinghcodes/Vista-IQ.git
cd Vista-IQ
```

### 2. Backend setup

```bash
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
```

Create a `.env` file in the project root with values such as:

```env
MONGODB_URI=your_mongodb_atlas_uri
SECRET_KEY=your_super_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
GEMINI_API_KEY=your_gemini_api_key_here
FRONTEND_URL=http://localhost:5173
```

Start the backend:

```bash
python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
```

Open API docs at: [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Open the app at: [http://localhost:5173](http://localhost:5173)

---

## 📁 Project Structure

```text
Vista-IQ/
├── backend/
│   ├── app.py
│   ├── ai_engine.py
│   ├── config.py
│   ├── database.py
│   ├── gemini_service.py
│   ├── job_market_service.py
│   ├── job_matching_engine.py
│   ├── resume_ai_engine.py
│   ├── resume_optimizer.py
│   ├── resume_pdf_generator.py
│   ├── roadmap_engine.py
│   ├── routers/
│   │   ├── auth_router.py
│   │   ├── job_market.py
│   │   ├── job_matching_router.py
│   │   ├── resume_router.py
│   │   └── roadmap_router.py
│   └── resume_templates/
│
├── frontend/
│   ├── package.json
│   ├── jsconfig.json
│   ├── vite.config.js
│   ├── public/
│   └── src/
│       ├── components/
│       │   └── Resume/
│       │       ├── ResumeForm.jsx
│       │       └── ResumePreview.jsx
│       ├── context/
│       │   ├── AuthContext.jsx
│       │   └── ProfileContext.jsx
│       └── pages/
│           ├── Dashboard.jsx
│           ├── Login.jsx
│           ├── Register.jsx
│           ├── JobMarket.jsx
│           ├── JobMatching.jsx
│           ├── ResumeBuilder.jsx
│           ├── ResumeAnalysis.jsx
│           ├── AIInterviewRoom.jsx
│           ├── CompanySelection.jsx
│           ├── Roadmap.jsx
│           └── Profile.jsx
│
├── assets/
│   └── screenshots/
│
├── requirements.txt
├── LICENSE
└── README.md
```

---

## 🔗 Main API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login and receive JWT tokens |
| POST | `/resume/upload` | Upload a resume |
| POST | `/resume/{id}/analyze` | Analyze a resume with AI |
| POST | `/resume/{id}/optimize` | Generate optimized resume content |
| GET | `/resume/{id}/optimization/{opt_id}/pdf` | Download the optimized resume PDF |
| POST | `/ai-interview/session/start` | Start an AI interview session |
| GET | `/roadmap/generate` | Generate a personalized study roadmap |

---



---

## 📄 License

MIT License


## ☁️ Deployment

- Frontend deployed on Render Static Site
- Backend deployed on Render Web Service
- Database hosted on MongoDB Atlas
- Authentication powered by Google OAuth

## 📸 Application Preview

### 🔐 Login
![Login](assets/screenshots/login.png)

---

### 📊 Dashboard
![Dashboard](assets/screenshots/dashboard.png)

---

### 📄 Resume Builder
![Resume Builder](assets/screenshots/resume-builder.png)

---

### 📑 Resume Analysis
![Resume Analysis](assets/screenshots/resume-analysis.png)

---

### 🎤 AI Interview
![AI Interview](assets/screenshots/ai-interview.png)

---

### 💼 Job Market
![Job Market](assets/screenshots/job-market.png)

---

### 🤝 AI Job Matching
![AI Job Matching](assets/screenshots/job-matching.png)

---

### 🏢 Company Specific Preparation
![Company Preparation](assets/screenshots/company-preparation.png)

---

### 🛣️ AI Roadmap Generator
![Roadmap](assets/screenshots/roadmap.png)

---

### 👤 User Profile
![Profile](assets/screenshots/profile.png)

---

### 📈 Speech Confidence Analysis
![Speech Confidence Analysis](assets/screenshots/speech-confidence-analysis.png)