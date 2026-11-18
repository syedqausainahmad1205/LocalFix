import os
import uuid
import mimetypes
from pathlib import Path
from typing import Tuple, Optional
from fastapi import UploadFile, HTTPException, status

BASE_DIR = Path(__file__).resolve().parent.parent.parent
STORAGE_DIR = BASE_DIR / "storage"
PRIVATE_DOCS_DIR = STORAGE_DIR / "private_documents"
AVATARS_DIR = STORAGE_DIR / "avatars"

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_DOC_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".webp", ".doc", ".docx"}
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


def ensure_storage_dirs() -> None:
    """Ensure that dedicated storage directories exist on disk."""
    PRIVATE_DOCS_DIR.mkdir(parents=True, exist_ok=True)
    AVATARS_DIR.mkdir(parents=True, exist_ok=True)


ensure_storage_dirs()


def validate_file_header(contents: bytes, ext: str) -> bool:
    """
    Validate magic bytes / header signatures to ensure the file is not a disguised executable.
    """
    if ext == ".pdf":
        return contents.startswith(b"%PDF")
    if ext in [".jpg", ".jpeg"]:
        return contents.startswith(b"\xff\xd8\xff")
    if ext == ".png":
        return contents.startswith(b"\x89PNG\r\n\x1a\n")
    if ext == ".webp":
        return contents.startswith(b"RIFF") and b"WEBP" in contents[:16]
    return True  # Fallback for other document types


async def save_uploaded_document(
    file: UploadFile,
    is_private: bool = True,
    allowed_extensions: Optional[set] = None
) -> str:
    """
    Securely validate and store an uploaded file on disk.
    Returns the stored filename (UUID-based).
    """
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file was provided for upload."
        )

    # Sanitize and extract extension
    filename = os.path.basename(file.filename)
    ext = os.path.splitext(filename)[1].lower()

    valid_exts = allowed_extensions or (ALLOWED_DOC_EXTENSIONS if is_private else ALLOWED_IMAGE_EXTENSIONS)
    if ext not in valid_exts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed extensions: {', '.join(sorted(valid_exts))}."
        )

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size of {MAX_FILE_SIZE_BYTES // (1024 * 1024)}MB."
        )

    if not validate_file_header(contents, ext):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File content does not match the stated file type."
        )

    # Generate unguessable UUID filename
    secure_filename = f"{uuid.uuid4().hex}{ext}"
    target_dir = PRIVATE_DOCS_DIR if is_private else AVATARS_DIR
    target_path = target_dir / secure_filename

    # Ensure no path traversal
    if not str(target_path.resolve()).startswith(str(target_dir.resolve())):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid destination path detected."
        )

    with open(target_path, "wb") as f:
        f.write(contents)

    return secure_filename


def get_private_document_path(filename: str) -> Path:
    """
    Resolve and verify that a private document exists within the private documents directory.
    Prevents path traversal attacks.
    """
    if not filename or ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file identifier."
        )

    file_path = (PRIVATE_DOCS_DIR / filename).resolve()
    if not str(file_path).startswith(str(PRIVATE_DOCS_DIR.resolve())):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access to specified file is forbidden."
        )

    if not file_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document file not found."
        )

    return file_path


def get_avatar_path(filename: str) -> Path:
    """Resolve and verify that a profile photo exists within the avatars directory."""
    if not filename or ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid avatar identifier."
        )

    file_path = (AVATARS_DIR / filename).resolve()
    if not str(file_path).startswith(str(AVATARS_DIR.resolve())):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden."
        )

    if not file_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Avatar photo not found."
        )

    return file_path
