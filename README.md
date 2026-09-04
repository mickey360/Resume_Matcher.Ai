# AI Resume Matcher

A full-stack AI/ML resume-to-job matching application built for a public GitHub portfolio.

## What it does

- Upload PDF or DOCX resumes (up to 5 MB)
- Extract resume text on the FastAPI backend
- Detect common technical and professional skills
- Analyze job-description requirements
- Calculate explainable scores:
  - Skills
  - Keywords
  - Experience
  - Education
  - Semantic similarity
- Show matching and missing skills
- Generate practical resume recommendations
- Save recent results locally in the browser (no database account required)
- Responsive AI-style dashboard
- FastAPI Swagger/OpenAPI docs
- Health endpoint
- Docker-ready backend
- Vercel + Render deployment friendly

## Architecture

```text
Browser
   |
   v
Next.js frontend (Vercel)
   |
   | multipart/form-data
   v
FastAPI backend (Render)
   |
   +--> PDF/DOCX extraction
   |
   +--> skill/NLP analysis
   |
   +--> Sentence Transformers semantic similarity
   |      |
   |      +--> TF-IDF fallback if model cannot load
   |
   v
JSON analysis
   |
   v
Next.js dashboard
   |
   +--> browser localStorage for recent analyses
```

There is deliberately **no Supabase, Firebase, or paid AI API**. This keeps the project simple to understand and deploy. Browser history is local to each user/device.

## Tech stack

### Frontend
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4
- Lucide React

### Backend
- Python 3.11+
- FastAPI
- Pydantic
- PyMuPDF
- python-docx
- scikit-learn
- Sentence Transformers

## Run locally on Windows 11

### 1. Backend

Install Python 3.11 or newer.

```powershell
cd backend
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend:
- http://localhost:8000
- Swagger: http://localhost:8000/docs
- Health: http://localhost:8000/health

If PowerShell blocks activation, use:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

The first semantic analysis downloads the small `all-MiniLM-L6-v2` model. With an 8 GB RAM computer, it should be reasonable. If you want the lightweight fallback only:

```env
ENABLE_SEMANTIC_MODEL=false
```

### 2. Frontend

Open a second PowerShell window:

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:3000.

Optional:

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

The application defaults to that URL, so the file is optional locally.

## GitHub

The repository is intentionally monorepo-style:

```text
ai-resume-matcher/
├── frontend/
├── backend/
├── docs/
├── .env.example
├── .gitignore
└── README.md
```

Push the whole folder to **one GitHub repository**.

## Deploy frontend to Vercel

1. Push the repository to GitHub.
2. Import the repository into Vercel.
3. In Vercel project settings, set:
   - Root Directory: `frontend`
4. Build command: `npm run build`
5. Add environment variable:

```text
NEXT_PUBLIC_API_URL=https://YOUR-RENDER-SERVICE.onrender.com
```

6. Deploy.

## Deploy backend to Render

Create a new **Web Service** and connect the same GitHub repository.

Use:

- Root Directory: `backend`
- Runtime: Python 3
- Build Command:

```bash
pip install -r requirements.txt
```

- Start Command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Add these environment variables if desired:

```text
ENABLE_SEMANTIC_MODEL=true
SEMANTIC_MODEL=all-MiniLM-L6-v2
ALLOWED_ORIGINS=https://YOUR-VERCEL-DOMAIN.vercel.app
```

After Render deploys, copy its URL into Vercel as `NEXT_PUBLIC_API_URL`.

### Important about Render free services

A free web service may sleep when idle, so the first request after inactivity can be slow. This is normal and does not mean the application is broken.

## No database required

This version intentionally avoids Supabase.

Recent analyses are stored in browser `localStorage`. That means:

- no account
- no schema
- no database credentials
- no backend database maintenance
- easy free deployment

The tradeoff is that analysis history is device/browser-specific and is not synchronized across devices.

## API

### `GET /health`

Returns backend status.

### `POST /api/analyze`

Multipart fields:

- `resume`: PDF/DOCX file
- `job_description`: job posting text

Returns a structured analysis JSON response.

## Security and privacy

- Resume files are processed in memory and are not permanently uploaded by the backend.
- Do not commit `.env` files.
- Never put server-only secrets in `NEXT_PUBLIC_*` variables.
- For production, restrict `ALLOWED_ORIGINS` to your Vercel domain.

## Project structure

```text
frontend/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
└── ...

backend/
├── app/
│   ├── api/routes/analyze.py
│   ├── services/
│   │   ├── matcher.py
│   │   └── resume_parser.py
│   └── main.py
├── tests/
├── requirements.txt
└── Dockerfile

docs/
├── ARCHITECTURE.md
└── DEPLOYMENT.md
```

## License

MIT
