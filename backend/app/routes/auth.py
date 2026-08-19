from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from app.core.config import settings
from app.core.security import hash_password, verify_password, create_access_token
from app.core.dependencies import get_current_active_user
from app.database.database import get_db
from app.models import User, Role, UserRole
from app.schemas.auth import UserCreate, UserLogin, Token, UserResponse
from app.services.audit import create_audit_log

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user. ADMIN role cannot be self-registered."""

    # Prevent public ADMIN registration
    if user_data.role_name == UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin accounts cannot be self-registered. Contact an administrator."
        )

    # Validate passwords match
    if user_data.password != user_data.confirm_password:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Passwords do not match.")

    # Validate password strength
    if len(user_data.password) < 8:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Password must be at least 8 characters.")

    # Normalize and check duplicate email
    email = user_data.email.strip().lower()
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists.")

    # Get role
    role = db.query(Role).filter(Role.name == user_data.role_name).first()
    if not role:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role specified.")

    new_user = User(
        full_name=user_data.full_name.strip(),
        email=email,
        password_hash=hash_password(user_data.password),
        role_id=role.id,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    create_audit_log(db, action="REGISTER", entity_type="User", entity_id=new_user.id,
                     new_value=f"User registered: {email} with role {user_data.role_name}")

    return UserResponse(
        id=new_user.id,
        full_name=new_user.full_name,
        email=new_user.email,
        role=new_user.role.name,
        is_active=new_user.is_active
    )


@router.post("/login", response_model=Token)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """Authenticate user and return a JWT access token."""
    email = user_data.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()

    if not user or not verify_password(user_data.password, user.password_hash):
        # Log failed attempt (do NOT log password)
        create_audit_log(db, action="LOGIN_FAILED", entity_type="User",
                         new_value=f"Failed login attempt for email: {email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email or password is incorrect.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your account is currently inactive. Please contact an administrator."
        )

    access_token = create_access_token(
        subject=user.id,
        role=user.role.name,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    create_audit_log(db, action="LOGIN_SUCCESS", entity_type="User", entity_id=user.id,
                     user_id=user.id, new_value=f"Successful login: {email}")

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            full_name=user.full_name,
            email=user.email,
            role=user.role.name,
            is_active=user.is_active
        )
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_active_user)):
    """Return the profile of the currently authenticated user."""
    return UserResponse(
        id=current_user.id,
        full_name=current_user.full_name,
        email=current_user.email,
        role=current_user.role.name,
        is_active=current_user.is_active
    )


@router.post("/logout")
def logout(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """
    Logout endpoint. The client should discard its access token.
    NOTE: Token revocation/blacklisting is not implemented in Phase 2.
    Access tokens expire based on ACCESS_TOKEN_EXPIRE_MINUTES.
    """
    create_audit_log(db, action="LOGOUT", entity_type="User",
                     entity_id=current_user.id, user_id=current_user.id)
    return {"message": "Logged out successfully. Please discard your access token."}
