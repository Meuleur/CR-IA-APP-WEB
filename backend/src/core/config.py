import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    SECRET_KEY: str = os.getenv("SECRET_KEY", "changeme")
    ACCESS_EXPIRE_MIN: int = int(os.getenv("ACCESS_EXPIRE_MIN", "30"))
    FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

settings = Settings()
