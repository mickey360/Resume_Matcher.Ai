import os
import re
from datetime import datetime, timezone
from functools import lru_cache
from typing import Iterable

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


SKILLS = [
    "python", "javascript", "typescript", "java", "c++", "c#", "go", "rust", "php",
    "react", "next.js", "nextjs", "vue", "angular", "node.js", "nodejs", "express",
    "fastapi", "django", "flask", "html", "css", "tailwind", "sql", "mysql",
    "postgresql", "mongodb", "firebase", "supabase", "redis", "docker",
    "kubernetes", "aws", "azure", "gcp", "git", "github", "linux", "figma",
    "pandas", "numpy", "scikit-learn", "tensorflow", "pytorch", "machine learning",
    "deep learning", "nlp", "natural language processing", "computer vision",
    "rest api", "graphql", "microservices", "system design", "data analysis",
    "excel", "power bi", "tableau", "communication", "leadership",
    "project management", "ci/cd", "cicd", "jest", "playwright", "pytest"
]

ALIASES = {
    "nextjs": "next.js",
    "nodejs": "node.js",
    "cicd": "ci/cd",
    "natural language processing": "nlp",
}

SECTION_NAMES = [
    "summary", "profile", "experience", "work experience", "education",
    "projects", "skills", "certifications", "awards", "volunteer"
]

def normalize(text: str) -> str:
    text = text.replace("\u00a0", " ")
    return re.sub(r"\s+", " ", text.lower()).strip()


def contains_term(text: str, term: str) -> bool:
    if any(char in term for char in "+#/."):
        return term.lower() in text
    return bool(re.search(rf"(?<![a-z0-9]){re.escape(term.lower())}(?![a-z0-9])", text))


def detect_skills(text: str) -> list[str]:
    normalized = normalize(text)
    found = set()

    for skill in SKILLS:
        if contains_term(normalized, skill):
            found.add(ALIASES.get(skill, skill))

    return sorted(found)


def clamp(value: float) -> int:
    return max(0, min(100, round(value)))


def word_count(text: str) -> int:
    return len(re.findall(r"\b[\w+#.-]+\b", text))


def extract_sections(text: str) -> list[str]:
    normalized_lines = [normalize(line) for line in text.splitlines() if line.strip()]
    result = []

    for section in SECTION_NAMES:
        if any(line == section or line.startswith(section + ":") for line in normalized_lines):
            result.append(section)

    return result


def extract_contact(text: str) -> tuple[str, str, str]:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    name = lines[0][:100] if lines else ""

    email_match = re.search(r"[\w.+-]+@[\w-]+\.[\w.-]+", text)
    phone_match = re.search(r"(?:\+?\d[\d\s().-]{7,}\d)", text)

    return (
        name,
        email_match.group(0) if email_match else "",
        phone_match.group(0).strip() if phone_match else "",
    )


def keyword_score(resume: str, job: str) -> int:
    # Ignore very common English words by using TF-IDF vocabulary overlap.
    vectorizer = TfidfVectorizer(stop_words="english", max_features=2500)
    matrix = vectorizer.fit_transform([resume, job])
    resume_terms = set(vectorizer.inverse_transform(matrix[0])[0])
    job_terms = set(vectorizer.inverse_transform(matrix[1])[0])

    if not job_terms:
        return 0

    return clamp(100 * len(resume_terms & job_terms) / len(job_terms))


@lru_cache(maxsize=1)
def get_embedding_model():
    from sentence_transformers import SentenceTransformer
    model_name = os.getenv("SEMANTIC_MODEL", "all-MiniLM-L6-v2")
    return SentenceTransformer(model_name)


def semantic_score(resume: str, job: str) -> tuple[int, str]:
    enabled = os.getenv("ENABLE_SEMANTIC_MODEL", "true").lower() not in {"0", "false", "no"}

    if enabled:
        try:
            model = get_embedding_model()
            embeddings = model.encode(
                [resume[:14000], job[:14000]],
                normalize_embeddings=True,
            )
            similarity = float(np.dot(embeddings[0], embeddings[1]))
            # Cosine similarity may be negative for unrelated text. Map [-1, 1] to [0, 100].
            return clamp(((similarity + 1) / 2) * 100), "sentence-transformers"
        except Exception:
            pass

    try:
        vectorizer = TfidfVectorizer(stop_words="english", max_features=4000)
        matrix = vectorizer.fit_transform([resume, job])
        similarity = float(cosine_similarity(matrix[0:1], matrix[1:2])[0][0])
        return clamp(similarity * 100), "tf-idf fallback"
    except ValueError:
        return 0, "unavailable"


