import { useEffect, useMemo, useState } from "react";
import VoiceCapture from "../components/VoiceCapture";
import { useAuth } from "../store/auth";

type Profile = {
  email: string;
  fullName: string;  // "Nom Prénom" ou "Prénom Nom" selon ton écran de login
  jobTitle: string;
  site: string;
};

const API = import.meta.env.VITE_API_URL.replace(/\/$/, "");

export default function Dashboard() {
  const [text, setText] = useState("");
  const [report, setReport] = useState("");
  const [busy, setBusy] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  // email éventuellement stocké dans ton store
  const emailFromStore = useAuth((s) => s.email) ?? undefined;

  // Au montage : récupère le profil stocké par la page de login
  useEffect(() => {
    try {
      const raw = localStorage.getItem("profile");
      if (raw) {
        const p = JSON.parse(raw) as Profile;
        setProfile(p);
      } else {
        // Fallback minimal si profil absent : on remplit juste l'email via le store
        if (emailFromStore) {
          setProfile({
            email: emailFromStore,
            fullName: "Utilisateur",
            jobTitle: "—",
            site: "—",
          });
        }
      }
    } catch {
      // en cas de JSON mal formé : ignore
    }
  }, [emailFromStore]);

  const currentDate = useMemo(() => new Date().toLocaleDateString("fr-FR"), []);
  const authorLabel = useMemo(() => {
    if (!profile) return "Utilisateur";
    // si tu veux séparer: const [first, ...rest] = profile.fullName.trim().split(/\s+/);
    return profile.fullName?.trim() || profile.email || "Utilisateur";
  }, [profile]);

  async function generateReport() {
    if (!text.trim()) return;
    setBusy(true);
    try {
      const body = {
        transcript: text,
        // 👇 Ajout des infos profil pour contextualiser le CR côté backend
        author: authorLabel,
        author_email: profile?.email ?? emailFromStore ?? "utilisateur",
        job_title: profile?.jobTitle ?? "",
        site: profile?.site ?? "",
        report_date: currentDate,
      };

      const r = await fetch(`${API}/ai/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error(await safeText(r));
      const data = await r.json(); // { report_md }
      setReport(data.report_md);
    } catch (e: any) {
      alert(e?.message || "Erreur génération compte rendu");
    } finally {
      setBusy(false);
    }
  }

  async function downloadWord() {
    if (!report.trim()) return;
    const body = {
      report_md: report,
      author: authorLabel,
      author_email: profile?.email ?? emailFromStore ?? "utilisateur",
      job_title: profile?.jobTitle ?? "",
      site: profile?.site ?? "",
      report_date: currentDate,
    };
    const res = await fetch(`${API}/ai/report-docx`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      alert(text || "Erreur lors de la génération Word");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "compte-rendu.docx";
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadMd() {
    if (!report.trim()) return;
    const blob = new Blob([report], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: "compte-rendu.md" });
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copyReport() {
    if (!report.trim()) return;
    try {
      await navigator.clipboard.writeText(report);
      alert("Compte rendu copié dans le presse‑papiers ✅");
    } catch {
      alert("Impossible de copier le texte.");
    }
  }

  async function sendByEmail() {
    if (!report.trim()) return;
    const body = {
      report_md: report,
      author: authorLabel,
      author_email: profile?.email ?? emailFromStore ?? "utilisateur",
      job_title: profile?.jobTitle ?? "",
      site: profile?.site ?? "",
      report_date: currentDate,
    };
    const res = await fetch(`${API}/ai/report-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      alert(text || "Erreur lors de l’envoi par mail");
      return;
    }
    alert("📧 Compte rendu envoyé par email !");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-200/60 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-3 md:py-4">
          <h1 className="text-lg md:text-2xl font-semibold text-slate-900">
            Dashboard {profile ? `— ${authorLabel} (${profile.jobTitle} · ${profile.site})` : ""}
          </h1>
          <p className="text-sm md:text-base text-slate-600">
            Enregistre → Transcris → Génère le compte rendu.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 md:py-8 space-y-6">
        {/* Carte principale */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="p-4 md:p-6">
            {/* GRID responsive */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* COL 1 — Enregistrement + Transcription */}
              <section className="space-y-4">
                <div className="rounded-xl border border-slate-200 p-4">
                  <h2 className="mb-2 text-base md:text-lg font-medium text-slate-900">
                    Capture audio
                  </h2>
                  <p className="mb-4 text-sm text-slate-600">
                    Autorise le micro, enregistre puis stoppe avant de transcrire.
                  </p>
                  <VoiceCapture onText={setText} />
                </div>

                <div className="rounded-xl border border-slate-200 p-4">
                  <label htmlFor="transcription" className="block text-sm font-medium text-slate-800">
                    Transcription
                  </label>
                  <textarea
                    id="transcription"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="mt-2 w-full min-h[160px] rounded-xl border border-slate-300 bg-white p-3 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    placeholder="La transcription apparaîtra ici…"
                  />
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                    <span>{text.trim().length} caractères</span>
                    <button
                      type="button"
                      onClick={() => setText("")}
                      className="underline underline-offset-2 hover:text-slate-700"
                    >
                      Effacer
                    </button>
                  </div>

                  {/* Actions génération (full width mobile) */}
                  <div className="mt-4 grid grid-cols-1 sm:flex sm:items-center sm:gap-2">
                    <button
                      onClick={generateReport}
                      disabled={!text.trim() || busy}
                      className="rounded-xl bg-slate-900 text-white px-4 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {busy ? "Génération…" : "Générer le compte rendu"}
                    </button>
                  </div>
                </div>
              </section>

              {/* COL 2 — Actions export + Aperçu */}
              <section className="space-y-4 md:sticky md:top-24 self-start">
                <div className="rounded-xl border border-slate-200 p-4">
                  <h2 className="mb-3 text-base md:text-lg font-medium text-slate-900">
                    Export
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      onClick={downloadMd}
                      disabled={!report.trim()}
                      className="rounded-xl bg-emerald-600 text-white px-4 py-2.5 disabled:opacity-50"
                    >
                      Télécharger (.md)
                    </button>
                    <button
                      onClick={downloadWord}
                      disabled={!report.trim()}
                      className="rounded-xl bg-indigo-600 text-white px-4 py-2.5 disabled:opacity-50"
                    >
                      Word (.docx)
                    </button>
                    <button
                      onClick={copyReport}
                      disabled={!report.trim()}
                      className="rounded-xl bg-slate-100 text-slate-900 px-4 py-2.5 border border-slate-200 disabled:opacity-50"
                    >
                      Copier le texte
                    </button>
                    <button
                      onClick={sendByEmail}
                      disabled={!report.trim()}
                      className="rounded-xl bg-orange-600 text-white px-4 py-2.5 disabled:opacity-50"
                    >
                      Envoyer par mail
                    </button>
                  </div>
                  {!report && (
                    <p className="mt-3 text-xs text-slate-500">
                      Le compte rendu apparaîtra ici après génération.
                    </p>
                  )}
                </div>

                {report && (
                  <div className="rounded-xl border border-slate-200 p-0 overflow-hidden">
                    <div className="px-4 pt-4">
                      <h2 className="text-base md:text-lg font-medium text-slate-900">
                        Aperçu
                      </h2>
                    </div>
                    <div className="mt-2 max-h-[50vh] overflow-auto bg-slate-50">
                      <pre className="whitespace-pre-wrap p-4 text-sm leading-relaxed text-slate-800">
                        {report}
                      </pre>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

async function safeText(res: Response) {
  try { return await res.text(); } catch { return ""; }
}