import os
import httpx
from fastapi import HTTPException

PROVIDER = os.getenv("LLM_PROVIDER", "ollama")
HOST = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434")
MODEL = os.getenv("LLM_MODEL", "gemma2:latest")

LLM_OPTIONS = {
    "temperature": 0.2,
    "top_p": 0.9,
    "repeat_penalty": 1.1,
    "num_ctx": 8192,
}

def build_system(author: str, job_title: str, site: str) -> str:
    """
    Construit un system prompt contextualisé (mais SANS jamais autoriser l'invention).
    """
    author_s = author.strip() or "—"
    job_s = job_title.strip() or "—"
    site_s = site.strip() or "—"

    return (
        "Tu es un rédacteur de comptes rendus techniques en français.\n"
        "Objectif : EXHAUSTIVITÉ, ZÉRO PERTE D'INFO, AUCUNE INVENTION.\n"
        "- Conserve TOUTES les informations opérationnelles : horaires, lieux, équipements, "
        "mesures, seuils/consignes, anomalies, décisions, actions, personnes/équipes, suivis.\n"
        "- Conserve les UNITÉS, les VALEURS CHIFFRÉES, les NOMS d’équipements (ex: P_RRI_03), "
        "et les observations exactes (ex: bruits, doses, températures).\n"
        "- Si une rubrique n’a pas d’information dans le verbatim, LAISSE-LA VIDE (n’invente pas).\n"
        "- Tu écris pour {author} (poste : {job}, site : {site}). Cela influence UNIQUEMENT la clarté et la mise en forme, "
        "JAMAIS le fond ni les faits.\n"
        "- Formate la sortie STRICTEMENT en Markdown.\n"
    ).format(author=author_s, job=job_s, site=site_s)

TEMPLATE = """\
Reformate le texte suivant SANS RÉSUMER NI OMETTRE d’informations techniques.
Tu dois réécrire les phrases pour les rendre claires, mais sans perdre de détails.
Ne déduis rien qui ne soit pas dans le verbatim.

Respecte EXACTEMENT ce gabarit Markdown :

# Compte rendu

**Auteur :** {author}  
**Poste :** {job_title}  
**Site :** {site}  
**Date :** {report_date}

## Contexte
- ...

## Points clés (bullet points)
- ...

## Décisions
- ...

## Actions (qui / quoi / deadline)
- [ ] Responsable: ..., Action: ..., Deadline: JJ/MM/AAAA

## Risques / Points ouverts
- ...

## Prochaines étapes
- ...

Contraintes de sortie :
- Garde toutes les données (heures, valeurs, appareils, lieux, unités).
- N’invente rien : si l’info n’existe pas, laisse la puce vide ou n’ajoute pas de ligne inutile.
- Évite les phrases vagues : chaque puce doit contenir un FAIT précis ou une ACTION.

Texte source (verbatim) :
\"\"\"{transcript}\"\"\"\
"""

async def generate_report_from_transcript(
    transcript: str,
    *,
    author: str = "",
    author_email: str = "",
    job_title: str = "",
    site: str = "",
    report_date: str = "",
) -> str:
    """
    Génère un compte rendu personnalisé à partir d'un verbatim et de métadonnées.
    Toutes les métadonnées sont facultatives : si absentes, elles s'affichent vides.
    """
    if PROVIDER != "ollama":
        raise HTTPException(500, detail="LLM_PROVIDER non supporté")

    # Fallbacks propres pour l'affichage
    author = (author or author_email or "").strip() or "—"
    job_title = (job_title or "").strip() or "—"
    site = (site or "").strip() or "—"
    report_date = (report_date or "").strip() or "—"

    system = build_system(author=author, job_title=job_title, site=site)

    user_prompt = TEMPLATE.format(
        author=author,
        job_title=job_title,
        site=site,
        report_date=report_date,
        transcript=transcript,
    )

    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user_prompt},
        ],
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