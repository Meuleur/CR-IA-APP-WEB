from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

router = APIRouter()

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"

@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn):
    # placeholder : renvoie un faux token pour tester l’enchaînement
    if payload.email and payload.password:
        return TokenOut(access_token="demo.jwt.token")
    raise HTTPException(status_code=401, detail="Identifiants invalides")
