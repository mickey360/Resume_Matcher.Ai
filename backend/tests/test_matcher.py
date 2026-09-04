from app.services.matcher import analyze_match

def test_analysis_shape(monkeypatch):
    monkeypatch.setattr(
        "app.services.matcher.semantic_score",
        lambda resume, job: (80, "test"),
    )

    result = analyze_match(
        "John Doe\njohn@example.com\nBachelor degree\n"
        "Experience: 2 years\nSkills\nPython React Next.js Node.js",
        "We need Python, React, Next.js, Node.js and Docker. "
        "Bachelor degree preferred. 1 year experience required.",
        "resume.pdf",
    )

    assert 0 <= result["overall_score"] <= 100
    assert "python" in result["matching_skills"]
    assert "docker" in result["missing_skills"]
    assert result["extracted"]["email"] == "john@example.com"
