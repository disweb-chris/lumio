// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, cargando } = useAuth();

  // Mientras se resuelve el estado de auth, mostramos un spinner fullscreen
  if (cargando) {
    return (
      <div className="flex items-center justify-center h-screen">
        <svg
          className="animate-spin h-12 w-12 text-blue-600"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8z"
          />
        </svg>
      </div>
    );
  }

  // Si ya cargó y no hay usuario, redirigimos al login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si está autenticado, renderizamos la ruta
  return <>{children}</>;
}