def experience_score(resume: str, job: str) -> int:
    r = normalize(resume)
    j = normalize(job)

    resume_years = [int(x) for x in re.findall(r"(\d+)\+?\s*(?:years?|yrs?)", r)]
    required_years = [int(x) for x in re.findall(r"(\d+)\+?\s*(?:years?|yrs?)", j)]

    if required_years:
        required = max(required_years)
        actual = max(resume_years, default=0)
        if actual >= required:
            return 100
        if actual > 0:
            return clamp(55 + (actual / required) * 35)

    if any(term in r for term in ["experience", "internship", "intern", "developer", "engineer"]):
        return 75

    return 45


def education_score(resume: str, job: str) -> int:
    r = normalize(resume)
    j = normalize(job)

    degree_terms = ["bachelor", "master", "phd", "degree", "bs ", "ms ", "b.s.", "m.s."]

    if any(term in j for term in degree_terms):
        return 95 if any(term in r for term in degree_terms) else 35

    return 90 if any(term in r for term in degree_terms) else 60


def recommendations(
    *,
    missing: list[str],
    keyword: int,
    experience: int,
    education: int,
    sections: list[str],
    semantic: int,
) -> list[str]:
    items: list[str] = []

    if missing:
        items.append(
            "If you genuinely have experience with them, make these job-relevant skills easier to find: "
            + ", ".join(missing[:8])
            + "."
        )

    if keyword < 65:
        items.append(
            "Tailor your resume terminology to the posting. Reuse relevant job language where it accurately describes your existing work."
        )

    if experience < 70:
        items.append(
            "Strengthen experience entries with measurable outcomes, project scope, tools used, and the impact of your work."
        )

    if education < 70:
        items.append(
            "Make your degree, institution, graduation status, and relevant coursework clearly visible when they are relevant to the role."
        )

    if "projects" not in sections:
        items.append(
            "Add a concise Projects section with 2–4 strong projects, technologies, and measurable results."
        )

    if semantic < 60:
        items.append(
            "The resume and job posting have limited semantic alignment. Rewrite the summary and top experience bullets around the role's core responsibilities."
        )

    if not items:
        items.append(
            "Your resume is well aligned. Keep tailoring the summary and experience bullets with measurable achievements for each application."
        )

    return items[:6]


def analyze_match(resume: str, job: str, filename: str) -> dict:
    r = normalize(resume)
    j = normalize(job)

    resume_skills = detect_skills(r)
    job_skills = detect_skills(j)
    matching = sorted(set(resume_skills) & set(job_skills))
    missing = sorted(set(job_skills) - set(resume_skills))

    skills = clamp(100 * len(matching) / max(len(job_skills), 1))
    keywords = keyword_score(r, j)
    experience = experience_score(r, j)
    education = education_score(r, j)
    semantic, semantic_method = semantic_score(resume, job)

    overall = clamp(
        skills * 0.35
        + keywords * 0.15
        + experience * 0.15
        + education * 0.10
        + semantic * 0.25
    )

    if overall >= 85:
        label = "Excellent Match"
    elif overall >= 70:
        label = "Strong Match"
    elif overall >= 50:
        label = "Moderate Match"
    else:
        label = "Needs Improvement"

    name, email, phone = extract_contact(resume)
    sections = extract_sections(resume)

    return {
        "id": f"analysis-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S%f')}",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "filename": filename,
        "overall_score": overall,
        "label": label,
        "breakdown": {
            "skills": skills,
            "keywords": keywords,
            "experience": experience,
            "education": education,
            "semantic": semantic,
        },
        "matching_skills": matching,
        "missing_skills": missing,
        "resume_skills": resume_skills,
        "job_skills": job_skills,
        "recommendations": recommendations(
            missing=missing,
            keyword=keywords,
            experience=experience,
            education=education,
            sections=sections,
            semantic=semantic,
        ),
        "extracted": {
            "name": name,
            "email": email,
            "phone": phone,
            "sections": sections,
        },
        "stats": {
            "resume_words": word_count(resume),
            "job_words": word_count(job),
            "job_skill_count": len(job_skills),
            "matched_skill_count": len(matching),
            "semantic_method": semantic_method,
        },
    }
