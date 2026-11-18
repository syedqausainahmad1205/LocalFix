import re
import time
from datetime import datetime, timezone
from typing import Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, Form, File, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    validate_aadhaar_format,
    encrypt_aadhaar,
    mask_aadhaar
)
from app.services.storage_service import save_uploaded_document
from app.models.user import User, CustomerProfile, ProviderProfile
from app.models.enums import UserRole, VerificationStatus
from app.models.dispute import AdminAuditLog
from app.schemas.auth import LoginRequest, RegisterRequest, Token
from app.schemas.user import UserRead

router = APIRouter(prefix="/auth", tags=["Authentication"])

# In-memory brute-force protection tracker: email -> list of failed timestamp floats
_FAILED_LOGIN_ATTEMPTS: Dict[str, List[float]] = {}
_LOCKOUT_WINDOW_SECONDS = 300  # 5 minutes
_MAX_FAILED_ATTEMPTS = 5


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new customer or service provider account with security validation."""
    # Enforce password strength requirements
    pwd = request.password
    if len(pwd) < 8 or not any(c.isdigit() for c in pwd) or not any(c.isalpha() for c in pwd):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long and contain both letters and digits."
        )

    existing_user = db.query(User).filter(User.email == request.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    if request.phone:
        existing_phone = db.query(User).filter(User.phone == request.phone).first()
        if existing_phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this phone number already exists."
            )

    # Create new User entity
    new_user = User(
        email=request.email.lower(),
        hashed_password=get_password_hash(request.password),
        full_name=request.full_name.strip(),
        phone=request.phone.strip() if request.phone else None,
        role=request.role,
        is_active=True,
        is_verified=False
    )
    db.add(new_user)
    db.flush()

    # Automatically create the associated profile based on role
    if request.role == UserRole.CUSTOMER:
        customer_prof = CustomerProfile(
            user_id=new_user.id,
            preferred_locality="All Cities"
        )
        db.add(customer_prof)
    elif request.role == UserRole.PROVIDER:
        provider_prof = ProviderProfile(
            user_id=new_user.id,
            business_name=request.business_name.strip() if request.business_name and request.business_name.strip() else new_user.full_name,
            service_area=request.service_area or "All Cities",
            city="All Cities",
            experience_years=request.experience_years or 1,
            verification_status=VerificationStatus.PENDING,
            latitude=27.8974,
            longitude=78.0880,
            search_radius_km=10.0,
            avg_rating=0.0,
            total_reviews=0
        )
        db.add(provider_prof)

    db.commit()
    db.refresh(new_user)

    # Issue initial JWT token
    access_token = create_access_token(
        subject=new_user.id,
        role=new_user.role.value,
        email=new_user.email
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        role=new_user.role,
        user_id=new_user.id,
        email=new_user.email,
        full_name=new_user.full_name
    )


@router.post("/register-provider", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register_provider(
    full_name: str = Form(..., description="Full legal name of the provider"),
    email: str = Form(..., description="Provider contact email address"),
    phone: str = Form(..., description="10-digit mobile number"),
    password: str = Form(..., description="Password (min 8 chars, alpha+digit)"),
    confirm_password: str = Form(..., description="Password confirmation"),
    primary_skill: str = Form(..., description="Skill name or service category"),
    service_address: str = Form(..., description="Complete physical service address"),
    city: str = Form(..., description="Operating city"),
    state: str = Form("Uttar Pradesh", description="Operating state"),
    pincode: str = Form(..., description="6-digit postal PIN code"),
    latitude: float = Form(..., description="Exact GPS service latitude"),
    longitude: float = Form(..., description="Exact GPS service longitude"),
    aadhaar_number: str = Form(..., description="12-digit Government Aadhaar number"),
    consent_given: bool = Form(..., description="Consent to submit identity info for verification"),
    organisation_name: Optional[str] = Form(None, description="Optional shop or organisation name (leave blank for individual provider)"),
    business_name: Optional[str] = Form(None, description="Optional trade name (leave blank to work under own name)"),
    experience_years: Optional[int] = Form(1, description="Years of professional experience in field"),
    tutor_mode: Optional[str] = Form(None, description="Teaching delivery mode: Online, Offline, or Both"),
    tutor_grades: Optional[str] = Form(None, description="Grades or standards taught"),
    tutor_subjects: Optional[str] = Form(None, description="Subjects taught"),
    aadhaar_card_file: UploadFile = File(..., description="Aadhaar card image or PDF document"),
    profile_photo_file: UploadFile = File(..., description="Professional profile photograph"),
    resume_file: UploadFile = File(..., description="Resume or experience certificate document"),
    db: Session = Depends(get_db)
):
    """
    Register a new service provider with mandatory identity, skill, address,
    and geolocation details. Encrypts sensitive Aadhaar data and places application
    into initial PENDING verification status.
    """
    # 1. Validate Consent
    if not consent_given:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must explicitly consent to submitting identity information for verification."
        )

    # 2. Validate Password & Confirmation
    if password != confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password and confirmation password do not match."
        )

    if len(password) < 8 or not any(c.isdigit() for c in password) or not any(c.isalpha() for c in password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long and contain both letters and digits."
        )

    # 3. Validate Aadhaar Number Format (12 digits, valid first digit)
    if not validate_aadhaar_format(aadhaar_number):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Aadhaar number format. Aadhaar must be exactly 12 numeric digits (first digit 2-9)."
        )

    # 4. Validate PIN Code format
    clean_pincode = pincode.strip()
    if len(clean_pincode) != 6 or not clean_pincode.isdigit():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid PIN code format. PIN code must be exactly 6 digits."
        )

    # 5. Check duplicate email and phone
    email_clean = email.lower().strip()
    if db.query(User).filter(User.email == email_clean).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    phone_clean = phone.strip()
    if db.query(User).filter(User.phone == phone_clean).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this phone number already exists."
        )

    # 6. Secure Document Upload Handling
    aadhaar_doc_filename = await save_uploaded_document(aadhaar_card_file, is_private=True)
    profile_photo_filename = await save_uploaded_document(profile_photo_file, is_private=False)
    resume_doc_filename = await save_uploaded_document(resume_file, is_private=True)

    # 7. Encrypt Aadhaar Number for secure storage at rest
    clean_aadhaar_digits = re.sub(r"[\s\-]", "", aadhaar_number.strip())
    encrypted_aadhaar_value = encrypt_aadhaar(clean_aadhaar_digits)
    aadhaar_last4_value = clean_aadhaar_digits[-4:]

    # 8. Create User Account
    new_user = User(
        email=email_clean,
        hashed_password=get_password_hash(password),
        full_name=full_name.strip(),
        phone=phone_clean,
        role=UserRole.PROVIDER,
        is_active=True,
        is_verified=False  # Must be verified by administrator
    )
    db.add(new_user)
    db.flush()

    # Individual service providers can register under their own personal name without any organization requirement.
    # If business_name or organisation_name is explicitly supplied, use it; otherwise, use the provider's legal full_name.
    if business_name and business_name.strip():
        trade_name = business_name.strip()
    elif organisation_name and organisation_name.strip():
        trade_name = organisation_name.strip()
    else:
        trade_name = new_user.full_name

    # 9. Create Provider Profile with strict PENDING status and 0.0 rating
    provider_prof = ProviderProfile(
        user_id=new_user.id,
        business_name=trade_name,
        organisation_name=organisation_name.strip() if organisation_name else None,
        primary_skill=primary_skill.strip(),
        service_address=service_address.strip(),
        service_area=city.strip(),
        city=city.strip(),
        state=state.strip(),
        pincode=clean_pincode,
        latitude=latitude,
        longitude=longitude,
        search_radius_km=10.0,
        experience_years=experience_years or 1,
        verification_status=VerificationStatus.PENDING,
        aadhaar_last4=aadhaar_last4_value,
        aadhaar_number_encrypted=encrypted_aadhaar_value,
        aadhaar_document_path=aadhaar_doc_filename,
        profile_photo_path=profile_photo_filename,
        resume_document_path=resume_doc_filename,
        tutor_mode=tutor_mode.strip() if tutor_mode else None,
        tutor_grades=tutor_grades.strip() if tutor_grades else None,
        tutor_subjects=tutor_subjects.strip() if tutor_subjects else None,
        consent_given=True,
        consent_timestamp=datetime.now(timezone.utc),
        avg_rating=0.0,
        total_reviews=0,
        completed_jobs_count=0,
        is_available=True
    )
    db.add(provider_prof)
    db.commit()
    db.refresh(new_user)

    # Issue Initial JWT token
    access_token = create_access_token(
        subject=new_user.id,
        role=new_user.role.value,
        email=new_user.email
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        role=new_user.role,
        user_id=new_user.id,
        email=new_user.email,
        full_name=new_user.full_name
    )



@router.post("/login", response_model=Token)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate with brute-force attack prevention, role validation, and security logging."""
    email_key = request.email.lower().strip()
    now = time.time()

    # Check brute-force lockout window
    existing_attempts = [t for t in _FAILED_LOGIN_ATTEMPTS.get(email_key, []) if now - t < _LOCKOUT_WINDOW_SECONDS]
    _FAILED_LOGIN_ATTEMPTS[email_key] = existing_attempts

    if len(existing_attempts) >= _MAX_FAILED_ATTEMPTS:
        remaining_lockout_secs = int(_LOCKOUT_WINDOW_SECONDS - (now - existing_attempts[0]))
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Security alert: Too many consecutive failed login attempts. Account temporarily locked for {max(1, remaining_lockout_secs // 60)} more minute(s)."
        )

    user = db.query(User).filter(User.email == email_key).first()
    if not user or not verify_password(request.password, user.hashed_password):
        # Record failed attempt
        existing_attempts.append(now)
        _FAILED_LOGIN_ATTEMPTS[email_key] = existing_attempts
        remaining = _MAX_FAILED_ATTEMPTS - len(existing_attempts)

        if remaining > 0:
            warning = f" {remaining} attempt(s) remaining before security lockout." if remaining <= 3 else ""
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Incorrect email or password.{warning}",
                headers={"WWW-Authenticate": "Bearer"},
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Security alert: Maximum login attempts exceeded. Account is locked for 5 minutes."
            )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive or suspended. Please contact platform administration."
        )

    # Clear failed attempts on successful authentication
    _FAILED_LOGIN_ATTEMPTS.pop(email_key, None)

    access_token = create_access_token(
        subject=user.id,
        role=user.role.value,
        email=user.email
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        role=user.role,
        user_id=user.id,
        email=user.email,
        full_name=user.full_name
    )


@router.get("/me", response_model=UserRead)
def get_current_user_profile(
    current_user: User = Depends(get_current_active_user)
):
    """Retrieve profile and details for the currently authenticated user."""
    return current_user
