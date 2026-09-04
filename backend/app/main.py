import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.analyze import router as analyze_router

app = FastAPI(
    title="AI Resume Matcher API",
    description="Explainable resume-to-job matching using NLP and open-source ML.",
    version="1.0.0",
)

origins_raw = os.getenv("ALLOWED_ORIGINS", "*")
origins = [item.strip() for item in origins_raw.split(",") if item.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", tags=["system"])
def health() -> dict[str, str]:
    return {"status": "ok", "service": "ai-resume-matcher-api"}

app.include_router(analyze_router, prefix="/api")
