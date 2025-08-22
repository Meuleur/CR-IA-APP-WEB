import React, { useMemo, useState } from "react";

/**
 * LoginPage – page de connexion minimaliste et élégante (Tailwind).
 *
 * ✅ Appelle POST {API_URL}/auth/login avec credentials: "include" pour le cookie httpOnly (refresh).
 * ✅ Récupère { access_token } du JSON et le remonte via onSuccess(token).
 * ✅ Gestion des erreurs + états (loading, disabled) + affichage/shake quand échec.
 * ✅ Bouton "Afficher le mot de passe" et lien placeholder "Mot de passe oublié ?".
 *
 * Usage: <LoginPage onSuccess={(token) => setAuth(token)} />
 *       Définir VITE_API_URL (ex: http://localhost:8000)
 */

export type LoginPageProps = {
  onSuccess?: (accessToken: string) => void;
  title?: string;
};

export default function LoginPage({ onSuccess, title = "Connexion" }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // nécessaire pour le cookie refresh httpOnly
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const text = await safeText(res);
        throw new Error(text || `Erreur ${res.status}`);
      }
      const data = await res.json(); // { access_token }
      if (!data?.access_token) {
        throw new Error("Réponse inattendue du serveur (access_token manquant)");
      }
      onSuccess?.(data.access_token);
      // Option: dispatch un event global si pas de store dispo
      window.dispatchEvent(new CustomEvent("auth:login", { detail: { token: data.access_token } }));
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-700" htmlFor="password">Mot de passe</label>
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  {showPwd ? "Masquer" : "Afficher"}
                </button>
              </div>
              <input
                id="password"
                type={showPwd ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" className="rounded border-slate-300 text-slate-900 focus:ring-slate-900/20" />
                Se souvenir de moi
              </label>
              <a className="text-sm text-slate-600 hover:text-slate-900" href="#">Mot de passe oublié ?</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 text-white py-2.5 font-medium shadow-lg shadow-slate-900/10 hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Connexion…" : "Se connecter"}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-6">
            En continuant, tu acceptes nos conditions d'utilisation.
          </p>
        </div>

        <style>{`
          @keyframes wiggle { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-6px);} 75% { transform: translateX(6px);} }
        `}</style>

        <div className="text-center mt-6 text-sm text-slate-500">
          <span className="opacity-70">Backend attendu sur</span> <code className="px-1.5 py-0.5 rounded bg-slate-200/60 text-slate-800">{API_URL}/auth/login</code>
        </div>
      </div>
    </div>
  );
}

async function safeText(res: Response) {
  try { return await res.text(); } catch { return ""; }
}
