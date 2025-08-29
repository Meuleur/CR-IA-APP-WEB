

## 📄 README – Système IA de génération de Compte Rendu

🚀 Présentation

Ce projet est un système de génération automatisée de comptes rendus basé sur l’IA.
L’utilisateur saisit des informations de contexte (poste, site, nom, prénom et Email), enregistre un audio, puis l’application :
	1.	Transcrit l’audio avec Whisper,
	2.	Enrichit les données avec un modèle LLM (Gemma 9B),
	3.	Produit un compte rendu en Markdown,
	4.	Permet à l’utilisateur de télécharger le document directement en Word ou de l’envoyer par email.

⸻

### 🛠️ Fonctionnement étape par étape

1. Page de saisie des informations
	L’utilisateur renseigne :
	•	Nom
	•	Prénom
	•	Poste
	•	Site
  • Email

Ces informations sont sauvegardées temporairement et serviront à contextualiser le compte rendu.

⸻

2. Enregistrement de l’audio
	•	L’utilisateur accède à une page d’enregistrement.
	•	Il peut enregistrer directement un audio via le navigateur.
	•	Le fichier audio est envoyé au backend.

⸻

3. Transcription avec Whisper
	•	Le backend utilise Whisper pour convertir l’audio en texte brut.
	•	Exemple de transcription :
“Aujourd’hui nous avons effectué une vérification complète du système RRI…”

⸻

4. Génération du compte rendu
	•	Les données (informations saisies + transcription) sont envoyées à un LLM Gemma 9B.
	•	Le modèle produit un compte rendu structuré en Markdown :

# Compte rendu – [Nom Prénom]
## Poste : [poste]
## Site : [site]

### Synthèse de la réunion
- ...
- ...



⸻

5. Export et diffusion
	•	L’utilisateur peut :
	•	Télécharger le compte rendu en Word (.docx)
	•	Envoyer le compte rendu par email via un bouton intégré

⸻

📦 Technologies utilisées
	•	Frontend : React / Streamlit (selon implémentation)
	•	Audio : API MediaRecorder (navigateur)
	•	Transcription : Whisper
	•	LLM : Gemma 9B
	•	Export : 
	•	Markdown natif
	•	Conversion en .docx via python-docx ou pypandoc
	•	Email : Nodemailer (Node.js) ou SMTPlib (Python)

⸻

▶️ Lancer le projet

1. Cloner le repo

git clone https://github.com/mon-projet/compte-rendu-ia.git
git checkout user

2. Installer les dépendances

Backend (Python + FastAPI) :

```bash
cd bakcend
pip install -r requirements.txt
``` 

Frontend (React/Streamlit) :

```bash
cd frontend
npm install
``` 

3. Lancer le serveur backend

``` bash
uvicorn src.main:app --reload --port 8000
``` 

4. Lancer le frontend

```bash
npm run dev
``` 

5. Utilisation
	1.	Accéder à http://localhost:{frontend}
	2.	Remplir les informations (Nom, Prénom, Poste, Site, Email)
	3.	Enregistrer un audio
	4.	Générer le compte rendu
	5.	Exporter ou envoyer par email


⸻

🔒 Sécurité & conformité
	•	Les données sont traitées localement (pas d’envoi externe).
	•	Les emails utilisent un serveur sécurisé (TLS).
	•	Conforme RGPD : stockage minimal, suppression après usage.

⸻

📌 TODO / Améliorations futures
	•	Ajout d’une interface de correction manuelle avant export.
	•	Support multi-utilisateurs avec authentification.
	•	Export en PDF en plus du Word.
	•	Statistiques globales sur les comptes rendus générés (Dashboard admin)
