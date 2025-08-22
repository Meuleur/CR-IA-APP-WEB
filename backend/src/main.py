# src/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .api import health, auth, ai

app = FastAPI(title="IA App")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ pas de slash final dans prefix
app.include_router(health.router, tags=["health"])         # <-- pas de prefix
app.include_router(auth.router,  prefix="/auth", tags=["auth"])
app.include_router(ai.router,    prefix="/ai",   tags=["ai"])
