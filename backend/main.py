from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List
import math

import models, schemas, auth, database
from database import engine
from services.sms_provider import sms_service
from services.payment_provider import mpesa_service

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="SMS Connect Pay API")

@app.get("/")
def read_root():
    return {"status": "ok", "message": "SMS Connect Pay API is running"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = auth.jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = schemas.TokenData(email=email)
    except auth.JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.email == token_data.email).first()
    if user is None:
        raise credentials_exception
    return user

def get_current_active_user(current_user: models.User = Depends(get_current_user)):
    return current_user

def is_admin(current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    role = db.query(models.UserRole).filter(models.UserRole.user_id == current_user.id, models.UserRole.role == 'admin').first()
    if not role:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return current_user


@app.post("/api/auth/register", response_model=schemas.Token)
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(new_user)
    db.flush()

    profile = models.Profile(
        id=new_user.id,
        name=user.name,
        email=user.email,
        phone_number=user.phone_number,
        sms_token_balance=10
    )
    db.add(profile)

    role = models.UserRole(user_id=new_user.id, role="user")
    db.add(role)
    
    db.commit()
    db.refresh(new_user)
    
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": new_user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/auth/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/auth/me", response_model=schemas.Profile)
def read_users_me(current_user: models.User = Depends(get_current_active_user)):
    return current_user.profile

@app.get("/api/auth/role", response_model=schemas.RoleResponse)
def read_user_role(current_user: models.User = Depends(get_current_active_user), db: Session = Depends(database.get_db)):
    role = db.query(models.UserRole).filter(models.UserRole.user_id == current_user.id, models.UserRole.role == 'admin').first()
    return {"isAdmin": role is not None}


@app.post("/api/messages", response_model=List[schemas.MessageResponse])
async def send_messages(msg: schemas.MessageCreate, current_user: models.User = Depends(get_current_active_user), db: Session = Depends(database.get_db)):
    num_recipients = len(msg.recipient_phones)
    if num_recipients == 0:
        return []

    msg_length = len(msg.message_content)
    num_segments = math.ceil(msg_length / 160) if msg_length > 0 else 1
    
    total_cost = num_segments * num_recipients
    
    if current_user.profile.sms_token_balance < total_cost:
        raise HTTPException(status_code=400, detail=f"Insufficient tokens. Required: {total_cost}, Available: {current_user.profile.sms_token_balance}")

    await sms_service.send_sms(msg.recipient_phones, msg.message_content)

    current_user.profile.sms_token_balance -= total_cost
    
    new_messages = []
    for phone in msg.recipient_phones:
        new_msg = models.Message(
            user_id=current_user.id,
            recipient_phone=phone,
            message_content=msg.message_content,
            status="sent",
            token_cost=num_segments
        )
        db.add(new_msg)
        new_messages.append(new_msg)
    
    db.commit()
    for m in new_messages:
        db.refresh(m)
    
    return new_messages

@app.get("/api/messages", response_model=List[schemas.MessageResponse])
def get_messages(current_user: models.User = Depends(get_current_active_user), db: Session = Depends(database.get_db)):
    messages = db.query(models.Message).filter(models.Message.user_id == current_user.id).order_by(models.Message.created_at.desc()).all()
    return messages


@app.post("/api/payments", response_model=schemas.PaymentResponse)
async def top_up(payment: schemas.PaymentCreate, current_user: models.User = Depends(get_current_active_user), db: Session = Depends(database.get_db)):

    await mpesa_service.trigger_stk_push(payment.phone_number, payment.amount)

    new_payment = models.Payment(
        user_id=current_user.id,
        phone_number=payment.phone_number,
        amount=payment.amount,
        tokens_added=payment.tokens_from_amount,
        status="completed"
    )
    db.add(new_payment)

    current_user.profile.sms_token_balance += payment.tokens_from_amount
    
    db.commit()
    db.refresh(new_payment)
    return new_payment

@app.get("/api/payments", response_model=List[schemas.PaymentResponse])
def get_payments(current_user: models.User = Depends(get_current_active_user), db: Session = Depends(database.get_db)):
    payments = db.query(models.Payment).filter(models.Payment.user_id == current_user.id).order_by(models.Payment.created_at.desc()).all()
    return payments


@app.get("/api/admin/users", response_model=List[schemas.Profile])
def admin_get_users(admin_user: models.User = Depends(is_admin), db: Session = Depends(database.get_db)):
    profiles = db.query(models.Profile).all()
    return profiles

@app.get("/api/admin/payments", response_model=List[schemas.PaymentResponse])
def admin_get_payments(admin_user: models.User = Depends(is_admin), db: Session = Depends(database.get_db)):
    payments = db.query(models.Payment).order_by(models.Payment.created_at.desc()).all()
    return payments

@app.get("/api/admin/messages", response_model=List[schemas.MessageResponse])
def admin_get_messages(admin_user: models.User = Depends(is_admin), db: Session = Depends(database.get_db)):
    messages = db.query(models.Message).order_by(models.Message.created_at.desc()).all()
    return messages
