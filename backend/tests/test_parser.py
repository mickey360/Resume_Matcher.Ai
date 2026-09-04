from app.services.resume_parser import extract_text

def test_unsupported_format():
    try:
        extract_text(b"hello", "resume.txt")
    except ValueError as exc:
        assert "Unsupported" in str(exc)
    else:
        raise AssertionError("Expected ValueError")
