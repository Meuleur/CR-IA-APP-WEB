import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "./store/auth";
import LoginPage from "./pages/LoginPage"; // ajuste le chemin si besoin
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./routes/ProtectedRoute";

function LoginWrapper() {
  const setToken = useAuth((s) => s.setToken);
  const navigate = useNavigate();

  return (
    <LoginPage
      title="Connexion"
      onSuccess={(token) => {
        setToken(token);         // 1) on garde le token en mémoire
        navigate("/dashboard");  // 2) redirection immédiate
      }}
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirige la racine vers /login si pas connecté */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginWrapper />} />

        {/* Zone protégée */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>

        {/* 404 simple */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
