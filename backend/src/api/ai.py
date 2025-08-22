from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from tempfile import NamedTemporaryFile
from faster_whisper import WhisperModel
import os

router = APIRouter()

# --------- Chargement paresseux du modèle (évite coût au boot) ----------
_model = None
def get_model():
    global _model
    if _model is None:
        # "base" : bon compromis. Tu peux mettre "small" / "medium" si tu veux + précis.
        _model = WhisperModel("base", device="cpu", compute_type="int8")  # CPU friendly
    return _model

class CompletionOut(BaseModel):
    completion: str

@router.post("/complete", response_model=CompletionOut)
def complete(payload: CompletionOut):  # placeholder existant si tu l’avais
    return payload

# --------- Nouveau: /ai/transcribe --------------------------------------
class TranscribeOut(BaseModel):
    text: str
    language: str | None = None

@router.post("/transcribe", response_model=TranscribeOut)
async def transcribe(file: UploadFile = File(...)):
    # Sécurité minimale
    if not file.content_type.startswith("audio/"):
        raise HTTPException(400, detail=f"Type non audio: {file.content_type}")

    # Sauvegarde temporaire
    suffix = os.path.splitext(file.filename or "audio.webm")[-1] or ".webm"
    with NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        model = get_model()
        # faster-whisper appelle ffmpeg en interne → nécessite ffmpeg installé
        segments, info = model.transcribe(tmp_path, beam_size=1)  # greedy: rapide
        text = "".join(seg.text for seg in segments).strip()
        return TranscribeOut(text=text, language=(info.language if hasattr(info, "language") else None))
    except Exception as e:
        raise HTTPException(500, detail=f"Transcription error: {e}")
    finally:
        try:
            os.remove(tmp_path)
        except Exception:
            pass