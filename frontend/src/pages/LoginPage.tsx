import React, { useMemo, useState } from "react";

export type LoginPageProps = {
  onSuccess?: (accessToken: string, email: string) => void;
  title?: string;
};

export default function LoginPage({ onSuccess, title = "Connexion" }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState(""); // "Nom Prénom"
  const [jobTitle, setJobTitle] = useState("");
  const [site, setSite] = useState("");

  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const API_URL = useMemo(() => {
    const url = (import.meta as any)?.env?.VITE_API_URL || "http://localhost:8000";
    return url?.replace(/\/$/, "");
  }, []);

  const validate = (): string | null => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Email invalide";
    if (!password || password.length < 6) return "Mot de passe trop court";
    if (!fullName.trim()) return "Renseigne Nom Prénom";
    if (!jobTitle.trim()) return "Renseigne le poste";
    if (!site.trim()) return "Renseigne le site";
    return null;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const v = validate();
    if (v) {
      setError(v);
      pulseShake();
      return;
    }
    setLoading(true);
    try {
      // On envoie aussi fullName, jobTitle, site (le backend peut ignorer)
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // cookie httpOnly (refresh)
        body: JSON.stringify({ email, password, fullName, jobTitle, site })
      });

      if (!res.ok) {
        const text = await safeText(res);
        throw new Error(text || `Erreur ${res.status}`);
      }
      const data = await res.json(); // { access_token }
      if (!data?.access_token) {
        throw new Error("Réponse inattendue du serveur (access_token manquant)");
      }

      // Stocke un profil lisible par le Dashboard (pas de JWT)
      const profile = { email, fullName, jobTitle, site };
      localStorage.setItem("profile", JSON.stringify(profile));
      localStorage.setItem("access_token", data.access_token);

      onSuccess?.(data.access_token, email);
      window.dispatchEvent(new CustomEvent("auth:login", { detail: { token: data.access_token, profile } }));
    } catch (err: any) {
      setError(err?.message || "Connexion impossible. Réessaie.");
      pulseShake();
    } finally {
      setLoading(false);
    }
  };

  function pulseShake() {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className={`bg-white/90 backdrop-blur border border-slate-200 rounded-2xl shadow-xl p-8 transition-transform ${shake ? "animate-[wiggle_0.5s_ease-in-out]" : ""}`}>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 mb-2">{title}</h1>
          <p className="text-slate-500 mb-6">Accède à ton espace et teste l'IA sans RAG ✨</p>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                placeholder="jean-baptiste@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="fullName">Nom Prénom</label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                placeholder="Caron Jean-Baptiste"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="jobTitle">Poste</label>
              <input
                id="jobTitle"
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                placeholder="Technicien sûreté"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="site">Site</label>
              <input
                id="site"
                type="text"
                value={site}
                onChange={(e) => setSite(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                placeholder="CNPE Gravelines"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="password">Mot de passe</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 pr-20 text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="absolute inset-y-0 right-2 my-1 px-3 text-xs rounded-lg border border-slate-300 hover:bg-slate-50"
                >
                  {showPwd ? "Masquer" : "Afficher"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 text-white py-2.5 font-medium shadow-lg shadow-slate-900/10 hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Connexion…" : "Passer à l'enregistrement"}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-6">
            Les informations saisies seront disponibles dans le Dashboard (localStorage.profile).
          </p>
        </div>

        <style>{`
          @keyframes wiggle { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-6px);} 75% { transform: translateX(6px);} }
        `}</style>

        
      </div>
    </div>
  );
}

async function safeText(res: Response) {
  try { return await res.text(); } catch { return ""; }
}