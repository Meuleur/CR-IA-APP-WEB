import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "./store/auth";
import LoginPage from "./pages/LoginPage"; // ajuste le chemin si besoin
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./routes/ProtectedRoute";

function LoginWrapper() {
  const setToken = useAuth((s) => s.setToken);
  const navigate = useNavigate();
  const setEmail = useAuth((s) => s.setEmail); // 👈 récupère bien l’action

  return (
    <LoginPage
      onSuccess={(token, email) => {
        setToken(token);
        setEmail(email);
        navigate("/dashboard");
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
