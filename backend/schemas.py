from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str
    name: str = ""
    phone_number: str = ""

class Profile(BaseModel):
    id: str
    name: str
    email: str
    phone_number: str
    sms_token_balance: int
    created_at: datetime
    
    class Config:
        orm_mode = True
        from_attributes = True

class User(UserBase):
    id: str
    created_at: datetime
    profile: Optional[Profile] = None

    class Config:
        orm_mode = True
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    
class MessageCreate(BaseModel):
    recipient_phones: List[str]
    message_content: str
    
class MessageResponse(BaseModel):
    id: str
    user_id: str
    recipient_phone: str
    message_content: str
    status: str
    token_cost: int
    created_at: datetime
    
    class Config:
        orm_mode = True
        from_attributes = True

class PaymentCreate(BaseModel):
    phone_number: str
    amount: float
    tokens_from_amount: int

class PaymentResponse(BaseModel):
    id: str
    user_id: str
    phone_number: str
    amount: float
    mpesa_transaction_code: Optional[str] = None
    tokens_added: int
    status: str
    created_at: datetime
    
    class Config:
        orm_mode = True
        from_attributes = True

class RoleResponse(BaseModel):
    isAdmin: bool
