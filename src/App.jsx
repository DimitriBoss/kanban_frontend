import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/authContext";
import Login from "./pages/login";
import Register from "./pages/register";
import Board from "./pages/Board";
import Dashboard from "./pages/dashboard";
import Landing from "./pages/landing";

// Route protégée pour les utilisateurs authentifiés
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();

  // Si l'utilisateur n'est pas connecté, redirection vers /login
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Route publique pour empêcher l'accès aux pages d'authentification si déjà connecté
const PublicRoute = ({ children }) => {
  const { user } = useAuth();

  // Si l'utilisateur est déjà connecté, redirection vers le tableau de bord principal
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  return (
    <Routes>
      {/* Routes Publiques */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* Route Landing Page Publique */}
      <Route path="/" element={<Landing />} />

      {/* Routes Protégées */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/boards/:boardId"
        element={
          <ProtectedRoute>
            <Board />
          </ProtectedRoute>
        }
      />

      {/* Redirection par défaut */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
