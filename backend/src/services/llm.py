import os
import httpx
from fastapi import HTTPException

PROVIDER = os.getenv("LLM_PROVIDER", "ollama")
HOST = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434")

# Par défaut, on prend le tag que tu as déjà tiré.
MODEL = os.getenv("LLM_MODEL", "gemma2:latest")

# 🔧 Réglages pour maximiser la fidélité et limiter les hallucinations
LLM_OPTIONS = {
    "temperature": 0.2,       # sorties plus factuelles
    "top_p": 0.9,
    "repeat_penalty": 1.1,
    "num_ctx": 8192,          # plus de contexte visible par le modèle
    # "num_predict": 1024,    # optionnel: plafonne la longueur de sortie
}

SYSTEM = (
    "Tu es un rédacteur de comptes rendus techniques en français. "
    "Objectif: EXHAUSTIVITÉ, ZÉRO PERTE D'INFO, AUCUNE INVENTION.\n"
    "- Conserve TOUTES les informations opérationnelles: horaires, lieux, équipements, "
    "mesures, seuils/consignes, anomalies, décisions, actions, personnes/équipes, suivis.\n"
    "- Conserve les UNITÉS, les VALEURS CHIFFRÉES, les NOMS d’équipements (ex: P_RRI_03), "
    "et les observations exactes (ex: bruits, doses, températures).\n"
    "- Si une rubrique n’a pas d’information dans le verbatim, LAISSE-LA VIDE (n’invente pas).\n"
    "- Formate la sortie STRICTEMENT en Markdown, sections ci‑dessous, sans autre texte.\n"
)

TEMPLATE = """Reformate le texte suivant SANS RÉSUMER NI OMETTRE d’informations techniques.
Tu dois réécrire les phrases pour les rendre claires, mais sans perdre de détails.
Respecte EXACTEMENT ce gabarit Markdown (utilise des puces concises et actionnables) :

# Compte rendu
## Contexte
- ...

## Points clés (bullet points)
- ...

## Décisions
- ...

## Actions (qui / quoi / deadline)
- [ ] Responsable: ..., Action: ..., Deadline: JJ/MM/AAAA (ou horizon relatif si aucune date fournie)

## Risques / Points ouverts
- ...

## Prochaines étapes
- ...

Contraintes de sortie :
- Garde toutes les données (heures, valeurs, appareils, lieux, unités).
- N’invente rien : si l’info n’existe pas, laisse la puce vide ou n’ajoute pas de ligne inutile.
- Évite les phrases vagues : chaque puce doit contenir un FAIT précis ou une ACTION.

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
        "options": LLM_OPTIONS,
    }

    try:
        async with httpx.AsyncClient(timeout=120) as client:
            r = await client.post(f"{HOST}/api/chat", json=payload)
            r.raise_for_status()
            data = r.json()
            return (data.get("message", {}).get("content") or "").strip()
    except httpx.ConnectError as e:
        raise HTTPException(503, detail=f"Ollama injoignable sur {HOST}. Lance 'ollama serve'. ({e})")
    except httpx.HTTPStatusError as e:
        raise HTTPException(502, detail=f"Ollama a répondu {e.response.status_code}: {e.response.text[:300]}")
    except Exception as e:
        raise HTTPException(500, detail=f"Erreur LLM: {e}")