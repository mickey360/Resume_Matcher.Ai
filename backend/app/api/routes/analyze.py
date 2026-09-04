from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.services.matcher import analyze_match
from app.services.resume_parser import extract_text

router = APIRouter(tags=["analysis"])

MAX_FILE_SIZE = 5 * 1024 * 1024
ALLOWED_EXTENSIONS = {".pdf", ".docx"}

@router.post("/analyze")
async def analyze(
    resume: UploadFile = File(...),
    job_description: str = Form(...),
) -> dict:
    filename = resume.filename or ""
    suffix = filename.lower()[filename.rfind("."):] if "." in filename else ""

    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only PDF and DOCX resumes are supported.")

    if len(job_description.strip()) < 50:
        raise HTTPException(
            status_code=400,
            detail="Please provide a job description with at least 50 characters.",
        )

    content = await resume.read()
    if not content:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Resume must be smaller than 5 MB.")

    try:
        text = extract_text(content, filename)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=422, detail="Could not read this resume file.") from exc

    if len(text.strip()) < 80:
        raise HTTPException(
            status_code=400,
            detail="Not enough readable text was found in the resume.",
        )

    try:
        return analyze_match(text, job_description, filename)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {type(exc).__name__}.",
        ) from exc
