from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import database, models
from ..schemas import user as user_schema
from ..services.auth import get_password_hash, verify_password, create_access_token
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from ..config import settings

import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        email: str = payload.get("sub")
        if email is None:
            logger.error("Token payload has no sub (email).")
            raise credentials_exception
    except JWTError as e:
        logger.error(f"JWT Decode error: {e}")
        raise credentials_exception
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        logger.error(f"User {email} not found during token validation.")
        raise credentials_exception
    return user

@router.post("/register", response_model=user_schema.UserResponse)
def register(user: user_schema.UserCreate, db: Session = Depends(database.get_db)):
    try:
        logger.info(f"Attempting to register user: {user.email}")
        db_user = db.query(models.User).filter(models.User.email == user.email).first()
        if db_user:
            logger.warning(f"Registration failed: Email already registered - {user.email}")
            raise HTTPException(status_code=400, detail="Email already registered")
        if user.password != user.confirm_password:
            logger.warning("Registration failed: Passwords do not match")
            raise HTTPException(status_code=400, detail="Passwords do not match")
        
        hashed_password = get_password_hash(user.password)
        new_user = models.User(name=user.name, email=user.email, password_hash=hashed_password)
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        logger.info(f"User {user.email} registered successfully with ID {new_user.id}")
        return new_user
    except Exception as e:
        logger.error(f"Register Exception: {e}", exc_info=True)
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@router.post("/login", response_model=user_schema.Token)
def login(user_credentials: user_schema.UserLogin, db: Session = Depends(database.get_db)):
    try:
        logger.info(f"Attempting login for email: {user_credentials.email}")
        user = db.query(models.User).filter(models.User.email == user_credentials.email).first()
        if not user:
            logger.warning(f"Login failed: User not found for email {user_credentials.email}")
            raise HTTPException(status_code=403, detail="Invalid credentials")
        
        if not verify_password(user_credentials.password, user.password_hash):
            logger.warning(f"Login failed: Invalid password for email {user_credentials.email}")
            raise HTTPException(status_code=403, detail="Invalid credentials")
        
        access_token = create_access_token(data={"sub": user.email})
        logger.info(f"Login successful for email: {user_credentials.email}")
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        logger.error(f"Login Exception: {e}", exc_info=True)
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")
