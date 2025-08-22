import os
import httpx
from fastapi import HTTPException

PROVIDER = os.getenv("LLM_PROVIDER", "ollama")
HOST = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434")
MODEL = os.getenv("LLM_MODEL", "mistral:instruct")  # <- par défaut: mistral:instruct

SYSTEM = (
    "Tu rédiges des comptes rendus concis et actionnables en français, "
    "sans inventer d'informations. Conserve toutes les informations techniques et opérationnelles. Tu dois être exhaustif : chaque donnée chiffrée, chaque anomalie et chaque décision doivent apparaître."
)

TEMPLATE = """Transcris => Résume => Structure le compte rendu avec ce format Markdown :

# Compte rendu
## Contexte
- ...

## Points clés (bullet points)
- ...

## Décisions
- ...

## Actions (qui / quoi / deadline)
- [ ] Responsable: ..., Action: ..., Deadline: ...

## Risques / Points ouverts
- ...

## Prochaines étapes
- ...

Texte source (verbatim) :
\"\"\"{transcript}\"\"\""""

async def generate_report_from_transcript(transcript: str) -> str:
    if PROVIDER != "ollama":
        raise HTTPException(500, detail="LLM_PROVIDER non supporté")

    messages = [
        {"role": "system", "content": SYSTEM},
        {"role": "user", "content": TEMPLATE.format(transcript=transcript)},
    ]

    payload = {
        "model": MODEL,
        "messages": messages,
        "stream": False,
        # "options": {"num_ctx": 4096},  # optionnel
    }

    try:
        async with httpx.AsyncClient(timeout=120) as client:
            r = await client.post(f"{HOST}/api/chat", json=payload)
            r.raise_for_status()
            data = r.json()
            # /api/chat renvoie { "message": { "content": "..."}, ... }
            return (data.get("message", {}).get("content") or "").strip()
    except httpx.ConnectError as e:
        raise HTTPException(503, detail=f"Ollama injoignable sur {HOST}. Lance 'ollama serve'. ({e})")
    except httpx.HTTPStatusError as e:
        raise HTTPException(502, detail=f"Ollama a répondu {e.response.status_code}: {e.response.text[:300]}")
    except Exception as e:
        raise HTTPException(500, detail=f"Erreur LLM: {e}")