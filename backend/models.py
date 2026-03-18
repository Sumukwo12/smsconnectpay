from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship
from database import Base
import datetime
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    profile = relationship("Profile", back_populates="user", uselist=False)
    roles = relationship("UserRole", back_populates="user")
    messages = relationship("Message", back_populates="user")
    payments = relationship("Payment", back_populates="user")

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(String, ForeignKey("users.id"), primary_key=True)
    name = Column(String, nullable=False, default="")
    email = Column(String, nullable=False)
    phone_number = Column(String, nullable=False, default="")
    sms_token_balance = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="profile")

class UserRole(Base):
    __tablename__ = "user_roles"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    role = Column(String, nullable=False)
    
    user = relationship("User", back_populates="roles")

class Payment(Base):
    __tablename__ = "payments"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    phone_number = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    mpesa_transaction_code = Column(String, nullable=True)
    tokens_added = Column(Integer, default=0, nullable=False)
    status = Column(String, default="pending", nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="payments")

class Message(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    recipient_phone = Column(String, nullable=False)
    message_content = Column(String, nullable=False)
    status = Column(String, default="pending", nullable=False)
    token_cost = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="messages")
